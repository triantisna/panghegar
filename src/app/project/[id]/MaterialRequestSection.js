"use client";

import { useEffect, useState } from "react";

export default function MaterialRequestSection({ projectId }) {
  const [requests, setRequests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    materialId: "",
    quantity: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/v1/material-requests?projectId=${projectId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch requests");
      setRequests(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
          setUserId(data.userId || data.id);
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
      const res = await fetch("/api/v1/material-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          materialId: form.materialId,
          quantity: form.quantity,
          reason: form.reason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create request");

      setForm({
        materialId: "",
        quantity: "",
        reason: "",
      });
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId, action) => {
    try {
      const res = await fetch(
        `/api/v1/material-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update request");
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8 text-black">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Permintaan Material
      </h2>
      
      {loading ? (
        <p className="text-sm text-slate-500 italic">Memuat permintaan...</p>
      ) : error ? (
        <p className="text-red-500 mb-4 text-sm">{error}</p>
      ) : (
        <>
          {/* TABEL PERMINTAAN (Dilihat oleh semua role) */}
          <div className="mb-6 max-h-80 overflow-y-auto border border-slate-100 rounded-lg">
            {requests.length === 0 ? (
              <p className="p-10 text-center text-gray-500 text-sm">
                Belum ada permintaan material.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left p-3">Material</th>
                    <th className="text-left p-3">Jumlah</th>
                    <th className="text-left p-3">Peminta</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <span className="font-medium text-slate-900">{r.material?.name}</span>
                        <div className="text-[10px] text-slate-400">{r.reason || "Tanpa alasan"}</div>
                      </td>
                      <td className="p-3">{r.quantity} {r.material?.unit}</td>
                      <td className="p-3 text-slate-500">{r.requestedBy?.name || "-"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.status === "PENDING" &&
                        ["PM", "CEO"].includes(role) &&
                        r.requestedById !== userId ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r.id, "APPROVE")}
                              className="px-3 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(r.id, "REJECT")}
                              className="px-3 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
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
                <span className="h-4 w-4 bg-sky-500 rounded text-white flex items-center justify-center text-[10px]">?</span>
                Ajukan Permintaan Material Baru
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex-1">
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
                  <div className="w-full md:w-32">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Jumlah</label>
                    <input
                      type="number"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Alasan / Urgensi</label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                    rows={2}
                    placeholder="Contoh: Stok di lokasi habis..."
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : "Kirim Permintaan"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-lg">🔒</span>
                <p className="text-xs text-slate-500">
                  {role === "CEO" 
                    ? "Anda memiliki hak akses untuk menyetujui (Approve) permintaan, namun tidak dapat mengajukan permintaan material baru."
                    : "Penyusunan permintaan material hanya dapat dilakukan oleh Teknisi atau PM."}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
