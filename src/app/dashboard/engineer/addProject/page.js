"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EngineerAddProjectPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    description: "",
    value: "",
    status: "NEGOSIASI",
    startDate: "",
    endDate: "",
  });
  const [rabFile, setRabFile] = useState(null);
  const [kontrakFile, setKontrakFile] = useState(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (
      !formData.name ||
      !formData.clientName ||
      !formData.value ||
      !formData.status
    ) {
      setError("Nama proyek, nama client, nilai, dan status wajib diisi.");
      setIsLoading(false);
      return;
    }

    try {
      // Buat FormData untuk mengirim file dan teks bersamaan
      const data = new FormData();
      data.append("name", formData.name);
      data.append("clientName", formData.clientName);
      data.append("description", formData.description || "");
      data.append("value", formData.value);
      data.append("status", formData.status);
      data.append("startDate", formData.startDate || "");
      data.append("endDate", formData.endDate || "");

      // Append file jika ada
      if (rabFile) data.append("rabFile", rabFile);
      if (kontrakFile) data.append("kontrakFile", kontrakFile);

      const res = await fetch("/api/v1/projects", {
        method: "POST",
        body: data, // Jangan gunakan JSON.stringify, dan biarkan browser set Header otomatis
      });

      if (!res.ok) throw new Error("Gagal menambahkan proyek");
      router.push("/dashboard/engineer");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/engineer"
              className="inline-flex items-center text-xs md:text-sm text-slate-500 hover:text-slate-700"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider">
            Engineer Panel
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-6 py-6 md:px-8 md:py-8">
          <div className="mb-8">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
              Tambah Proyek & Dokumen Baru
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Input data teknis proyek beserta lampiran RAB dan Surat Kontrak.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs md:text-sm text-rose-700">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bagian 1: Informasi Dasar */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pembangunan Jaringan Listrik Bogor"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                  Nama Client <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="Contoh: Dinas ESDM Jawa Barat"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                Deskripsi Lingkup Kerja
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Jelaskan detail pekerjaan proyek secara singkat"
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
              />
            </div>

            {/* Bagian 2: Nilai & Status */}
            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                  Nilai Proyek (IDR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                  Status Awal <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition appearance-none"
                >
                  <option value="NEGOSIASI">Negosiasi</option>
                  <option value="KONTRAK">Kontrak</option>
                  <option value="ONGOING">Berjalan</option>
                  <option value="DONE">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1.5">
                    Tgl Mulai
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-medium text-slate-500 mb-1.5">
                    Tgl Selesai
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Unggah Dokumen (Wajib Bagi Engineer) */}
            <div className="pt-4 mt-2">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs">
                  !
                </span>
                Lampiran Dokumen Proyek
              </h3>

              <div className="grid md:grid-cols-2 gap-5 p-5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    File RAB (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setRabFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Surat Kontrak (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setKontrakFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push("/dashboard/engineer")}
                className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-2.5 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center rounded-lg bg-sky-600 px-6 py-2.5 text-xs md:text-sm font-medium text-white shadow-md hover:bg-sky-700 focus:ring-4 focus:ring-sky-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Proyek & Dokumen"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EngineerAddProjectPage;
