// src/components/ProjectCard.js
"use client";

import React, { useMemo } from "react";
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

const ProjectCard = ({
  name,
  clientName,
  value,
  status,
  endDate,
  progressPercent,
}) => {
  const { label: countdownLabel, isOverdue } = useMemo(
    () => computeCountdown(endDate),
    [endDate]
  );

  const safeProgress =
    typeof progressPercent === "number"
      ? Math.max(0, Math.min(100, progressPercent))
      : 0;

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 md:p-5 flex flex-col group-hover:border-sky-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-semibold text-slate-900 truncate">
            {name}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500 truncate">
            Client:{" "}
            <span className="font-medium text-slate-700">{clientName}</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] md:text-xs font-medium ${getStatusStyle(
            status
          )}`}
        >
          {status || "UNKNOWN"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs md:text-sm">
        <div className="flex flex-col">
          <span className="text-slate-500">Nilai Kontrak</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(value)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block">Progress</span>
          <span className="font-semibold text-slate-900">{safeProgress}%</span>
        </div>
      </div>

      <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
          style={{ width: `${safeProgress}%` }}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-start justify-between gap-3">
        <div className="flex-1">
          <p
            className={`text-[11px] md:text-xs ${
              isOverdue ? "text-rose-600" : "text-slate-600"
            }`}
          >
            {countdownLabel}
          </p>
        </div>
        <span className="inline-flex items-center text-[10px] md:text-[11px] text-slate-400">
          Lihat detail →
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;
