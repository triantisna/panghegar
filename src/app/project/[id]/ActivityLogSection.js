"use client";

import { useEffect, useState } from "react";

export default function ActivityLogSection({ projectId, role }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterType, setFilterType] = useState("NONE"); // NONE | NAME | DATE
  const [filterName, setFilterName] = useState("");
  const [dateFilterMode, setDateFilterMode] = useState("WEEKLY"); // WEEKLY | MONTHLY
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(""); // "1".."12"

  const getWeekRange = (weekNum) => {
    if (!weekNum) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const week = parseInt(weekNum, 10);

    const startDay = (week - 1) * 7 + 1;
    const startDate = new Date(year, month, startDay);
    const endDate = new Date(year, month, startDay + 6);
    return { startDate, endDate };
  };

  const getMonthRange = (monthNum) => {
    if (!monthNum) return null;
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = parseInt(monthNum, 10) - 1; // 0-based
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    return { startDate, endDate };
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/activity-logs?projectId=${projectId}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Gagal mengambil activity log");
      setLogs(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === "NAME") {
      if (!filterName.trim()) return true;
      const name = (log.actor?.name || "").toLowerCase();
      return name.includes(filterName.trim().toLowerCase());
    }

    if (filterType === "DATE") {
      const createdAt = new Date(log.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;

      if (dateFilterMode === "WEEKLY") {
        const range = getWeekRange(selectedWeek);
        if (!range) return true;
        return createdAt >= range.startDate && createdAt <= range.endDate;
      }

      if (dateFilterMode === "MONTHLY") {
        const range = getMonthRange(selectedMonth);
        if (!range) return true;
        return createdAt >= range.startDate && createdAt <= range.endDate;
      }
    }

    return true;
  });

  useEffect(() => {
    if (["PM", "CEO", "TECH"].includes(role)) {
      fetchLogs();
    } else {
      setLoading(false);
    }
  }, [projectId, role]);

  if (!["PM", "CEO", "TECH"].includes(role)) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-8 text-black">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Activity Log
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500 mb-4 text-sm">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Belum ada activity yang tercatat.
        </p>
      ) : (
        <>
          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Filter:</span>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterName("");
                  setSelectedWeek("");
                  setSelectedMonth("");
                }}
                className="border border-gray-300 rounded px-2 py-1 text-xs"
              >
                <option value="NONE">Tidak ada</option>
                <option value="NAME">Filter by Name</option>
                <option value="DATE">Filter by Date</option>
              </select>
            </div>

            {filterType === "NAME" && (
              <input
                type="text"
                placeholder="Nama user..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs min-w-[160px]"
              />
            )}

            {filterType === "DATE" && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={dateFilterMode}
                  onChange={(e) => {
                    setDateFilterMode(e.target.value);
                    setSelectedWeek("");
                    setSelectedMonth("");
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="WEEKLY">Mingguan</option>
                  <option value="MONTHLY">Bulanan</option>
                </select>

                {dateFilterMode === "WEEKLY" && (
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Pilih minggu...</option>
                    <option value="1">Minggu 1</option>
                    <option value="2">Minggu 2</option>
                    <option value="3">Minggu 3</option>
                    <option value="4">Minggu 4</option>
                  </select>
                )}

                {dateFilterMode === "MONTHLY" && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Pilih bulan...</option>
                    <option value="1">Januari</option>
                    <option value="2">Februari</option>
                    <option value="3">Maret</option>
                    <option value="4">April</option>
                    <option value="5">Mei</option>
                    <option value="6">Juni</option>
                    <option value="7">Juli</option>
                    <option value="8">Agustus</option>
                    <option value="9">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Waktu</th>
                  <th className="text-left py-1">User</th>
                  <th className="text-left py-1">Aksi</th>
                  <th className="text-left py-1">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-2 text-center text-xs text-gray-500"
                    >
                      Tidak ada activity yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="py-1 pr-2">
                        {new Date(log.createdAt).toLocaleString("id-ID")}
                      </td>
                      <td className="py-1 pr-2">{log.actor?.name || "-"}</td>
                      <td className="py-1 pr-2">
                        {log.action} ({log.targetType})
                      </td>
                      <td className="py-1 pr-2">{renderMetadata(log)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function renderMetadata(log) {
  const { action, targetType, metadata } = log;
  if (!metadata || typeof metadata !== "object") {
    // fallback: string biasa atau null
    return metadata || "-";
  }

  // Cost approval
  if (action === "APPROVE_COST" || action === "REJECT_COST") {
    const statusText =
      metadata.newStatus === "APPROVED" ? "disetujui" : "ditolak";
    const noteText = metadata.note ? ` (Catatan: ${metadata.note})` : "";
    return `Biaya operasional ${statusText} ${formatCurrency(
      metadata.amount
    )}.${noteText}`;
  }

  // Create operational cost
  if (action === "CREATE_OPERATIONAL_COST") {
    return `Input biaya operasional ${formatCurrency(
      metadata.amount
    )} untuk proyek ini. Deskripsi: ${metadata.description}`;
  }

  // Material request
  if (action === "CREATE_MATERIAL_REQUEST") {
    return `Pengajuan material (qty: ${metadata.quantity})${
      metadata.reason ? `, alasan: ${metadata.reason}` : ""
    }.`;
  }

  if (
    action === "APPROVE_MATERIAL_REQUEST" ||
    action === "REJECT_MATERIAL_REQUEST"
  ) {
    const statusText =
      metadata.newStatus === "APPROVED" ? "disetujui" : "ditolak";
    const noteText = metadata.note ? ` (Catatan: ${metadata.note})` : "";
    return `Pengajuan material ${statusText} oleh ${
      metadata.requesterRole || "user"
    }.${noteText}`;
  }

  // Material usage
  if (action === "CREATE_MATERIAL_USAGE") {
    const dateText = metadata.usedAt
      ? new Date(metadata.usedAt).toLocaleString("id-ID")
      : "-";
    return `Catat pemakaian material qty ${metadata.quantity} pada ${dateText}.`;
  }

  // Progress report
  if (action === "CREATE_PROGRESS_REPORT") {
    return `Update progress proyek ${metadata.percentComplete}%${
      metadata.notes ? `, catatan: ${metadata.notes}` : ""
    }.`;
  }

  // Estimate (kalau sudah dipakai di API)
  if (action === "CREATE_ESTIMATE" || action === "CREATE_ESTIMATE_APPROVED") {
    return `Input RAB: material ${formatCurrency(
      metadata.estimatedMaterialCost
    )}, operasional ${formatCurrency(
      metadata.estimatedOperationalCost
    )}, total ${formatCurrency(metadata.totalEstimate)}. Status: ${
      metadata.status
    }.`;
  }

  if (action === "APPROVE_ESTIMATE" || action === "REJECT_ESTIMATE") {
    const statusText =
      metadata.newStatus === "APPROVED" ? "disetujui" : "ditolak";
    return `RAB ${statusText} (sebelumnya ${metadata.previousStatus}).`;
  }

  // Fallback kalau belum ada template khusus
  return JSON.stringify(metadata);
}

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}
