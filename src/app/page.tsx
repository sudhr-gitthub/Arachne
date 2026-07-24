import React from "react";
import MetricCard from "@/components/ui/MetricCard";
import TacticalMap from "@/components/dashboard/TacticalMap";
import NexusContainer from "@/components/Nexus/NexusContainer";

export default function Home() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Active FIRs"
          value="1,284"
          trend="+12%"
          trendLabel="vs last week"
        />
        <MetricCard
          title="High-Risk Zones"
          value="08"
          trend="+2"
          trendLabel="new threat zones"
          isAlert={true}
        />
        <MetricCard
          title="Flagged Entities"
          value="42"
          trend="-4%"
          trendLabel="resolved today"
        />
        <MetricCard
          title="Patrol Units Active"
          value="156"
          trend="94%"
          trendLabel="efficiency level"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-10 gap-6 min-h-[650px]">
        {/* Left Column: Map */}
        <div className="col-span-6 flex flex-col">
          <TacticalMap />
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
    </div>
  );
}
