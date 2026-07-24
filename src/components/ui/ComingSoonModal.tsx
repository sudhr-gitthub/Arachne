"use client";

import React from "react";
import { ShieldAlert, Lock, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function ComingSoonModal() {
  const { activeSidebarTab, setActiveSidebarTab } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-950/90 p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden">
        {/* Cyber grid background inside modal */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setActiveSidebarTab("Map")}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
          title="Return to Map"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Shield Lock Graphic */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
          <span className="absolute inset-0 rounded-full bg-red-500/5 animate-ping" />
          <Lock className="h-8 w-8 text-red-500 animate-pulse" />
        </div>

        {/* Coded Clearance Banner */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-red-400 border border-red-500/20 mb-4 font-mono">
          <ShieldAlert className="h-3 w-3" /> SECURITY LEVEL 4 REQUIRED
        </div>

        {/* Text Details */}
        <h2 className="text-lg font-bold tracking-wider text-white uppercase mb-2">
          Module Encrypted
        </h2>
        <p className="text-xs font-mono text-slate-400 tracking-wide uppercase mb-6">
          Accessing: <span className="text-red-400">{activeSidebarTab} Node</span>{" // "}Requires Higher Clearance
        </p>

        {/* Diagnostics / Decryption Frame */}
        <div className="border border-slate-900 bg-slate-950/60 rounded-lg p-4 font-mono text-left text-[10px] text-slate-600 mb-6">
          <p>&gt; DECRYPTION KEY: ACCESS_DENIED</p>
          <p>&gt; IP LOCATION: RECORDED</p>
          <p>&gt; TARGET STACK: SECURE_ARACHNE_CIPHER_V2</p>
        </div>

        {/* Return Button */}
        <button
          onClick={() => setActiveSidebarTab("Map")}
          className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-mono text-xs uppercase tracking-wider font-bold py-3 px-4 rounded-xl border border-red-500/30 hover:border-red-400 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
        >
          Return to Command Map
        </button>
      </div>
    </div>
  );
}
