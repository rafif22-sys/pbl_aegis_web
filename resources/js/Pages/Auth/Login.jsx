import { Head, useForm } from "@inertiajs/react";
import { Mail, Lock, ShieldCheck } from "lucide-react";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/login");
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex overflow-hidden">

                {/* LEFT SIDE */}
                <div className="hidden md:flex w-1/2 relative bg-[#0F2A44] text-white items-center justify-center px-12">

                    {/* Background Glow */}
                    <div className="absolute top-[-120px] left-[-120px] w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-120px] right-[-120px] w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                            backgroundSize: "40px 40px",
                        }}
                    />

                    <div className="relative z-10 max-w-md text-center">

                        <div className="flex justify-center mb-6">
                            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
                                <img
                                    src="https://dwyfjwwgrtdspgdaifyv.supabase.co/storage/v1/object/public/logo/logo_aegis_full.png"
                                    alt="Aegis Logo"
                                    className="w-64 h-auto object-contain"
                                />
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-[#00152A] px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                            <ShieldCheck size={18} className="text-cyan-300" />

                            <div className="text-sm text-gray-200 leading-relaxed text-left">
                                <div>Sistem Pelaporan Patroli Keamanan</div>
                                <div>yang Terpadu dan Responsif</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-[#E7F8FF] to-[#D9F1FF] flex items-center justify-center px-6">

                    <div className="w-full max-w-md">

                        {/* MOBILE LOGO */}
                        <div className="md:hidden flex justify-center mb-8">
                            <img
                                src="https://dwyfjwwgrtdspgdaifyv.supabase.co/storage/v1/object/public/logo/logo_aegis_full.png"
                                alt="Aegis Logo"
                                className="w-44"
                            />
                        </div>

                        {/* CARD */}
                        <div className="bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/40">

                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-[#0F2A44]">
                                    Selamat Datang
                                </h2>

                                <p className="text-gray-600 mt-2">
                                    Silahkan masuk ke pusat komando AEGIS
                                </p>
                            </div>

                            {errors.email && (
                                <div className="bg-red-100 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-5">
                                    {errors.email}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* EMAIL */}
                                <div>
                                    <label className="text-sm font-medium text-[#0F2A44] mb-2 block">
                                        Email
                                    </label>

                                    <div className="relative">
                                        <Mail
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="email"
                                            placeholder="Masukkan email Anda"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F2A44] transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div>
                                    <label className="text-sm font-medium text-[#0F2A44] mb-2 block">
                                        Password
                                    </label>

                                    <div className="relative">
                                        <Lock
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="password"
                                            placeholder="Masukkan password Anda"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData("password", e.target.value)
                                            }
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F2A44] transition-all duration-300"
                                        />
                                    </div>
                                </div>

                                {/* REMEMBER */}
                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData("remember", e.target.checked)
                                            }
                                            className="rounded border-gray-300 text-[#0F2A44] focus:ring-[#0F2A44]"
                                        />

                                        Ingatkan Saya
                                    </label>

                                    <button
                                        type="button"
                                        className="text-[#0F2A44] hover:underline"
                                    >
                                        Lupa Password?
                                    </button>
                                </div>

                                {/* BUTTON */}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#0F2A44] hover:bg-[#13385C] text-white py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-[#0F2A44]/30 hover:scale-[1.02]"
                                >
                                    {processing ? "Loading..." : "Masuk"}
                                </button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}