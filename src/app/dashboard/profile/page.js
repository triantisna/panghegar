"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/app/project/[id]/BackButton";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/v1/auth/session");
        if (!res.ok) {
          router.push("/");
          return;
        }
        const data = await res.json();
        setUser(data);
        setName(data.name || "");
      } catch (e) {
        console.error(e);
      }
    };
    fetchSession();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    const ok = window.confirm("Apakah Anda yakin akan merubah data profile?");
    if (!ok) return;

    try {
      setSaving(true);
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          password: password || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menyimpan perubahan");
      }
      setPassword("");
      setMessage("Perubahan berhasil disimpan.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Memuat profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Pengaturan Akun
              </p>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                Profile
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-5 md:p-6">
          <div className="flex flex-col items-center justify-center gap-3 mb-6">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-semibold">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="text-center">
              <p className="text-sm md:text-base font-semibold text-slate-900">
                {user.name}
              </p>
              <p className="text-xs md:text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nama
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama tampilan"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-xs text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Minimal 8 karakter disarankan.
              </p>
            </div>

            {message && <p className="text-xs text-slate-600">{message}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-xs md:text-sm font-medium shadow-sm hover:bg-sky-700 disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
