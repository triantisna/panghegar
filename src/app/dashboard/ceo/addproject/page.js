"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AddProjectPage = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    description: "",
    value: "",
    status: "",
    startDate: "",
    endDate: "",
  });

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
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          clientName: formData.clientName,
          description: formData.description || null,
          value: formData.value,
          status: formData.status,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Gagal menambahkan proyek");
      }

      router.push("/dashboard/ceo");
    } catch (err) {
      console.error("Error adding project:", err);
      setError(err.message || "Gagal menambahkan proyek");
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
              href="/dashboard/ceo"
              className="inline-flex items-center text-xs md:text-sm text-slate-500 hover:text-slate-700"
            >
              ← Kembali ke Dashboard
            </Link>
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-500">
            Tambah Proyek
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-slate-200 px-6 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
              Tambah Proyek Baru
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Lengkapi informasi dasar proyek. Beberapa data masih bisa diedit
              nanti.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs md:text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Pembangunan Gedung A"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                  Nama Client <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="Contoh: PT Panghegar Raya Teknik"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Deskripsi singkat ruang lingkup pekerjaan"
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                  Nilai Proyek (IDR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder="Contoh: 1500000000"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="" disabled>
                    Pilih status
                  </option>
                  <option value="NEGOSIASI">Negosiasi</option>
                  <option value="KONTRAK">Kontrak</option>
                  <option value="ONGOING">Berjalan</option>
                  <option value="DONE">Selesai</option>
                  <option value="CANCELLED">Dibatalkan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/ceo")}
                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-2 text-xs md:text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Menyimpan..." : "Tambah Proyek"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddProjectPage;
