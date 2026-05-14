"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/app/lib/formatCurrency";
import ProjectListGrid from "@/components/ProjectListGrid";

export default function PmDashboard() {
  const [projects, setProjects] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        const [sessionRes, projRes] = await Promise.all([
          fetch("/api/v1/auth/session"),
          fetch("/api/v1/projects/for-pm"),
        ]);

        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setUserName(s.name || "");
        }

        const data = await projRes.json();
        if (!projRes.ok) {
          throw new Error(data.message || "Failed to fetch projects");
        }
        setProjects(data.data || []);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProjects();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/users/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Dashboard PM
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold hover:bg-slate-200"
              >
                {userName?.[0]?.toUpperCase() || "U"}
              </Link>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                Hallo, <span className="text-sky-600">{userName}</span>
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs md:text-sm font-medium shadow-sm hover:bg-rose-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base md:text-lg font-semibold text-slate-900">
            Proyek yang Anda Kelola
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Daftar proyek di mana Anda terdaftar sebagai Project Manager.
        </p>

        {projects.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              Belum ada proyek yang ditugaskan kepada Anda.
            </p>
          </div>
        ) : (
          <ProjectListGrid projects={projects} variant="PM" />
        )}
      </main>
    </div>
  );
}
