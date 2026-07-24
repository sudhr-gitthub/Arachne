"use client";

import React, { useState } from "react";
import { Network, Database, RefreshCw, AlertCircle } from "lucide-react";

export default function NexusLinkAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);

  const handleTriggerAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 2000);
  };

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800 p-4">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Nexus Link Analyzer
          </span>
        </div>
        <button
          onClick={handleTriggerAnalysis}
          disabled={analyzing}
          className={`flex items-center gap-1.5 rounded bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
        >
          <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? "ANALYZING..." : "RE-SCAN"}
        </button>
      </div>

      {/* Network Graph Area */}
      <div className="relative flex-1 min-h-[160px] bg-slate-900/40 rounded-lg border border-slate-800/50 flex items-center justify-center overflow-hidden">
        {/* Connection flow lines */}
        <svg className="absolute inset-0 h-full w-full">
          {/* Outer circle layout connecting lines */}
          <line x1="50%" y1="50%" x2="20%" y2="25%" stroke={analyzing ? "#3b82f6" : "#424754"} strokeWidth="1.5" strokeDasharray="5, 3" />
          <line x1="50%" y1="50%" x2="80%" y2="25%" stroke={analyzing ? "#ef4444" : "#424754"} strokeWidth="1.5" strokeDasharray="5, 3" />
          <line x1="50%" y1="50%" x2="15%" y2="70%" stroke="#424754" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="85%" y2="70%" stroke="#424754" strokeWidth="1.5" />

          {/* Glowing pulse on lines when scanning */}
          {analyzing && (
            <>
              <circle r="4" fill="#3b82f6" className="animate-bounce">
                <animateMotion path="M 175 100 L 70 50" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="4" fill="#ef4444" className="animate-bounce">
                <animateMotion path="M 175 100 L 280 50" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>

        {/* Central Source Node */}
        <div className="absolute z-10 flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-slate-950 border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)] flex items-center justify-center animate-pulse">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-[9px] font-mono text-slate-300 font-bold mt-1 bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800">
            ROOT_ENTITY_X
          </span>
        </div>

        {/* Satellite Node 1 (Device IP) */}
        <div className="absolute top-[12%] left-[10%] flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center hover:border-blue-400 transition-colors">
            <span className="text-[9px] font-mono text-slate-500 font-bold">IP</span>
          </div>
          <span className="text-[8px] font-mono text-slate-400 mt-0.5">192.168.1.156</span>
        </div>

        {/* Satellite Node 2 (Threat Alert - Alert) */}
        <div className="absolute top-[12%] right-[10%] flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-slate-950 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)] flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <span className="text-[8px] font-mono text-red-400 mt-0.5">SUSP_TRANS_08</span>
        </div>

        {/* Satellite Node 3 (Location) */}
        <div className="absolute bottom-[15%] left-[8%] flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="text-[9px] text-slate-500">LOC</span>
          </div>
          <span className="text-[8px] font-mono text-slate-400 mt-0.5">SEC-08_WHS</span>
        </div>

        {/* Satellite Node 4 (Vehicle) */}
        <div className="absolute bottom-[15%] right-[6%] flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
            <span className="text-[9px] text-slate-500">VEH</span>
          </div>
          <span className="text-[8px] font-mono text-slate-400 mt-0.5">KA-01-N-1284</span>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono border-t border-slate-800/80 pt-2 text-slate-500">
        <div>
          <span className="block text-slate-400 font-semibold">INTEGRITY INDEX</span>
          <span className="text-emerald-400 font-bold">89.4% (SECURE)</span>
        </div>
        <div className="text-right">
          <span className="block text-slate-400 font-semibold">LINK COUNT</span>
          <span className="text-blue-400 font-bold">44 ACTIVE LINKS</span>
        </div>
      </div>
    </div>
  );
}
