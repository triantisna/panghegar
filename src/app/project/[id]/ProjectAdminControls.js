"use client";

import { useEffect, useState } from "react";

export default function ProjectAdminControls({
  projectId,
  initialStatus,
  initialPmId,
}) {
  const [role, setRole] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);

  const [status, setStatus] = useState(initialStatus);
  const [pmId, setPmId] = useState(initialPmId || "");
  const [pmOptions, setPmOptions] = useState([]);

  const [techOptions, setTechOptions] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 1. Ambil role user
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/v1/auth/session");
        if (!res.ok) {
          setLoadingRole(false);
          return;
        }
        const data = await res.json();
        setRole(data.role);
      } catch {
        // ignore
      } finally {
        setLoadingRole(false);
      }
    };
    fetchRole();
  }, []);

  // 2. Jika CEO, ambil daftar PM
  useEffect(() => {
    const fetchPMs = async () => {
      if (role !== "CEO") return;
      const res = await fetch("/api/v1/users?role=PM");
      const data = await res.json();
      if (res.ok) {
        setPmOptions(data.data);
      }
    };
    fetchPMs();
  }, [role]);

  // 3. Jika CEO atau PM, ambil daftar teknisi dan assignment di proyek
  useEffect(() => {
    const fetchTechsAndAssignments = async () => {
      if (!["CEO", "PM"].includes(role)) return;

      const [techRes, assignRes] = await Promise.all([
        fetch("/api/v1/users?role=TECH"),
        fetch(`/api/v1/projects/${projectId}/assign-tech`),
      ]);

      const techData = await techRes.json();
      const assignData = await assignRes.json();

      if (techRes.ok) setTechOptions(techData.data || []);
      if (assignRes.ok) setAssignments(assignData.data || []);
    };

    if (!loadingRole) {
      fetchTechsAndAssignments();
    }
  }, [role, loadingRole, projectId]);

  const handleSaveProject = async () => {
    try {
      setSaving(true);
      setError("");
      const body = {};

      // CEO boleh ubah status + PM
      if (role === "CEO") {
        body.status = status;
        body.pmId = pmId || null;
      }

      // PM tidak boleh ubah status/PM → body kosong saja (tidak panggil API)
      if (Object.keys(body).length === 0) {
        return;
      }

      const res = await fetch(`/api/v1/projects/${projectId}/assign-pm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update project");
      alert("Project updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTech = async () => {
    if (!selectedTechId) return;
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`/api/v1/projects/${projectId}/assign-tech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: selectedTechId }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to assign technician");

      // refresh assignments
      const assignRes = await fetch(
        `/api/v1/projects/${projectId}/assign-tech`
      );
      const assignData = await assignRes.json();
      if (assignRes.ok) setAssignments(assignData.data || []);
      setSelectedTechId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTech = async (assignmentId) => {
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`/api/v1/projects/${projectId}/assign-tech`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to remove technician");

      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingRole || !["CEO", "PM"].includes(role)) return null;

  return (
    <div className="mt-4 space-y-4">
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {/* Bagian CEO: Status & PM */}
      {role === "CEO" && (
        <div className="bg-slate-50 border rounded-lg p-3 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">
            Pengaturan Proyek (CEO)
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-600 mb-1">
                Project Manager
              </label>
              <select
                value={pmId || ""}
                onChange={(e) => setPmId(e.target.value)}
                className="border rounded px-2 py-1 w-full text-sm"
              >
                <option value="">- Belum ditentukan -</option>
                {pmOptions.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-600 mb-1">
                Status Proyek
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border rounded px-2 py-1 w-full text-sm"
              >
                <option value="NEGOSIASI">NEGOSIASI</option>
                <option value="KONTRAK">KONTRAK</option>
                <option value="ONGOING">ONGOING</option>
                <option value="DONE">DONE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSaveProject}
            disabled={saving}
            className="mt-2 px-4 py-2 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan Proyek"}
          </button>
        </div>
      )}

      {/* Bagian CEO + PM: kelola teknisi */}
      <div className="bg-slate-50 border rounded-lg p-3 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">
          Teknisi di Proyek Ini ({role})
        </h3>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-600 mb-1">
              Pilih Teknisi
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              className="border rounded px-2 py-1 w-full text-sm"
            >
              <option value="">- Pilih teknisi -</option>
              {techOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAssignTech}
            disabled={saving || !selectedTechId}
            className="px-4 py-2 rounded bg-green-600 text-white text-xs hover:bg-green-700"
          >
            {saving ? "Menambahkan..." : "Tambah Teknisi"}
          </button>
        </div>

        <div className="mt-3 max-h-40 overflow-y-auto">
          {assignments.length === 0 ? (
            <p className="text-xs text-gray-600">
              Belum ada teknisi yang ditugaskan.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Nama</th>
                  <th className="text-left py-1">Email</th>
                  <th className="text-left py-1">Role</th>
                  <th className="text-left py-1">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="py-1 pr-2">{a.user.name}</td>
                    <td className="py-1 pr-2">{a.user.email}</td>
                    <td className="py-1 pr-2">{a.role || a.user.role?.name}</td>
                    <td className="py-1">
                      <button
                        onClick={() => handleRemoveTech(a.id)}
                        disabled={saving}
                        className="px-2 py-1 rounded bg-red-600 text-white text-[10px] hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
