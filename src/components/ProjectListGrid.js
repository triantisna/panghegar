"use client";

import Link from "next/link";
import { formatCurrency } from "@/app/lib/formatCurrency";

const getStatusStyle = (status) => {
  switch (status) {
    case "ONGOING":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "NEGOSIASI":
    case "NEGOTIATION":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "KONTRAK":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "DONE":
      return "bg-indigo-100 text-indigo-700 border-indigo-200";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const computeCountdown = (endDate) => {
  if (!endDate) return { label: "Belum ada End Date", isOverdue: false };
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) {
    return { label: "End Date tidak valid", isOverdue: false };
  }

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  const isOverdue = diffMs < 0;
  const absMs = Math.abs(diffMs);

  const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);

  const formattedDate = end.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prefix = isOverdue ? "Lewat" : "Sisa";
  const label = `${prefix}: ${months} Bulan - ${days} Hari - ${hours} Jam (${formattedDate})`;

  return { label, isOverdue };
};

export default function ProjectListGrid({ projects, variant }) {
  // variant: "PM" | "TECH" untuk label tombol
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => {
        const safeProgress =
          typeof p.progressPercent === "number"
            ? Math.max(0, Math.min(100, p.progressPercent))
            : 0;
        const { label: countdownLabel, isOverdue } = computeCountdown(
          p.endDate
        );

        return (
          <Link key={p.id} href={`/project/${p.id}`} className="group h-full">
            <div className="h-full rounded-xl border border-slate-200 bg-white/90 shadow-sm hover:shadow-md hover:border-sky-300 transition p-4 md:p-5 flex flex-col">
              {/* header: nama, client, PM (jika TECH), status badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-semibold text-slate-900 truncate">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-[11px] md:text-xs text-slate-500 truncate">
                    Client:{" "}
                    <span className="font-medium text-slate-700">
                      {p.client?.name || "-"}
                    </span>
                  </p>
                  {variant === "TECH" && (
                    <p className="mt-0.5 text-[11px] md:text-xs text-slate-500 truncate">
                      PM:{" "}
                      <span className="font-medium text-slate-700">
                        {p.pm?.name || "-"}
                      </span>
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] md:text-[11px] font-medium ${getStatusStyle(
                    p.status
                  )}`}
                >
                  {p.status || "UNKNOWN"}
                </span>
              </div>

              {/* nilai + progress */}
              <div className="mt-4 flex items-center justify-between text-[11px] md:text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-500">Nilai Proyek</span>
                  <span className="font-semibold text-slate-900">
                    {p.value ? formatCurrency(p.value) : "-"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Progress</span>
                  <span className="font-semibold text-slate-900">
                    {safeProgress}%
                  </span>
                </div>
              </div>

              <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${safeProgress}%` }}
                />
              </div>

              {/* countdown + CTA */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-start justify-between gap-3">
                <p
                  className={`flex-1 text-[11px] md:text-xs ${
                    isOverdue ? "text-rose-600" : "text-slate-600"
                  }`}
                >
                  {countdownLabel}
                </p>
                <span className="inline-flex items-center text-[10px] md:text-[11px] text-sky-600 group-hover:text-sky-700">
                  {variant === "TECH"
                    ? "Detail & Input Biaya"
                    : "Detail Proyek"}
                  <span className="ml-1">→</span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
