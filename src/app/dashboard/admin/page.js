// src/app/dashboard/admin/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const roleOptions = ["CEO", "ADMIN", "PM", "TECH", "ENGINEER"];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, usersRes] = await Promise.all([
          fetch("/api/v1/auth/session"),
          fetch("/api/v1/users"),
        ]);

        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setUserName(s.name || "");
        }

        const data = await usersRes.json();
        if (!usersRes.ok) {
          throw new Error(data.message || "Failed to fetch users");
        }

        setUsers(
          (data.data || []).map((u) => ({
            ...u,
            roleName: u.role?.name || "",
          })),
        );
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, roleName: newRole } : u)),
    );
  };

  const handleToggleActive = (userId) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)),
    );
  };

  const handleSave = async (user) => {
    try {
      setSavingId(user.id);
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: user.roleName,
          isActive: user.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user");
      alert("Update success");
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

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
              Dashboard Admin
            </p>
            <h1 className="text-lg md:text-xl font-semibold text-slate-900">
              Hallo, <span className="text-sky-600">{userName}</span>
            </h1>
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
            Manajemen Pegawai
          </h2>
          <Link href="/dashboard/admin/addEmployee">
            <button className="inline-flex items-center rounded-full bg-sky-600 text-white text-xs md:text-sm font-medium px-4 py-2 shadow-sm hover:bg-sky-700 transition">
              + Tambah Pegawai
            </button>
          </Link>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Atur role dan status aktif pegawai untuk mengelola akses sistem.
        </p>

        <div className="mt-4 overflow-x-auto bg-white rounded-xl shadow border border-slate-200">
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 text-center text-slate-500">
                <th className="px-4 py-2.5 text-left">Nama</th>
                <th className="px-4 py-2.5 text-left">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Aktif</th>
                <th className="px-4 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-100 text-slate-900"
                >
                  <td className="px-4 py-2.5">{u.name}</td>
                  <td className="px-4 py-2.5">{u.email}</td>
                  <td className="px-4 py-2.5 text-center">
                    <select
                      value={u.roleName}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border border-slate-300 rounded-md px-2 py-1 text-xs md:text-sm bg-white"
                    >
                      <option value="" disabled>
                        Pilih role
                      </option>
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={u.isActive}
                      onChange={() => handleToggleActive(u.id)}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleSave(u)}
                      disabled={savingId === u.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] md:text-xs font-medium hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {savingId === u.id ? "Saving..." : "Update Change"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
