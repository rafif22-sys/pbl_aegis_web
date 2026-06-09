<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // ── Helper: Upload ke Supabase ───────────────────────
    private function uploadToSupabase(UploadedFile $file, string $path): string
    {
        $supabaseUrl = config('services.supabase.url');
        $supabaseKey = config('services.supabase.key');
        $bucket      = config('services.supabase.bucket');

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$supabaseKey}",
            'x-upsert'      => 'true',
        ])->attach(
            'file',
            fopen($file->getRealPath(), 'r'),
            $file->getClientOriginalName(),
            ['Content-Type' => $file->getMimeType()]
        )->post("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if (!$response->successful()) {
            Log::error('Supabase upload gagal', [
                'path'   => $path,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Gagal upload foto: ' . $response->body());
        }

        return $path;
    }

    // ── Helper: Hapus dari Supabase ──────────────────────
    private function deleteFromSupabase(string $path): void
    {
        $supabaseUrl = config('services.supabase.url');
        $supabaseKey = config('services.supabase.key');
        $bucket      = config('services.supabase.bucket');

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$supabaseKey}",
        ])->delete("{$supabaseUrl}/storage/v1/object/{$bucket}/{$path}");

        if (!$response->successful()) {
            Log::warning('Supabase delete gagal', [
                'path'   => $path,
                'status' => $response->status(),
            ]);
        }
    }

    // ── Helper: Bangun path foto ─────────────────────────
    private function buildFotoPath(string $role, string $nama, string $ext): string
    {
        $uniqueId = Str::random(8);
        return "foto_profil/{$role}/" . Str::slug($nama) . "_{$uniqueId}.{$ext}";
    }

    /**
     * FIX: Helper untuk redirect ke index dengan mempertahankan filter aktif.
     *
     * Masalah sebelumnya: redirect()->route('admin.users.index') tidak membawa
     * query params (search, role), sehingga controller index() menerima request
     * kosong dan mengembalikan semua data tanpa filter.
     *
     * Solusi: simpan filter dari request saat ini ke session flash, lalu saat
     * redirect ke index, sertakan filter tersebut sebagai query string.
     */
    private function redirectToIndexWithFilters(Request $request, string $flashKey, string $flashMessage)
    {
        // Ambil filter yang sedang aktif dari request (dikirim via query string)
        $filters = array_filter([
            'search' => $request->query('search'),
            'role'   => $request->query('role'),
        ]);

        return redirect()
            ->route('admin.users.index', $filters)
            ->with($flashKey, $flashMessage);
    }

    // ── INDEX ────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query
            ->with('supervisor:id,nama')
            ->whereIn('role', ['petugas', 'supervisor', 'warga'])
            ->select(
                'id', 'id_supervisor', 'nama', 'email', 'role',
                'jenis_kelamin',
                'alamat', 'no_hp',
                'tanggal_lahir', 'tanggal_bergabung', 'wilayah_pengawasan', 'foto_profil'
            )
            ->orderBy('nama')
            ->paginate(10)
            ->withQueryString();

        $supabaseUrl = config('services.supabase.url');
        $bucket      = config('services.supabase.bucket');

        $users->getCollection()->transform(function ($user) use ($supabaseUrl, $bucket) {
            $user->foto_url = $user->foto_profil
                ? "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$user->foto_profil}"
                : null;
            return $user;
        });

        $stats = [
            'petugas'    => User::where('role', 'petugas')->count(),
            'supervisor' => User::where('role', 'supervisor')->count(),
            'warga'      => User::where('role', 'warga')->count(),
            'admin'      => User::where('role', 'admin')->count(),
        ];

        $supervisors = User::where('role', 'supervisor')
            ->select('id', 'nama')
            ->orderBy('nama')
            ->get();

        return Inertia::render('Admin/ManajemenUser', [
            'users'       => $users,
            'stats'       => $stats,
            'filters'     => $request->only(['search', 'role']),
            'supervisors' => $supervisors,
        ]);
    }

    // ── STORE ────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'               => 'required|string|max:255',
            'email'              => 'required|email|unique:users,email',
            'role'               => 'required|in:petugas,supervisor,warga',
            'jenis_kelamin'      => 'nullable|in:laki-laki,perempuan',
            'alamat'             => 'nullable|string|max:500',
            'no_hp'              => 'nullable|string|max:20',
            'tanggal_lahir'      => 'nullable|date',
            'tanggal_bergabung'  => 'nullable|date|required_if:role,petugas|required_if:role,supervisor',
            'wilayah_pengawasan' => 'nullable|string|max:255|required_if:role,supervisor',
            'id_supervisor'      => 'nullable|exists:users,id|required_if:role,petugas',
            'foto_profil'        => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
            'password'           => 'required|string|min:8|confirmed',
        ], [
            'nama.required'                  => 'Nama wajib diisi.',
            'email.required'                 => 'Email wajib diisi.',
            'email.email'                    => 'Format email tidak valid.',
            'email.unique'                   => 'Email sudah digunakan.',
            'role.required'                  => 'Role wajib dipilih.',
            'role.in'                        => 'Role tidak valid.',
            'jenis_kelamin.in'               => 'Pilih laki-laki atau perempuan.',
            'tanggal_bergabung.required_if'  => 'Tanggal bergabung wajib diisi untuk petugas/supervisor.',
            'wilayah_pengawasan.required_if' => 'Wilayah pengawasan wajib diisi untuk supervisor.',
            'id_supervisor.required_if'      => 'Supervisor wajib dipilih untuk petugas.',
            'id_supervisor.exists'           => 'Supervisor tidak ditemukan.',
            'foto_profil.required'           => 'Foto profil wajib diunggah.',
            'foto_profil.image'              => 'File harus berupa gambar.',
            'foto_profil.mimes'              => 'Format gambar harus jpg, jpeg, png, atau webp.',
            'foto_profil.max'                => 'Ukuran gambar maksimal 2MB.',
            'password.required'              => 'Password wajib diisi.',
            'password.min'                   => 'Password minimal 8 karakter.',
            'password.confirmed'             => 'Konfirmasi password tidak cocok.',
        ]);

        try {
            $ext      = $request->file('foto_profil')->getClientOriginalExtension();
            $path     = $this->buildFotoPath($validated['role'], $validated['nama'], $ext);
            $fotoPath = $this->uploadToSupabase($request->file('foto_profil'), $path);
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->withErrors(['foto_profil' => 'Gagal mengunggah foto. Silakan coba lagi.']);
        }

        User::create([
            'nama'               => $validated['nama'],
            'email'              => $validated['email'],
            'role'               => $validated['role'],
            'jenis_kelamin'      => $validated['jenis_kelamin'] ?? null,
            'alamat'             => $validated['alamat'] ?? null,
            'no_hp'              => $validated['no_hp'] ?? null,
            'tanggal_lahir'      => $validated['tanggal_lahir'] ?? null,
            'tanggal_bergabung'  => in_array($validated['role'], ['petugas', 'supervisor'])
                                        ? ($validated['tanggal_bergabung'] ?? null) : null,
            'wilayah_pengawasan' => $validated['role'] === 'supervisor'
                                        ? ($validated['wilayah_pengawasan'] ?? null) : null,
            'id_supervisor'      => $validated['role'] === 'petugas'
                                        ? ($validated['id_supervisor'] ?? null) : null,
            'foto_profil'        => $fotoPath,
            'password'           => Hash::make($validated['password']),
        ]);

        // FIX: Redirect dengan filter aktif agar tampilan tidak reset
        return $this->redirectToIndexWithFilters($request, 'success', 'User berhasil ditambahkan.');
    }

    // ── UPDATE ───────────────────────────────────────────
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'nama'               => 'required|string|max:255',
            'email'              => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role'               => 'required|in:petugas,supervisor,warga',
            'jenis_kelamin'      => 'nullable|in:laki-laki,perempuan',
            'alamat'             => 'nullable|string|max:500',
            'no_hp'              => 'nullable|string|max:20',
            'tanggal_lahir'      => 'nullable|date',
            'tanggal_bergabung'  => 'nullable|date|required_if:role,petugas|required_if:role,supervisor',
            'wilayah_pengawasan' => 'nullable|string|max:255|required_if:role,supervisor',
            'id_supervisor'      => 'nullable|exists:users,id|required_if:role,petugas',
            'foto_profil'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'password'           => 'nullable|string|min:8|confirmed',
        ], [
            'nama.required'                  => 'Nama wajib diisi.',
            'email.required'                 => 'Email wajib diisi.',
            'email.email'                    => 'Format email tidak valid.',
            'email.unique'                   => 'Email sudah digunakan.',
            'role.required'                  => 'Role wajib dipilih.',
            'role.in'                        => 'Role tidak valid.',
            'jenis_kelamin.in'               => 'Pilih laki-laki atau perempuan.',
            'tanggal_bergabung.required_if'  => 'Tanggal bergabung wajib diisi untuk petugas/supervisor.',
            'wilayah_pengawasan.required_if' => 'Wilayah pengawasan wajib diisi untuk supervisor.',
            'id_supervisor.required_if'      => 'Supervisor wajib dipilih untuk petugas.',
            'id_supervisor.exists'           => 'Supervisor tidak ditemukan.',
            'foto_profil.image'              => 'File harus berupa gambar.',
            'foto_profil.mimes'              => 'Format gambar harus jpg, jpeg, png, atau webp.',
            'foto_profil.max'                => 'Ukuran gambar maksimal 2MB.',
            'password.min'                   => 'Password minimal 8 karakter.',
            'password.confirmed'             => 'Konfirmasi password tidak cocok.',
        ]);

        $dataUpdate = [
            'nama'               => $validated['nama'],
            'email'              => $validated['email'],
            'role'               => $validated['role'],
            'jenis_kelamin'      => $validated['jenis_kelamin'] ?? null,
            'alamat'             => $validated['alamat'] ?? null,
            'no_hp'              => $validated['no_hp'] ?? null,
            'tanggal_lahir'      => $validated['tanggal_lahir'] ?? null,
            'tanggal_bergabung'  => in_array($validated['role'], ['petugas', 'supervisor'])
                                        ? ($validated['tanggal_bergabung'] ?? null) : null,
            'wilayah_pengawasan' => $validated['role'] === 'supervisor'
                                        ? ($validated['wilayah_pengawasan'] ?? null) : null,
            'id_supervisor'      => $validated['role'] === 'petugas'
                                        ? ($validated['id_supervisor'] ?? null) : null,
        ];

        if ($request->hasFile('foto_profil')) {
            try {
                if ($user->foto_profil) {
                    $this->deleteFromSupabase($user->foto_profil);
                }
                $ext  = $request->file('foto_profil')->getClientOriginalExtension();
                $path = $this->buildFotoPath($validated['role'], $validated['nama'], $ext);
                $dataUpdate['foto_profil'] = $this->uploadToSupabase($request->file('foto_profil'), $path);
            } catch (\Exception $e) {
                return back()
                    ->withInput()
                    ->withErrors(['foto_profil' => 'Gagal mengunggah foto. Silakan coba lagi.']);
            }
        }

        if (!empty($validated['password'])) {
            $dataUpdate['password'] = Hash::make($validated['password']);
        }

        $user->update($dataUpdate);

        // FIX: Redirect dengan filter aktif agar tampilan tidak reset
        return $this->redirectToIndexWithFilters($request, 'success', 'Data user berhasil diperbarui.');
    }

    // ── DESTROY ──────────────────────────────────────────
    public function destroy(Request $request, User $user)
    {
        if ($user->id === Auth::id()) {
            return $this->redirectToIndexWithFilters($request, 'error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        if ($user->foto_profil) {
            $this->deleteFromSupabase($user->foto_profil);
        }

        $user->delete();

        // FIX: Redirect dengan filter aktif agar tampilan tidak reset
        return $this->redirectToIndexWithFilters($request, 'success', 'User berhasil dihapus.');
    }
}