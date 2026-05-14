"use client";

import { useState } from "react";
import Link from "next/link";
import RabSummarySection from "./RabSummarySection";
import ProgressReportSection from "./ProgressReportSection";
import ActivityLogSection from "./ActivityLogSection";
import MaterialRequestSection from "./MaterialRequestSection";
import MaterialUsageSection from "./MaterialUsageSection";
import OperationalCostSection from "./OperationalCostSection";
import BackButton from "./BackButton";
import ProjectDetailsCard from "./ProjectDetailsCard";

// definisi tab (poin 2)
const TABS = [
  { id: "overview", label: "Ringkasan" },
  { id: "rab", label: "RAB & Estimasi" },
  { id: "progress", label: "Progress" },
  { id: "material-req", label: "Permintaan Material" },
  { id: "material-usage", label: "Pemakaian Material" },
  { id: "operational", label: "Biaya Operasional" },
  { id: "activity", label: "Activity Log" },
];

const formatNumber = (value) => {
  // Jika value undefined, null, atau NaN, kembalikan "0" atau "-"
  if (value == null || isNaN(value)) return "0"; 
  
  return new Intl.NumberFormat("id-ID").format(
    typeof value === "bigint" ? Number(value) : Number(value)
  );
};

const DetailProjectClient = ({ projectId, data, role, summary }) => {
  const [activeTab, setActiveTab] = useState("overview");

  // mapping tab -> isi (poin 4)
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        // hitung diff & label RAB ringkas
        const diff = summary.diffTotal || 0;
        const isOver = diff > 0; // kalau real > RAB => over
        const absDiff = Math.abs(diff);
        const rabLabel = isOver ? "Over Budget" : "Under Budget";

        return (
          <div className="space-y-4">
            {/* baris atas: ringkasan RAB + progress overview */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Card RAB Ringkas */}
              <button
                type="button"
                onClick={() => setActiveTab("rab")}
                className="text-left bg-white p-5 md:p-6 rounded-xl shadow border border-slate-200 hover:border-sky-300 hover:shadow-md transition"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  RAB & Realisasi
                </p>
                <h3 className="text-base md:text-lg font-semibold text-slate-900">
                  {rabLabel}
                </h3>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isOver ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {isOver ? "- " : ""}
                  Rp {formatNumber(absDiff)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Klik untuk melihat detail RAB dan realisasi biaya.
                </p>
              </button>

              {/* Card progress ringkas */}
              <button
                type="button"
                onClick={() => setActiveTab("progress")}
                className="text-left bg-white p-5 md:p-6 rounded-xl shadow border border-slate-200 hover:border-sky-300 hover:shadow-md transition"
              >
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                  Progress Proyek
                </p>
                <h3 className="text-base md:text-lg font-semibold text-slate-900">
                  {data.latestProgress?.percentComplete ?? 0}%
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Update terakhir:{" "}
                  {data.latestProgress?.createdAt
                    ? new Date(
                        data.latestProgress.createdAt
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Belum ada progress"}
                </p>
                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                    style={{
                      width: `${data.latestProgress?.percentComplete ?? 0}%`,
                    }}
                  />
                </div>
              </button>
            </div>

            {/* baris kedua: detail proyek + ringkasan lain */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Detail proyek (full di 2 kolom) */}
              <div className="md:col-span-2">
                <ProjectDetailsCard
                  data={data}
                  projectId={projectId}
                  role={role}
                />
              </div>

              {/* Ringkasan material & biaya operasional */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("material-usage")}
                  className="w-full text-left bg-white p-4 rounded-xl shadow border border-slate-200 hover:border-sky-300 hover:shadow-md transition"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Pemakaian Material
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">
                    {data.materialUsageSummary?.length || 0} jenis material
                  </h3>
                  <ul className="mt-2 space-y-1 max-h-20 overflow-y-auto text-xs text-slate-600">
                    {(data.materialUsageSummary || []).slice(0, 3).map((m) => (
                      <li key={m.materialId}>
                        {m.name} : {m.totalQuantity} {m.unit}
                      </li>
                    ))}
                    {data.materialUsageSummary &&
                      data.materialUsageSummary.length > 3 && (
                        <li className="text-sky-600">+ lainnya</li>
                      )}
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("operational")}
                  className="w-full text-left bg-white p-4 rounded-xl shadow border border-slate-200 hover:border-sky-300 hover:shadow-md transition"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Biaya Operasional
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">
                    Rp{" "}
                    {formatNumber(
                      data.operationalCostSummary?.totalAmount || 0
                    )}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {data.operationalCostSummary?.count || 0} transaksi tercatat
                  </p>
                </button>
              </div>
            </div>
          </div>
        );

      case "rab":
        return (
          <RabSummarySection
            projectId={projectId}
            role={role}
            summary={summary}
            estimates={data.estimates || []}
            documents={data.documents || []}
          />
        );

      case "progress":
        return <ProgressReportSection projectId={projectId} role={role} />;

      case "material-req":
        return <MaterialRequestSection projectId={projectId} />;

      case "material-usage":
        return <MaterialUsageSection projectId={projectId} />;

      case "operational":
        return <OperationalCostSection projectId={projectId} />;

      case "activity":
        return <ActivityLogSection projectId={projectId} role={role} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* header atas */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Detail Proyek
              </p>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                {data.name}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 md:py-6 flex gap-4">
        {/* sidebar kiri (desktop) */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-slate-200 bg-white rounded-xl shadow-sm">
          <nav className="py-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 text-sm transition rounded-r-full mb-1 ${
                  activeTab === tab.id
                    ? "bg-sky-50 text-sky-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* konten kanan */}
        <section className="flex-1 min-w-0">
          {/* tabs mobile (poin 3) */}
          <div className="md:hidden mb-3 overflow-x-auto">
            <div className="flex gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs border transition ${
                    activeTab === tab.id
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 md:space-y-5">{renderTabContent()}</div>
        </section>
      </main>
    </div>
  );
};

export default DetailProjectClient;
