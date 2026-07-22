"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  valueClassName,
}: MetricCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-slate-600 transition-all text-slate-400 group-hover:text-slate-200">
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span
          className={cn(
            "text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100",
            valueClassName
          )}
        >
          {value}
        </span>

        {change && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              changeType === "positive" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              changeType === "negative" && "bg-accent-red/10 border-accent-red/20 text-accent-red",
              changeType === "neutral" && "bg-slate-800 border-slate-700 text-slate-400"
            )}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
