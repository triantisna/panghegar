"use client";
import { useEffect, useState } from "react";

export default function ProgressReportSection({ projectId, role }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // DIPISAH: State untuk Form Master (PM)
  const [masterNotes, setMasterNotes] = useState("");
  const [percent, setPercent] = useState("");

  // DIPISAH: State untuk Form Harian (TECH/PM)
  const [dailyNotes, setDailyNotes] = useState("");
  const [photo, setPhoto] = useState(null);

  const fetchReports = async () => {
    const res = await fetch(`/api/v1/progress-reports?projectId=${projectId}`);
    const data = await res.json();
    setReports(data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [projectId]);

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      
      if (type === "MASTER") {
        formData.append("percentComplete", percent);
        formData.append("notes", masterNotes); // Gunakan masterNotes
      } else {
        formData.append("notes", dailyNotes); // Gunakan dailyNotes
        if (photo) formData.append("photo", photo);
      }

      const res = await fetch("/api/v1/progress-reports", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal menyimpan laporan");

      // Reset sesuai form yang dikirim
      if (type === "MASTER") {
        setMasterNotes(""); setPercent("");
      } else {
        setDailyNotes(""); setPhoto(null);
      }
      
      await fetchReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-xs">{error}</div>}

      {/* 1. FORM MASTER (PM ONLY) */}
      {role === "PM" && (
        <div className="bg-sky-50 border border-sky-200 p-5 rounded-xl">
          <h3 className="text-sm font-bold text-sky-900 mb-3 underline">Update Progress Utama Proyek (%)</h3>
          <form onSubmit={(e) => handleSubmit(e, "MASTER")} className="flex items-end gap-4">
            <div className="w-32">
              <label className="block text-[10px] uppercase font-bold text-sky-700 mb-1">Persentase</label>
              <input 
                type="number" value={percent} onChange={(e) => setPercent(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm text-black" placeholder="0-100" required
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] uppercase font-bold text-sky-700 mb-1">Keterangan Capaian</label>
              <input 
                type="text" value={masterNotes} onChange={(e) => setMasterNotes(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm text-black" placeholder="Misal: Selesai Fabrikasi"
              />
            </div>
            <button disabled={submitting} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700">
              Update Progres
            </button>
          </form>
        </div>
      )}

      {/* 2. FORM HARIAN (PM & TECH) */}
      {["TECH", "PM"].includes(role) && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Buat Laporan Kerja Harian / Bukti Foto</h3>
          <form onSubmit={(e) => handleSubmit(e, "DAILY")} className="space-y-4">
            <textarea 
              value={dailyNotes} onChange={(e) => setDailyNotes(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm text-black" rows="2" 
              placeholder="Jelaskan apa yang dikerjakan hari ini..." required
            ></textarea>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 mb-1 italic">Lampirkan Foto Pekerjaan (Opsional)</label>
                <input 
                  type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])}
                  className="text-xs text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-slate-100 file:text-slate-700"
                />
              </div>
              <button disabled={submitting} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-900 transition">
                {submitting ? "Mengirim..." : "Kirim Laporan Harian"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. LIST LAPORAN */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
  <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
    <div>
      <h3 className="text-sm font-bold text-slate-800">Riwayat Aktivitas & Progress</h3>
      <p className="text-[10px] text-slate-500">Menampilkan laporan terbaru</p>
    </div>
    <span className="text-[10px] bg-slate-200 px-2 py-1 rounded-full font-semibold text-slate-600">
      Total: {reports.length} Laporan
    </span>
  </div>

  {/* Kontainer dengan Scrollbar agar tidak memanjangkan halaman */}
  <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
    {reports.length === 0 ? (
      <p className="p-10 text-center text-slate-400 text-sm">Belum ada laporan.</p>
    ) : (
      // Kita gunakan Grid 2 Kolom pada desktop (md:grid-cols-2)
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-px bg-slate-100">
        {reports.map((r) => (
          <div key={r.id} className="p-4 bg-white flex flex-col justify-between border-b md:border-r last:border-b-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-[10px] font-bold text-sky-600">
                    {r.user?.name?.charAt(0)}
                  </div>
                  <span className="font-bold text-xs text-slate-900 truncate max-w-[100px]">
                    {r.user?.name}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString("id-ID", {
                    day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className="text-xs text-slate-600 mb-3 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                {r.notes}
              </p>

              {r.photos && (
                <div className="relative group w-20 h-20 mb-2">
                  <a href={r.photos} target="_blank" rel="noreferrer">
                    <img 
                      src={r.photos} 
                      alt="bukti" 
                      className="w-full h-full object-cover rounded-lg border border-slate-200 group-hover:brightness-75 transition" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                       <span className="text-[10px] text-white font-bold bg-black/40 px-1 rounded">View</span>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center mt-2 pt-2 border-t border-slate-50">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                r.percentComplete === 100 ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
              }`}>
                {r.percentComplete}% Progress
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  
  {reports.length > 6 && (
    <div className="p-3 bg-white border-t text-center">
      <button 
        className="text-xs font-semibold text-sky-600 hover:text-sky-700"
        onClick={() => {/* Tambahkan logika modal atau expand jika perlu */}}
      >
        Lihat Seluruh Riwayat ↓
      </button>
    </div>
  )}
</div>
    </div>
  );
}