"use client";

import React, { useState, useEffect } from "react";
import ProjectList from "@/components/ProjectList";
import Link from "next/link";
import { useRouter } from "next/navigation";

const EngineerDashboard = () => {
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/v1/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        setUserName(data.name || "");
      } catch (e) {
        console.error("Failed to fetch user data");
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/v1/users/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Dashboard Engineer
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold hover:bg-slate-200"
              >
                {userName?.[0]?.toUpperCase() || "E"}
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
            Daftar Proyek Anda
          </h2>
          <Link href="/dashboard/engineer/addProject">
            <button className="inline-flex items-center rounded-full bg-sky-600 text-white text-xs md:text-sm font-medium px-4 py-2 shadow-sm hover:bg-sky-700 transition">
              + Tambah Proyek & Dokumen
            </button>
          </Link>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Kelola proyek baru dan lampirkan dokumen RAB serta Surat Perjanjian.
        </p>

        <ProjectList />
      </main>
    </div>
  );
};

export default EngineerDashboard;
