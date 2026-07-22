"use client";

import React from "react";
import { FileText, AlertTriangle, Users, Shield, Radio, Layers, Activity } from "lucide-react";
import { useApp } from "@/context/AppContext";
import MetricCard from "@/components/ui/MetricCard";
import NexusContainer from "@/presentation/components/Nexus/NexusContainer";

export default function Dashboard() {
  const { activeView, role } = useApp();

  // Primary Tactical Dashboard (Map view)
  const renderDashboardView = () => (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active FIRs (24h)"
          value="142"
          change="+18%"
          changeType="positive"
          icon={FileText}
        />
        <MetricCard
          title="High-Risk Zones"
          value="8"
          change="+2 new"
          changeType="negative"
          valueClassName="text-accent-red"
          icon={AlertTriangle}
        />
        <MetricCard
          title="Flagged Entities"
          value="1,284"
          change="+4"
          changeType="negative"
          icon={Users}
        />
        <MetricCard
          title="Patrol Units Active"
          value="45"
          change="Optimal"
          changeType="neutral"
          icon={Shield}
        />
      </div>

      {/* Main Grid: Map & Side Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map Placeholder */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[550px] shadow-lg relative overflow-hidden group hover:border-slate-800 transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-blue" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Geospatial Intelligence Map
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-400 font-semibold uppercase">
                Live Feed
              </span>
            </div>
          </div>
          
          {/* Map Content Placeholder */}
          <div className="flex-1 bg-slate-950/50 border border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-6 text-center border-dashed">
            <Radio className="w-12 h-12 text-slate-700 animate-pulse mb-3" />
            <h3 className="text-slate-400 font-medium mb-1">GIS Engine Initializing</h3>
            <p className="text-xs text-slate-600 max-w-sm">
              Connecting to regional law enforcement geospatial server data feeds...
            </p>
          </div>
        </div>

        {/* Right Column: Nexus Link & Recent Alerts */}
        <div className="flex flex-col gap-6">
          {/* Top Card: Nexus Link Analyzer Placeholder */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col min-h-[262px] shadow-lg relative group hover:border-slate-800 transition-all">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
              <Activity className="w-4 h-4 text-accent-blue" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Nexus Link Analyzer
              </h2>
            </div>
            
            <div className="flex-1 bg-slate-950/50 border border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-4 text-center border-dashed">
              <span className="text-xs text-slate-500 font-medium">Graph Visualizer Idle</span>
              <p className="text-[10px] text-slate-600 mt-1">Select entities from map or log to graph relations</p>
            </div>
          </div>

          {/* Bottom Card: Recent Alerts List Placeholder */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col min-h-[262px] shadow-lg relative group hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-ping" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recent Alerts List
                </h2>
              </div>
              <span className="text-[10px] text-accent-red font-semibold uppercase tracking-wider bg-accent-red/10 border border-accent-red/20 px-2 py-0.5 rounded">
                Crit: 2
              </span>
            </div>

            <div className="flex-1 bg-slate-950/50 border border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-4 text-center border-dashed">
              <span className="text-xs text-slate-500 font-medium">No unprocessed high priority notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Sub-Header info bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold text-accent-blue tracking-widest uppercase">
            Active Workspace
          </span>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            TACTICAL MISSION DASHBOARD
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Role: <strong className="text-slate-200">{role === "Commissioner" ? "Police Commissioner" : "Station House Officer"}</strong></span>
        </div>
      </div>

      {/* Render based on view state */}
      {activeView === "map" && renderDashboardView()}

      {activeView === "network" && <NexusContainer />}

      {activeView === "database" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 h-[600px] flex flex-col justify-center items-center text-center shadow-lg">
          <FileText className="w-12 h-12 text-accent-blue animate-pulse mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">DATABASE EXPLORER</h2>
          <p className="text-slate-400 max-w-md text-sm">
            Access secure databases containing details on FIRs, records, personnel schedules, and logs.
          </p>
        </div>
      )}

      {activeView === "settings" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 h-[600px] flex flex-col justify-center items-center text-center shadow-lg">
          <Layers className="w-12 h-12 text-accent-blue animate-pulse mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">SYSTEM PARAMETERS</h2>
          <p className="text-slate-400 max-w-md text-sm">
            Configure data refresh intervals, notification preferences, system integration APIs, and logging options.
          </p>
        </div>
      )}
    </div>
  );
}
