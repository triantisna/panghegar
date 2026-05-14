"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message || "Login gagal, periksa kembali kredensial Anda.",
        );
        return;
      }

      // Arahkan sesuai role
      if (data.role === "CEO") {
        router.push("/dashboard/ceo");
      } else if (data.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (data.role === "PM") {
        router.push("/dashboard/pm");
      } else if (data.role === "TECH") {
        router.push("/dashboard/tech");
      } else if (data.role === "ENGINEER") {
        router.push("/dashboard/engineer");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Terjadi kesalahan pada server. Coba beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-sky-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Panghegar Project System
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Silakan masuk untuk mengelola proyek dan biaya operasional.
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-8 py-8">
          <h2 className="text-xl font-semibold text-white mb-1">
            Masuk ke akun Anda
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Akses khusus untuk CEO, Admin, Project Manager, dan Teknisi.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-200 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-cyan-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isLoading ? "Memproses..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-slate-500 text-center">
            Akun dibuat oleh Admin. Hubungi Admin jika lupa password atau butuh
            akses baru.
          </p>
        </div>
      </div>
    </div>
  );
}
