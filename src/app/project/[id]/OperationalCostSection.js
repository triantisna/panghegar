"use client";
import { useEffect, useState } from "react";

export default function OperationalCostSection({ projectId }) {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State Form
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [photo, setPhoto] = useState(null);

  const fetchCosts = async () => {
  setLoading(true);
  try {
    const res = await fetch(`/api/v1/operational-costs?projectId=${projectId}`);
    if (!res.ok) throw new Error("Gagal mengambil data biaya");
    
    const data = await res.json();
    setCosts(data.data || []);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { 
    fetchCosts();
    fetch("/api/v1/auth/session").then(res => res.json()).then(data => {
      setRole(data.role);
      setUserId(data.id || data.userId);
    });
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("date", date);
      formData.append("description", description);
      formData.append("amount", amount);
      if (photo) formData.append("photo", photo);

      const res = await fetch("/api/v1/operational-costs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal menyimpan biaya");
      
      setDate(""); setDescription(""); setAmount(""); setPhoto(null);
      await fetchCosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id, action) => {
    const res = await fetch(`/api/v1/operational-costs/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) { await fetchCosts();
    } else {
        // Cek apakah ada konten sebelum diparse sebagai JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          alert(err.message);
        } else {
          alert("Terjadi kesalahan pada server (Gagal memproses approval)");
        }
      }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8 text-black">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Biaya Operasional</h2>

      {/* Tabel View-Only untuk semua role */}
      <div className="mb-8 overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">Deskripsi</th>
              <th className="p-3 text-right">Jumlah</th>
              <th className="p-3 text-center">Bukti</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {costs.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-3">{new Date(c.date).toLocaleDateString("id-ID")}</td>
                <td className="p-3">
                  <div className="font-medium">{c.description}</div>
                  <div className="text-[10px] text-slate-400 font-normal">Oleh: {c.user?.name}</div>
                </td>
                <td className="p-3 text-right font-bold text-sky-700">Rp {Number(c.amount).toLocaleString("id-ID")}</td>
                <td className="p-3 text-center">
                  {c.receiptUrl ? (
                    <a href={c.receiptUrl} target="_blank" rel="noreferrer" className="text-sky-600 underline text-xs">Lihat</a>
                  ) : "-"}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>{c.status}</span>
                </td>
                <td className="p-3 text-center">
                  {c.status === "PENDING" && c.userId !== userId && (role === "CEO" || (role === "PM" && c.user?.role?.name === "TECH")) ? (
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleApprove(c.id, "APPROVE")} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px]">Approve</button>
                      <button onClick={() => handleApprove(c.id, "REJECT")} className="bg-rose-600 text-white px-2 py-1 rounded text-[10px]">Reject</button>
                    </div>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Input untuk Semua Role */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Catat Pengeluaran Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded-lg text-sm" required />
            <input type="text" placeholder="Deskripsi (Misal: BBM Kendaraan)" value={description} onChange={e => setDescription(e.target.value)} className="p-2 border rounded-lg text-sm md:col-span-1" required />
            <input type="number" placeholder="Jumlah (Rp)" value={amount} onChange={e => setAmount(e.target.value)} className="p-2 border rounded-lg text-sm" required />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Upload Bukti / Struk (Gambar)</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-slate-700 border rounded-lg w-full" />
            </div>
            <button disabled={submitting} className="bg-sky-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-sky-700 transition self-end">
              {submitting ? "Menyimpan..." : "Simpan Pengeluaran"}
            </button>
          </div>
          {error && <p className="text-rose-600 text-xs mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}