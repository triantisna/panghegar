// src/app/project/[id]/MaterialUsageSection.js
"use client";

import { useEffect, useState } from "react";

export default function MaterialUsageSection({ projectId }) {
  const [usage, setUsage] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    usedAt: "",
    materialId: "",
    quantity: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("");

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/material-usage?projectId=${projectId}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch usage (${res.status})`);
      }
      const data = await res.json();
      setUsage(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [projectId]);

  useEffect(() => {
    const fetchRoleAndMaterials = async () => {
      try {
        const [sessRes, matRes] = await Promise.all([
          fetch("/api/v1/auth/session"),
          fetch("/api/v1/materials"),
        ]);

        if (sessRes.ok) {
          const data = await sessRes.json();
          setRole(data.role);
        }

        if (matRes.ok) {
          const m = await matRes.json();
          setMaterials(m.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoleAndMaterials();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!form.materialId || !form.quantity) {
      setError("Material dan jumlah wajib diisi");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/material-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          materialId: form.materialId,
          quantity: form.quantity,
          usedAt: form.usedAt || null,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error((data && data.message) || `Failed (${res.status})`);
      }

      setForm({
        usedAt: "",
        materialId: "",
        quantity: "",
      });
      await fetchUsage();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8 text-black">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Pemakaian Material
      </h2>

      {loading ? (
        <p className="text-slate-500 text-sm italic">Memuat data...</p>
      ) : error ? (
        <p className="text-red-500 mb-4 text-sm">{error}</p>
      ) : (
        <>
          {/* TABEL PEMAKAIAN (Dilihat oleh semua role) */}
          <div className="mb-6 max-h-80 overflow-y-auto border border-slate-100 rounded-lg">
            {usage.length === 0 ? (
              <p className="p-10 text-center text-gray-500 text-sm">
                Belum ada data pemakaian material tercatat.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left p-3">Tanggal</th>
                    <th className="text-left p-3">Material</th>
                    <th className="text-left p-3">Jumlah</th>
                    <th className="text-left p-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usage.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-slate-600">
                        {new Date(u.usedAt).toLocaleDateString("id-ID", {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="p-3 font-medium">
                        {u.material?.name} <span className="text-[10px] text-slate-400 font-normal">({u.material?.unit})</span>
                      </td>
                      <td className="p-3 font-semibold text-sky-700">{u.quantity}</td>
                      <td className="p-3 text-slate-500">{u.usedBy?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FORM INPUT: HANYA UNTUK TECH DAN PM */}
          {["TECH", "PM"].includes(role) ? (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Catat Pemakaian Material Baru
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggal</label>
                    <input
                      type="date"
                      name="usedAt"
                      value={form.usedAt}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pilih Material</label>
                    <select
                      name="materialId"
                      value={form.materialId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="">- Cari material -</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Jumlah Pemakaian</label>
                    <input
                      type="number"
                      step="any"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm transition disabled:opacity-50"
                  >
                    {submitting ? "Memproses..." : "Simpan Pemakaian"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-center gap-3">
              <span className="text-amber-600">ℹ️</span>
              <p className="text-xs text-amber-700">
                Pencatatan pemakaian material hanya dapat dilakukan oleh <strong>Teknisi</strong> atau <strong>Project Manager</strong>.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
