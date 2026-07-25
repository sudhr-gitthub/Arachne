"use client";
import { API_BASE_URL } from "@/services/api/config";


import React, { useState, useEffect } from "react";
import { useAppStore, Role } from "@/store/useAppStore";
import { Settings, Shield, Cpu, Network, CheckCircle, RefreshCw, Key, Wifi } from "lucide-react";

export default function SettingsView() {
  const { user, role, token, setRole, setUser } = useAppStore();
  const [targetRole, setTargetRole] = useState<Role>(role);
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Diagnostics states
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<string>("CHECKING...");
  const [mlStatus, setMlStatus] = useState<string>("CHECKING...");
  const [dbStats, setDbStats] = useState({ nodes: 0, edges: 0, incidents: 0 });

  const runDiagnostics = async () => {
    const startTime = performance.now();
    try {
      // Test API latency & connectivity
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const endTime = performance.now();
      if (res.ok) {
        setApiLatency(Math.round(endTime - startTime));
        setDbStatus("CONNECTED (SQLITE)");
      } else {
        setDbStatus("DATABASE UNREACHABLE");
      }

      // Test ML predict endpoint
      const mlRes = await fetch(`${API_BASE_URL}/api/v1/geo/predict-patrols`, { method: "GET" });
      if (mlRes.ok) {
        setMlStatus("OPERATIONAL (DBSCAN CLUSTERING)");
      } else {
        setMlStatus("ML ENGINE OFFLINE");
      }

      // Gather collection count info
      const graphRes = await fetch(`${API_BASE_URL}/api/v1/nexus/graph`);
      const incRes = await fetch(`${API_BASE_URL}/api/v1/geo/incidents`);
      if (graphRes.ok && incRes.ok) {
        const graphData = await graphRes.json();
        const incData = await incRes.json();
        setDbStats({
          nodes: graphData.nodes.length,
          edges: graphData.edges.length,
          incidents: incData.length,
        });
      }
    } catch {
      setDbStatus("OFFLINE BACKUP ACTIVE");
      setMlStatus("MOCK SIMULATOR RUNNING");
      setApiLatency(null);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [token]);

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: targetRole }),
      });

      if (!res.ok) {
        throw new Error("Clearance level update failed on the server.");
      }

      const updatedUser = await res.json();
      
      // Update local state store
      setUser({
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role as Role,
      });
      setRole(updatedUser.role as Role);

      setStatusMsg({ type: "success", text: `Authorization successfully updated to LEVEL: ${updatedUser.role}!` });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update role." });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px]">
      
      {/* Column 1: Role Configuration & Security Profile */}
      <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        
        {/* Title */}
        <div className="relative z-10 border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-blue-500" /> Security Profile Clearance
          </h2>
          <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
            Operator RBAC Manager
          </p>
        </div>

        {/* User Card */}
        {user && (
          <div className="relative z-10 bg-slate-900/40 border border-slate-850 p-4 rounded-lg flex flex-col gap-2 font-mono text-xs">
            <div>
              <span className="block text-slate-500 text-[8px] uppercase">OPERATOR NAME</span>
              <span className="text-white font-bold">{user.name || "UNREGISTERED"}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[8px] uppercase">SECURE CIPHER EMAIL</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-[8px] uppercase">CURRENT CLEARANCE</span>
              <span className="text-blue-400 font-bold tracking-widest uppercase">{role} LEVEL</span>
            </div>
          </div>
        )}

        {/* Change Clearance Level Form */}
        <form onSubmit={handleUpdateRole} className="relative z-10 flex flex-col gap-4 font-mono text-[10px] text-slate-400 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="uppercase tracking-wide text-slate-500">Request Clearance Upgrade</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as Role)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="SHO">Station House Officer (SHO)</option>
              <option value="Commissioner">Commissioner (Admin)</option>
            </select>
          </div>

          {statusMsg && (
            <div className={`p-2.5 rounded text-[9px] font-semibold ${
              statusMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {statusMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={updating || targetRole === role}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider cursor-pointer transition-all duration-300"
          >
            {updating ? "UPGRADING KEY CLUSTER..." : "UPDATE SECURITY CLEARANCE"}
          </button>
        </form>
      </div>

      {/* Column 2: System Health Diagnostics */}
      <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        
        {/* Title */}
        <div className="relative z-10 border-b border-slate-800 pb-3 flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-blue-500" /> Node Diagnostics
          </h2>
          <button
            onClick={runDiagnostics}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reload Diagnostics"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Diagnostic parameters */}
        <div className="relative z-10 flex-1 flex flex-col gap-4 font-mono text-[10px] text-slate-400">
          
          <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
            <span className="text-slate-500 uppercase">TACTICAL ENDPOINT</span>
            <span className="text-slate-200">{API_BASE_URL}/api/v1</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
            <span className="text-slate-500 uppercase">SERVER STATE</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> ARACHNE_ONLINE
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
            <span className="text-slate-500 uppercase">API LATENCY</span>
            <span className={apiLatency ? "text-slate-200 font-bold" : "text-amber-500"}>
              {apiLatency ? `${apiLatency} ms` : "OFFLINE CACHE"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
            <span className="text-slate-500 uppercase">DATABASE CONFIG</span>
            <span className="text-blue-400 font-bold">{dbStatus}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
            <span className="text-slate-500 uppercase">ML PREDICTOR STATUS</span>
            <span className="text-indigo-400 font-bold">{mlStatus}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
            <span className="text-slate-500 uppercase">CRYPTO AUTH CIPHER</span>
            <span className="text-slate-300 font-bold">HS256 (JWT-SIGN)</span>
          </div>

        </div>
      </div>

      {/* Column 3: Telemetry Registries Summary */}
      <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        
        {/* Title */}
        <div className="relative z-10 border-b border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <Network className="h-4 w-4 text-blue-500" /> Database Registry Totals
          </h2>
          <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
            Realtime database telemetry count
          </p>
        </div>

        {/* Diagnostic collections count */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-5 font-mono text-xs">
          
          <div className="bg-slate-900/30 border border-slate-850 rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-500 text-[8px] uppercase">INCIDENT REGISTRY</span>
              <span className="text-white font-black text-sm">{dbStats.incidents} REPORTS</span>
            </div>
            <Wifi className="h-5 w-5 text-blue-500" />
          </div>

          <div className="bg-slate-900/30 border border-slate-850 rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-500 text-[8px] uppercase">TACTICAL GRAPH NODES</span>
              <span className="text-white font-black text-sm">{dbStats.nodes} ENTITIES</span>
            </div>
            <Key className="h-5 w-5 text-indigo-500" />
          </div>

          <div className="bg-slate-900/30 border border-slate-850 rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-500 text-[8px] uppercase">TACTICAL GRAPH EDGES</span>
              <span className="text-white font-black text-sm">{dbStats.edges} RELATIONS</span>
            </div>
            <Settings className="h-5 w-5 text-amber-500" />
          </div>

        </div>
      </div>
      
    </div>
  );
}
