"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import MetricCard from "@/components/ui/MetricCard";
import MapContainer from "@/components/Map/MapContainer";
import NexusContainer from "@/components/Nexus/NexusContainer";
import LogisticsView from "@/components/views/LogisticsView";
import SurveillanceView from "@/components/views/SurveillanceView";
import ComingSoonModal from "@/components/ui/ComingSoonModal";

export default function Home() {
  const { role, activeHeaderTab, activeSidebarTab } = useAppStore();

  const isCommandMapActive = activeHeaderTab === "Command" && activeSidebarTab === "Map";
  const isLogisticsActive = activeHeaderTab === "Logistics";
  const isSurveillanceActive = activeHeaderTab === "Surveillance";

  const showModal = activeSidebarTab === "Database" || activeSidebarTab === "Settings";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Active FIRs"
          value={role === "SHO" ? "142" : "1,284"}
          trend={role === "SHO" ? "+4%" : "+12%"}
          trendLabel="vs last week"
        />
        <MetricCard
          title="High-Risk Zones"
          value={role === "SHO" ? "02" : "08"}
          trend={role === "SHO" ? "+0" : "+2"}
          trendLabel="new threat zones"
          isAlert={true}
        />
        <MetricCard
          title="Flagged Entities"
          value={role === "SHO" ? "12" : "42"}
          trend={role === "SHO" ? "-2%" : "-4%"}
          trendLabel="resolved today"
        />
        <MetricCard
          title="Patrol Units Active"
          value={role === "SHO" ? "18" : "156"}
          trend={role === "SHO" ? "88%" : "94%"}
          trendLabel="efficiency level"
        />
      </div>

      {/* Main Views Area */}
      {isCommandMapActive && (
        <div className="grid grid-cols-10 gap-6 min-h-[650px]">
          {/* Left Column: Map */}
          <div className="col-span-6 flex flex-col">
            <MapContainer />
          </div>

          {/* Right Column: Link Analyzer & Recent Alerts */}
          <div className="col-span-4 flex flex-col gap-6">
            {/* Top Half: Nexus Link Analyzer */}
            <div className="flex-1 min-h-[300px]">
              <NexusContainer />
            </div>

            {/* Bottom Half: Recent Alerts Table */}
            <div className="flex-1 glass-card rounded-xl p-5 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Recent Alerts
                </h3>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-400 font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="pb-2 font-semibold">TIME</th>
                      <th className="pb-2 font-semibold">TYPE</th>
                      <th className="pb-2 font-semibold">LOCATION</th>
                      <th className="pb-2 font-semibold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-300">21:40</td>
                      <td className="py-2.5 font-medium text-red-400">INTRUSION</td>
                      <td className="py-2.5 text-slate-500">Sector 4 Grid</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-300">21:15</td>
                      <td className="py-2.5 font-medium text-slate-300">SIGNAL_JAM</td>
                      <td className="py-2.5 text-slate-500">North Tower</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-700/50">
                          CLOSED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-300">20:45</td>
                      <td className="py-2.5 font-medium text-amber-400">UNIDENT_VES</td>
                      <td className="py-2.5 text-slate-500">Harbor Entrance C</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-2.5 font-medium text-slate-300">20:10</td>
                      <td className="py-2.5 font-medium text-slate-300">DRONE_TRACK</td>
                      <td className="py-2.5 text-slate-500">Warehouse Dist E</td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-700/50">
                          CLOSED
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLogisticsActive && <LogisticsView />}
      {isSurveillanceActive && <SurveillanceView />}

      {/* Fallback Initializing View when not in Command Map, Logistics, or Surveillance */}
      {!isCommandMapActive && !isLogisticsActive && !isSurveillanceActive && (
        <div className="flex flex-col items-center justify-center min-h-[650px] glass-card rounded-xl border border-slate-800 p-8 text-center relative overflow-hidden">
          {/* Cybernetic grid background effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
          
          <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg">
            {/* Animated Radar Radar Pulse */}
            <div className="relative flex items-center justify-center h-24 w-24">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500/20 animate-ping" />
              <span className="absolute inline-flex h-4/5 w-4/5 rounded-full bg-indigo-500/30 animate-pulse" />
              <div className="relative h-12 w-12 rounded-full bg-slate-900 border border-blue-500/50 flex items-center justify-center text-blue-400 font-mono shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                {role === "SHO" ? "SHO" : "COMM"}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-wider text-white neon-text-primary uppercase mb-2">
                Module Interface Initializing
              </h2>
              <p className="text-xs font-mono text-slate-400 tracking-wide uppercase">
                Active Node: <span className="text-blue-400">{activeHeaderTab}</span>{" // "}<span className="text-indigo-400">{activeSidebarTab}</span>
              </p>
            </div>

            <div className="border border-slate-800/80 bg-slate-950/60 rounded-lg p-4 font-mono text-left text-[11px] text-slate-500 w-full">
              <div className="flex justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                <span>INTEL_STREAM:</span>
                <span className="text-emerald-500">CONNECTED</span>
              </div>
              <div className="space-y-1">
                <p>&gt; Authorization clearance level: <span className="text-white font-semibold">{role}</span></p>
                <p>&gt; Querying sub-module telemetry data...</p>
                <p>&gt; UI layout structure initialized successfully.</p>
                <p className="text-slate-400">&gt; Placeholders and filters will populate in the next phase.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database/Settings Clearance Modal Overlay */}
      {showModal && <ComingSoonModal />}
    </div>
  );
}
