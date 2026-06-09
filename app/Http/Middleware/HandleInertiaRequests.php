<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Share data ke semua halaman Inertia (termasuk user & role)
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'               => $request->user()->id,
                    'nama'             => $request->user()->nama,
                    'email'            => $request->user()->email,
                    'role'             => $request->user()->role,
                    'foto_profil'      => $request->user()->foto_profil,
                    'wilayah_pengawasan' => $request->user()->wilayah_pengawasan,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
        ]);
    }
}