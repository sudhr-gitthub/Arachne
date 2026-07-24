import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendLabel?: string;
  isAlert?: boolean;
}

export default function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  isAlert = false,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]",
        isAlert
          ? "border-red-500/50 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          : "hover:border-blue-500/40"
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {title}
        </span>
        <span
          className={cn(
            "text-3xl font-extrabold tracking-tight mt-1",
            isAlert ? "text-red-500 neon-text-secondary" : "text-white neon-text-primary"
          )}
        >
          {value}
        </span>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "font-bold px-1.5 py-0.5 rounded",
              isAlert
                ? "bg-red-500/10 text-red-400"
                : trend.startsWith("+")
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-blue-500/10 text-blue-400"
            )}
          >
            {trend}
          </span>
          <span className="text-slate-400 font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
