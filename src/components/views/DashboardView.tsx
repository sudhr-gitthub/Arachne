"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Shield, Users, MapPin, Eye, Clock, Activity, AlertTriangle, MessageSquare, Terminal } from "lucide-react";

interface Stats {
  active_firs: number;
  high_risk_zones: number;
  flagged_entities: number;
  patrol_units_active: number;
}

export default function DashboardView() {
  const { token, role, setActiveSidebarTab } = useAppStore();
  const [stats, setStats] = useState<Stats>({
    active_firs: 142,
    high_risk_zones: 2,
    flagged_entities: 12,
    patrol_units_active: 18
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        
        // Fetch stats
        const statsRes = await fetch("http://localhost:8000/api/v1/analytics/dashboard", { headers });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch logs if Commissioner/Admin
        if (role === "Commissioner") {
          const logsRes = await fetch("http://localhost:8000/api/v1/logs?limit=8", { headers });
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            setLogs(logsData);
          }
        } else {
          // Simulated fallback logs for non-admin profiles
          setLogs([
            { id: 1, action: "NODE_CONNECTED", timestamp: new Date().toISOString(), details: "Secure gateway node established" },
            { id: 2, action: "QUERY_MAP_LAYERS", timestamp: new Date(Date.now() - 50000).toISOString(), details: "Operator initiated coordinate sweep" },
            { id: 3, action: "RUN_ML_PATROLS", timestamp: new Date(Date.now() - 200000).toISOString(), details: "Calculated hotspot clusters density (eps=0.012)" },
          ]);
        }
      } catch (err) {
        console.error("Dashboard metrics fetch failure", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [token, role]);

  return (
    <div className="w-full flex flex-col gap-6 font-mono">
      
      {/* Welcome Banner */}
      <div className="glass-card rounded-xl p-5 border border-slate-800 flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-1.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Welcome back, Agent
          </h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed">
            SYSTEM STATUS: ONLINE // CLEARANCE RATING: LEVEL_{role}
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 border border-blue-500/20 bg-blue-950/10 px-3 py-1.5 rounded-lg text-blue-400 text-[10px] font-bold">
          <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "12s" }} />
          <span>GWY_NODE_SECURE</span>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Active FIRs */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] uppercase tracking-wider">ACTIVE INCIDENTS</span>
            <Shield className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{stats.active_firs}</h3>
            <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wide">+4% vs last week</span>
          </div>
        </div>

        {/* High-Risk Hotspots */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] uppercase tracking-wider">THREAT HOTSPOTS</span>
            <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{stats.high_risk_zones.toString().padStart(2, "0")}</h3>
            <span className="text-[8px] text-red-400 font-bold uppercase tracking-wide">Critical zones flagged</span>
          </div>
        </div>

        {/* Flagged entities */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] uppercase tracking-wider">FLAGGED SUSPECTS</span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{stats.flagged_entities}</h3>
            <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-wide">Suspects mapped</span>
          </div>
        </div>

        {/* Patrol units */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] uppercase tracking-wider">PATROLS DISPATCHED</span>
            <MapPin className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">{stats.patrol_units_active}</h3>
            <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wide">Units on shift</span>
          </div>
        </div>

      </div>

      {/* Main Body Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Grid Trend & Shortcuts */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Trend Preview */}
          <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4 relative">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Activity className="h-3.5 w-3.5 text-blue-500" /> Spatial Intelligence Feed
            </h4>
            
            {/* SVG Trend Line Graph */}
            <div className="w-full h-44 flex items-center justify-center bg-slate-950/40 border border-slate-900 rounded-lg p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0,25 Q 15,10 30,22 T 60,8 T 90,18 L 100,12" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinecap="round" />
                <path d="M 0,25 Q 15,10 30,22 T 60,8 T 90,18 L 100,12 L 100,30 L 0,30 Z" fill="url(#areaGrad)" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#1e293b" strokeWidth="0.1" strokeDasharray="2, 2" />
                <line x1="0" y1="10" x2="100" y2="10" stroke="#1e293b" strokeWidth="0.1" strokeDasharray="2, 2" />
              </svg>
              <span className="absolute top-2 left-2 text-[8px] text-slate-600 uppercase">Weekly incidents trend frequency</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-3 gap-4">
            
            <button
              onClick={() => setActiveSidebarTab("Map")}
              className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-blue-500/50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-300"
            >
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="text-[9px] uppercase tracking-wider text-slate-300">Map Interface</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab("Database")}
              className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-indigo-500/50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-300"
            >
              <Terminal className="h-5 w-5 text-indigo-500" />
              <span className="text-[9px] uppercase tracking-wider text-slate-300">Write Registry</span>
            </button>

            <button
              onClick={() => setActiveSidebarTab("Analytics")}
              className="glass-card rounded-xl p-4 border border-slate-800/80 hover:border-amber-500/50 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all duration-300"
            >
              <Activity className="h-5 w-5 text-amber-500" />
              <span className="text-[9px] uppercase tracking-wider text-slate-300">Analytics charts</span>
            </button>

          </div>

        </div>

        {/* Column 3: Live Audit Logs */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
          
          <h4 className="relative z-10 text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-blue-500" /> Secure Audit Trail
          </h4>

          <div className="relative z-10 flex-1 flex flex-col gap-3.5 overflow-y-auto max-h-80">
            {logs.length === 0 ? (
              <p className="text-slate-600 text-center py-8 text-[9px] uppercase">No logs registered.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-l-2 border-slate-800 pl-3 flex flex-col gap-1 text-[9px]">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-bold text-blue-400 tracking-wide uppercase">{log.action}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 leading-normal">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
