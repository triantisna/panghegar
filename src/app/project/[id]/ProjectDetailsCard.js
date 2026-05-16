"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/app/lib/formatCurrency";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

  const ProjectDetailsCard = ({ data, projectId, role }) => {
  // const currentPm = data.assignments?.find((a) => a.user?.role?.name === "PM")?.user || null;
  const currentPm = data.pm || null;

  // ==== TAMBAHKAN BARIS INI UNTUK DEBUGGING ====
  console.log("DEBUG DATA ASSIGNMENTS:", JSON.stringify(data.assignments, null, 2));
  console.log("DEBUG PM YANG KETEMU:", currentPm);
  // ============================================

  const [showEdit, setShowEdit] = useState(false);
  const [showAssignTech, setShowAssignTech] = useState(false);

  // ==== state edit proyek (CEO/ADMIN) ====
  const [statusEdit, setStatusEdit] = useState(data.status);
  const [pmIdEdit, setPmIdEdit] = useState(currentPm?.id || "");
  const [descEdit, setDescEdit] = useState(data.description || "");
  const [startEdit, setStartEdit] = useState(
    data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : ""
  );
  const [endEdit, setEndEdit] = useState(
    data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : ""
  );
  const [pmOptions, setPmOptions] = useState([]);
  const [savingProject, setSavingProject] = useState(false);

  // ==== state assign teknisi (PM) ====
  const technicians =
    data.assignments
      ?.filter((a) => a.user && a.user.role?.name === "TECH")
      .map((a) => ({
        assignmentId: a.id,
        id: a.user.id,
        name: a.user.name,
      })) || [];

  const [availableTechs, setAvailableTechs] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  // ambil daftar PM untuk dropdown
  useEffect(() => {
    if (!(role === "CEO" || role === "ADMIN")) return;
    const fetchPms = async () => {
      try {
        const res = await fetch("/api/v1/users?role=PM");
        const json = await res.json().catch(() => null);
        if (res.ok && json?.data) {
          const pms = json.data.filter((u) => u.role?.name === "PM");
          setPmOptions(pms);
        }
      } catch (e) {
        console.error("Failed to fetch PM list", e);
      }
    };
    fetchPms();
  }, [role]);

  // ambil daftar TECH untuk dropdown
  useEffect(() => {
    if (role !== "PM") return;
    const fetchTechs = async () => {
      try {
        const res = await fetch("/api/v1/users?role=TECH");
        const json = await res.json().catch(() => null);
        if (res.ok && json?.data) {
          const techs = json.data.filter((u) => u.role?.name === "TECH");
          setAvailableTechs(techs);
        }
      } catch (e) {
        console.error("Failed to fetch tech list", e);
      }
    };
    fetchTechs();
  }, [role, projectId]);

  const handleSaveProject = async () => {
    try {
      setSavingProject(true);
      const res = await fetch(`/api/v1/projects/${projectId}/assign-pm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pmId: pmIdEdit || null,
          status: statusEdit,
          description: descEdit,
          startDate: startEdit || null,
          endDate: endEdit || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menyimpan perubahan proyek");
      }
      window.location.reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingProject(false);
    }
  };

  const handleAddTech = async () => {
    if (!selectedTechId) return;
    try {
      setSavingAssign(true);
      const res = await fetch(`/api/v1/projects/${projectId}/assign-tech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: selectedTechId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menambahkan teknisi");
      }
      window.location.reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingAssign(false);
    }
  };

  const handleRemoveTech = async (assignmentId) => {
    if (!assignmentId) return;
    if (!confirm("Hapus teknisi dari proyek ini?")) return;
    try {
      setSavingAssign(true);
      const res = await fetch(`/api/v1/projects/${projectId}/assign-tech`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || "Gagal menghapus teknisi");
      }
      window.location.reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-xl shadow border border-slate-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">
            Detail Proyek
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi ringkas mengenai proyek ini.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-medium ${
            data.status === "DONE"
              ? "bg-emerald-50 text-emerald-700"
              : data.status === "CANCELLED"
              ? "bg-rose-50 text-rose-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Client</span>
            <span className="font-medium text-slate-900 text-right">
              {data.client?.name || "-"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Nilai Proyek</span>
            <span className="font-semibold text-slate-900 text-right">
              {data.value ? formatCurrency(data.value) : "-"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Start Proyek</span>
            <span className="font-medium text-slate-900 text-right">
              {formatDate(data.startDate)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">End Proyek</span>
            <span className="font-medium text-slate-900 text-right">
              {formatDate(data.endDate)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-slate-500 text-sm">Project Manager</span>
            <p className="font-medium text-slate-900">{currentPm?.name || "-"}</p>
          </div>

          <div>
            <span className="text-slate-500 text-sm">
              Teknisi yang ditugaskan
            </span>
            {technicians.length === 0 ? (
              <p className="text-slate-400 text-sm mt-0.5">
                Belum ada teknisi yang ditugaskan.
              </p>
            ) : (
              <ul className="mt-1 space-y-0.5 text-sm text-slate-900">
                {technicians.map((t) => (
                  <li key={t.assignmentId}>• {t.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <span className="text-slate-500 text-sm">Deskripsi</span>
            <p className="mt-0.5 text-sm text-slate-900">
              {data.description || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Pengaturan / aksi */}
      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        {(role === "CEO" || role === "ADMIN") && (
          <div>
            <button
              type="button"
              onClick={() => setShowEdit((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] md:text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              {showEdit ? "Tutup Edit Proyek" : "Edit Proyek"}
            </button>
            {showEdit && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs md:text-sm text-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Pengaturan Proyek
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Hanya CEO / Admin
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">
                      Status Proyek
                    </label>
                    <select
                      value={statusEdit}
                      onChange={(e) => setStatusEdit(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                    >
                      <option value="NEGOSIASI">Negosiasi</option>
                      <option value="KONTRAK">Kontrak</option>
                      <option value="ONGOING">Berjalan</option>
                      <option value="DONE">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">
                      Project Manager
                    </label>
                    <select
                      value={pmIdEdit}
                      onChange={(e) => setPmIdEdit(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                    >
                      <option value="">(Tidak ada PM)</option>
                      {pmOptions.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-medium text-slate-600">
                      Deskripsi Proyek
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                      rows={2}
                      value={descEdit}
                      onChange={(e) => setDescEdit(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">
                      Start Proyek
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                      value={startEdit}
                      onChange={(e) => setStartEdit(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-slate-600">
                      End Proyek
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                      value={endEdit}
                      onChange={(e) => setEndEdit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] md:text-xs text-slate-600 hover:bg-slate-100"
                    onClick={() => setShowEdit(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProject}
                    disabled={savingProject}
                    className="rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] md:text-xs font-semibold text-white hover:bg-sky-700 shadow-sm disabled:opacity-60"
                  >
                    {savingProject ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {role === "PM" && (
          <div>
            <button
              type="button"
              onClick={() => setShowAssignTech((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] md:text-xs font-medium text-sky-700 hover:bg-sky-100"
            >
              {showAssignTech ? "Tutup Penugasan Teknisi" : "Tugaskan Teknisi"}
            </button>
            {showAssignTech && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs md:text-sm text-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Penugasan Teknisi
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Hanya PM proyek ini
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-600">
                    Teknisi saat ini
                  </p>
                  {technicians.length === 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Belum ada teknisi yang ditugaskan.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {technicians.map((t) => (
                        <li
                          key={t.assignmentId}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1"
                        >
                          <span className="text-xs text-slate-800">
                            {t.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTech(t.assignmentId)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 disabled:opacity-60"
                            disabled={savingAssign}
                          >
                            Hapus
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-medium text-slate-600 mb-1">
                    Tambah teknisi
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="flex-1 min-w-[160px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700"
                      value={selectedTechId}
                      onChange={(e) => setSelectedTechId(e.target.value)}
                    >
                      <option value="">Pilih teknisi...</option>
                      {availableTechs.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddTech}
                      disabled={savingAssign || !selectedTechId}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] md:text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-60"
                    >
                      {savingAssign ? "Menyimpan..." : "Tambah"}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Teknisi yang ditambahkan akan otomatis memiliki akses ke
                    proyek ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsCard;
