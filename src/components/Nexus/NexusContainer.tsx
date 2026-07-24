"use client";

import React, { useEffect, useState } from "react";
import { GraphPayload, GraphNode, fetchNexusGraph } from "@/services/api/nexusApi";
import GraphRenderer from "./GraphRenderer";
import { Shield, Phone, Car, FileText, AlertTriangle, Eye, Info, X } from "lucide-react";

// Move fallback graph data outside of the component scope to avoid hook dependency triggers
const fallbackGraphData: GraphPayload = {
  nodes: [
    { id: "S1", label: "Vikram Malhotra (Main Suspect)", group: 1, risk_score: 95.5 },
    { id: "S2", label: "Amit Shah (Associate)", group: 1, risk_score: 78.2 },
    { id: "S3", label: "Rohan Joshi (Under Surveillance)", group: 1, risk_score: 62.0 },
    { id: "S4", label: "Karan Singhal (Logistics)", group: 1, risk_score: 48.1 },
    { id: "S5", label: "Sanjay Dutt (Informant/Suspect)", group: 1, risk_score: 55.4 },
    { id: "P1", label: "+91 98765 43210 (Malhotra Burner)", group: 2, risk_score: 85.0 },
    { id: "P2", label: "+91 87654 32109 (Malhotra Personal)", group: 2, risk_score: 45.0 },
    { id: "P3", label: "+91 76543 21098 (Shah Burner)", group: 2, risk_score: 80.0 },
    { id: "P4", label: "+91 65432 10987 (Joshi Burner)", group: 2, risk_score: 60.0 },
    { id: "P5", label: "+91 54321 09876 (Dutt Burner)", group: 2, risk_score: 50.0 },
    { id: "V1", label: "KA-51-MD-9876 (Black SUV)", group: 3, risk_score: 90.0 },
    { id: "V2", label: "MH-12-AS-1284 (White Sedan)", group: 3, risk_score: 68.5 },
    { id: "V3", label: "DL-03-KS-4242 (Delivery Van)", group: 3, risk_score: 35.0 },
    { id: "F1", label: "FIR-2026/89 (Smuggling)", group: 4, risk_score: 92.0 },
    { id: "F2", label: "FIR-2026/102 (Conspiracy)", group: 4, risk_score: 75.0 },
    { id: "F3", label: "FIR-2026/145 (Extortion)", group: 4, risk_score: 58.0 },
    { id: "F4", label: "FIR-2026/188 (Cargo Theft)", group: 4, risk_score: 40.0 },
  ],
  edges: [
    { source: "S1", target: "P1", relationship: "Called" },
    { source: "S1", target: "P2", relationship: "Called" },
    { source: "S1", target: "V1", relationship: "Drives" },
    { source: "S1", target: "F1", relationship: "Mentioned In" },
    { source: "S1", target: "F2", relationship: "Mentioned In" },
    { source: "S2", target: "P3", relationship: "Called" },
    { source: "S2", target: "V2", relationship: "Drives" },
    { source: "S2", target: "F1", relationship: "Mentioned In" },
    { source: "S2", target: "P1", relationship: "Called" },
    { source: "S1", target: "P3", relationship: "Called" },
    { source: "P2", target: "P3", relationship: "Called" },
    { source: "S3", target: "P4", relationship: "Called" },
    { source: "S3", target: "F3", relationship: "Mentioned In" },
    { source: "S3", target: "P3", relationship: "Called" },
    { source: "S4", target: "V3", relationship: "Drives" },
    { source: "S4", target: "F4", relationship: "Mentioned In" },
    { source: "S4", target: "P4", relationship: "Called" },
    { source: "S5", target: "P5", relationship: "Called" },
    { source: "S5", target: "F2", relationship: "Mentioned In" },
    { source: "S5", target: "P1", relationship: "Called" },
    { source: "V1", target: "F1", relationship: "Mentioned In" },
    { source: "V2", target: "F3", relationship: "Mentioned In" },
  ],
};

