"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RabSummarySection({
  projectId,
  role,
  summary,
  estimates,
  documents = [], // Terima props dokumen dari parent
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [material, setMaterial] = useState("");
  const [operational, setOperational] = useState("");
  const [rabFile, setRabFile] = useState(null);
  const [kontrakFile, setKontrakFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approveLoadingId, setApproveLoadingId] = useState(null);
  const [error, setError] = useState("");

  const approvedEstimates = estimates.filter((e) => e.status === "APPROVED");
  const latestApproved = approvedEstimates[approvedEstimates.length - 1] || null;
  const pendingEstimates = estimates.filter((e) => e.status === "PENDING");

  // Filter dokumen khusus RAB dan Surat Kontrak
  const projectDocs = documents.filter((d) => ["RAB_PDF", "SURAT_KONTRAK"].includes(d.type));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!material || !operational) {
      setError("RAB material dan operasional wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("estimatedMaterialCost", material);
      formData.append("estimatedOperationalCost", operational);
      if (rabFile) formData.append("rabFile", rabFile);
      if (kontrakFile) formData.append("kontrakFile", kontrakFile);

      const res = await fetch(`/api/v1/projects/${projectId}/estimates`, {
        method: "POST",
        body: formData, // Menggunakan FormData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan RAB");

      setShowForm(false);
      setMaterial(""); setOperational("");
      setRabFile(null); setKontrakFile(null);
      router.refresh(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (estimateId, action) => {
    setError(""); setApproveLoadingId(estimateId);
    try {
      const res = await fetch(`/api/v1/projects/estimates/${estimateId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }), 
      });
      if (!res.ok) throw new Error("Gagal mengubah status RAB");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setApproveLoadingId(null);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Hapus dokumen ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/v1/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus dokumen");
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">RAB & Dokumen Proyek</h2>
        {/* Tombol Input RAB hanya untuk ENGINEER dan CEO */}
        {(role === "ENGINEER" || role === "CEO") && (
          <button onClick={() => setShowForm((v) => !v)} className="text-xs bg-sky-600 text-white px-3 py-1.5 rounded hover:bg-sky-700 font-medium">
            + Input / Revisi RAB & Berkas
          </button>
        )}
      </div>

      {latestApproved ? (
        <p className="text-xs text-gray-500 mb-4">RAB disetujui pada {new Date(latestApproved.createdAt).toLocaleDateString("id-ID")}</p>
      ) : (
        <p className="text-xs text-rose-500 mb-4">Belum ada RAB yang disetujui. Nilai RAB masih 0.</p>
      )}

      {/* Grid Ringkasan RAB (Sama seperti sebelumnya) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-6">
        <div className="border rounded p-3">
          <p className="font-semibold text-gray-700 mb-1">RAB</p>
          <p className="text-gray-600">Material: Rp. {summary.rabMaterial.toLocaleString("id-ID")}</p>
          <p className="text-gray-600">Operasional: Rp. {summary.rabOperational.toLocaleString("id-ID")}</p>
          <p className="mt-1 font-semibold text-gray-800">Total: Rp. {summary.rabTotal.toLocaleString("id-ID")}</p>
        </div>
        <div className="border rounded p-3">
          <p className="font-semibold text-gray-700 mb-1">Realisasi</p>
          <p className="text-gray-600">Material: Rp. {summary.realMaterial.toLocaleString("id-ID")}</p>
          <p className="text-gray-600">Operasional: Rp. {summary.realOperational.toLocaleString("id-ID")}</p>
          <p className="mt-1 font-semibold text-gray-800">Total: Rp. {summary.realTotal.toLocaleString("id-ID")}</p>
        </div>
        <div className="border rounded p-3">
          <p className="font-semibold text-gray-700 mb-1">Selisih</p>
          <p className={summary.diffTotal > 0 ? "text-rose-600 font-semibold" : summary.diffTotal < 0 ? "text-emerald-600 font-semibold" : "text-gray-700 font-semibold"}>
            {summary.diffTotal > 0 ? "Over budget" : summary.diffTotal < 0 ? "Under budget" : "Sesuai RAB"}
          </p>
          <p className="text-gray-800">Rp. {summary.diffTotal.toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* Daftar Berkas Dokumen (Khusus Engineer & CEO) */}
      {(role === "ENGINEER" || role === "CEO") && projectDocs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 border-b pb-1">Berkas Proyek Terlampir</h3>
          <ul className="grid md:grid-cols-2 gap-3">
            {projectDocs.map(doc => (
              <li key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-xs font-medium text-slate-700">
                  {doc.type === "RAB_PDF" ? "📄 File RAB" : "📄 Surat Kontrak"}
                </span>
                <div className="flex gap-2">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs bg-sky-100 text-sky-700 px-3 py-1 rounded hover:bg-sky-200 transition">View</a>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded hover:bg-rose-200 transition">Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* List RAB PENDING */}
      {pendingEstimates.length > 0 && (
        <div className="mt-2 border-t pt-4 text-xs">
          <p className="font-semibold text-slate-700 mb-2">Pengajuan Revisi RAB Menunggu Persetujuan:</p>
          <ul className="space-y-2">
            {pendingEstimates.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                <span className="text-slate-700">
                  Total Diajukan: <strong className="text-slate-900">Rp. {e.totalEstimate.toLocaleString("id-ID")}</strong>
                </span>
                {role === "CEO" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(e.id, "APPROVE")} disabled={approveLoadingId === e.id} className="px-3 py-1 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700">Approve</button>
                    <button onClick={() => handleApprove(e.id, "REJECT")} disabled={approveLoadingId === e.id} className="px-3 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-700">Reject</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form input/update RAB (Engineer & CEO) */}
      {showForm && (role === "ENGINEER" || role === "CEO") && (
        <div className="mt-6 border border-sky-200 bg-sky-50 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-sky-900 mb-3 border-b border-sky-100 pb-2">
            Input Nilai & Unggah Berkas Baru
            <span className="text-xs font-normal text-sky-700 block mt-1">(Akan berstatus {role === "CEO" ? "APPROVED" : "PENDING"})</span>
          </h3>
          {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-color-black text-slate-700 mb-1">RAB Material (Rp) *</label>
                <input type="number" value={material} onChange={(e) => setMaterial(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-sky-500 outline-none text-black" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">RAB Operasional (Rp) *</label>
                <input type="number" value={operational} onChange={(e) => setOperational(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-sky-500 outline-none text-black" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Unggah PDF RAB (Opsional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setRabFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Unggah PDF Surat Kontrak (Opsional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setKontrakFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60 transition shadow-sm">
                {loading ? "Mengunggah & Menyimpan..." : "Ajukan Dokumen & RAB"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}