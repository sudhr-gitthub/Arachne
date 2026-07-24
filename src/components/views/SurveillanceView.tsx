"use client";

import React, { useEffect, useState } from "react";

export default function SurveillanceView() {
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(now.toISOString().replace("T", " ").substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const feeds = [
    { name: "CAM_01 // NORTH RANGE INTERSECTION", status: "ONLINE" },
    { name: "CAM_02 // WAREHOUSE COMPLEX E", status: "ONLINE" },
    { name: "CAM_03 // METRO STATION MAIN GATES", status: "ONLINE" },
    { name: "CAM_04 // SECTOR 4 BLOCK B CORRIDOR", status: "ONLINE" },
  ];

  const anprFeeds = [
    { plate: "KA-51-MD-9876", owner: "V. Malhotra", type: "CRITICAL MATCH", time: "22:15:40", isAlert: true },
    { plate: "MH-12-AS-1284", owner: "A. Shah", type: "HIGH RISK MATCH", time: "22:14:12", isAlert: true },
    { plate: "DL-04-XX-1100", owner: "Unknown", type: "NO MATCH (CLEAR)", time: "22:13:05", isAlert: false },
    { plate: "KA-03-TR-9110", owner: "Local Resident", type: "NO MATCH (CLEAR)", time: "22:11:58", isAlert: false },
    { plate: "HR-26-BL-7700", owner: "Commercial", type: "NO MATCH (CLEAR)", time: "22:09:44", isAlert: false },
    { plate: "UP-16-AX-1234", owner: "Govt Utility", type: "NO MATCH (CLEAR)", time: "22:08:21", isAlert: false },
  ];

  return (
    <div className="w-full grid grid-cols-10 gap-6 min-h-[600px]">
      {/* 2x2 CCTV Grid Panel */}
      <div className="col-span-7 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Live CCTV Matrix
            </h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
              Source: City surveillance core // 4 Active Nodes
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
            MATRIX CODE: {timestamp ? timestamp.substring(11, 19) : ""}
          </span>
        </div>

        {/* 2x2 Feeds */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {feeds.map((feed, idx) => (
            <div
              key={idx}
              className="relative rounded-xl border border-slate-800/80 bg-slate-950 flex flex-col overflow-hidden min-h-[240px] hover:border-slate-700/60 transition-colors"
            >
              {/* Scanline / noise overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-20" />
              
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#090d16_1px,transparent_1px),linear-gradient(to_bottom,#090d16_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20 pointer-events-none" />

              {/* Feed Header */}
              <div className="relative z-10 flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-900 font-mono text-[10px]">
                <span className="text-slate-400 font-bold">{feed.name}</span>
                <span className="text-emerald-400 font-semibold">{feed.status}</span>
              </div>

              {/* Feed Content (Empty State Simulation) */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Center Blinking REC marker */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300">REC</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600">{timestamp || "SYSTEM LOAD..."}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ANPR Sidebar Panel */}
      <div className="col-span-3 glass-card rounded-xl p-5 border border-slate-800 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live ANPR feed
            </h3>
            <p className="text-[9px] font-mono text-slate-600 uppercase mt-0.5">
              Automatic Plate Recognition
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {anprFeeds.map((feed, idx) => (
            <div
              key={idx}
              className={`p-3 rounded border font-mono text-left transition-colors duration-200 ${
                feed.isAlert
                  ? "bg-red-950/10 border-red-500/20 hover:border-red-500/40"
                  : "bg-slate-950/30 border-slate-900 hover:border-slate-800/80"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-100">{feed.plate}</span>
                <span className="text-[9px] text-slate-500">{feed.time}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Owner: {feed.owner}</span>
                <span
                  className={`font-semibold ${
                    feed.isAlert ? "text-red-400 animate-pulse" : "text-slate-500"
                  }`}
                >
                  {feed.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