export default function NexusContainer() {
  const [graphData, setGraphData] = useState<GraphPayload | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchNexusGraph();
        setGraphData(data);
        setErrorState(null);
      } catch {
        console.warn("Backend API not reachable. Switching to client-side fallback graph data.");
        setGraphData(fallbackGraphData);
        setErrorState("offline-fallback");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800">
      {/* Graph Area */}
      <div className="flex-1 relative flex flex-col min-h-[300px]">
        {/* Graph Floating Header */}
        <div className="absolute top-3 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Nexus Connectivity Network
          </h3>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>
              {errorState === "offline-fallback"
                ? "CLIENT CACHE DATA (BACKEND OFFLINE)"
                : "LIVE TELEMETRY ACTIVE"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-xs font-mono text-slate-400">LOADING LINK STRUCTURES...</span>
          </div>
        ) : graphData ? (
          <GraphRenderer
            data={graphData}
            selectedNode={selectedNode}
            onNodeClick={setSelectedNode}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-red-400">
            Critical Failure: Unable to generate graph telemetry.
          </div>
        )}
      </div>

      {/* Side Details Panel */}
      {selectedNode && (
        <div className="w-full md:w-[280px] border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/90 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {selectedNode.group === 1 && <Shield className="h-4 w-4 text-red-500" />}
              {selectedNode.group === 2 && <Phone className="h-4 w-4 text-blue-500" />}
              {selectedNode.group === 3 && <Car className="h-4 w-4 text-yellow-500" />}
              {selectedNode.group === 4 && <FileText className="h-4 w-4 text-slate-400" />}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Entity Details
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Label Card */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
              {selectedNode.group === 1 && "Suspect Entity"}
              {selectedNode.group === 2 && "Burn Phone Asset"}
              {selectedNode.group === 3 && "Vehicle Asset"}
              {selectedNode.group === 4 && "FIR Registry file"}
            </span>
            <h4 className="text-sm font-bold text-white leading-tight">
              {selectedNode.label}
            </h4>
          </div>

          {/* Risk Score details */}
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/80 flex flex-col gap-1">
            <span className="text-[9px] uppercase font-mono text-slate-500">Threat Rating</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-100 font-mono">
                {selectedNode.risk_score.toFixed(1)}%
              </span>
              {selectedNode.risk_score > 80 ? (
                <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 text-[8px] font-bold text-red-400 animate-pulse">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  CRITICAL
                </span>
              ) : selectedNode.risk_score > 60 ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">
                  <Eye className="h-2.5 w-2.5" />
                  ELEVATED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 text-[8px] font-bold text-blue-400">
                  <Info className="h-2.5 w-2.5" />
                  MONITORED
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Mock Content based on Group type */}
          {selectedNode.group === 4 ? (
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="border-t border-slate-800 pt-2">
                <span className="block text-slate-500 text-[9px] uppercase">CASE REGISTRATION</span>
                <span className="text-slate-300 font-semibold">{selectedNode.id}-TACTICAL</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[9px] uppercase">OFFENSE</span>
                <span className="text-slate-300">Contraband smuggling & illegal transit coordination</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[9px] uppercase">INVESTIGATOR</span>
                <span className="text-slate-300">Inspector A. Sharma (Crime Branch)</span>
              </div>
              <div>
                <span className="block text-slate-500 text-[9px] uppercase">SUMMARY</span>
                <span className="text-slate-400 text-[11px] leading-relaxed font-sans">
                  Subject assets were identified during cross-reference sweeps of mobile signal towers near active contraband drop sites. Link mapping shows a recurring communications cluster.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="border-t border-slate-800 pt-2">
                <span className="block text-slate-500 text-[9px] uppercase">NODE ID</span>
                <span className="text-slate-300">{selectedNode.id}</span>
              </div>
              {selectedNode.group === 1 && (
                <>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase">STATUS</span>
                    <span className="text-red-400 font-semibold">Active Suspect</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase">ASSOCIATED CHANNELS</span>
                    <span className="text-slate-300">3 Burner lines, 1 Registered SUV</span>
                  </div>
                </>
              )}
              {selectedNode.group === 2 && (
                <>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase">CARRIER NETWORK</span>
                    <span className="text-slate-300">TATA Telecom (Prepaid Burner)</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase">SPIKE RATING</span>
                    <span className="text-amber-400">High call frequency to Sector 08</span>
                  </div>
                </>
              )}
              {selectedNode.group === 3 && (
                <>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase">ASSET MAKE</span>
                    <span className="text-slate-300">Black SUV (KA-51-MD-9876)</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[9px] uppercase">LOG ENTRY</span>
                    <span className="text-slate-300">Logged 3 times at Toll plaza 8B</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
