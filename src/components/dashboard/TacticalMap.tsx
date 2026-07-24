"use client";

import React, { useState } from "react";
import { Maximize2, ZoomIn, ZoomOut, Compass, ShieldAlert } from "lucide-react";

export default function TacticalMap() {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Sector-08 Tactical Overlay
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
          <span>LAT: 12.9716° N</span>
          <span>|</span>
          <span>LON: 77.5946° E</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Map Content Viewport */}
      <div className="relative flex-1 bg-[radial-gradient(ellipse_at_center,rgba(11,19,38,1)_0%,rgba(6,9,18,1)_100%)] overflow-hidden cursor-crosshair">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.08]" 
          style={{
            backgroundImage: `
              linear-gradient(to right, #3b82f6 1px, transparent 1px),
              linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.2s ease-out'
          }}
        />

        {/* Tactical Vectors & Boundaries */}
        <svg 
          className="absolute inset-0 h-full w-full opacity-30"
          style={{
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          {/* Sectors and Roads */}
          <path d="M 0 100 Q 200 150 400 50 T 800 200" fill="none" stroke="#424754" strokeWidth="1" strokeDasharray="4, 4" />
          <path d="M 100 0 L 250 300 Q 400 450 600 600" fill="none" stroke="#424754" strokeWidth="1" />
          <circle cx="350" cy="250" r="120" fill="none" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5, 10" />

          {/* Critical zone contour */}
          <polygon points="450,150 580,180 620,290 510,340 430,250" fill="rgba(239, 68, 68, 0.03)" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.4" />
        </svg>

        {/* Rotating Radar Sweep */}
        <div 
          className="absolute left-1/2 top-1/2 -ml-[250px] -mt-[250px] h-[500px] w-[500px] rounded-full pointer-events-none opacity-20"
          style={{
            background: 'conic-gradient(from 0deg, transparent 50%, rgba(59, 130, 246, 0.25) 100%)',
            animation: 'spin 8s linear infinite'
          }}
        />

        {/* Pulsing Beacon Dots (Beacons) */}
        {/* Beacon 1 (Normal Signal) */}
        <div className="absolute left-[30%] top-[40%] -ml-2 -mt-2 group">
          <div className="absolute h-4 w-4 rounded-full bg-blue-500/30 animate-ping" />
          <div className="relative h-2 w-2 rounded-full bg-blue-500 border border-white/50" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/90 border border-slate-700/80 px-1.5 py-0.5 text-[8px] font-mono text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            UNIT-404 | STAT: STABLE
          </div>
        </div>

        {/* Beacon 2 (Alert - High Risk) */}
        <div className="absolute left-[55%] top-[30%] -ml-2 -mt-2 group">
          <div className="absolute h-5 w-5 rounded-full bg-red-500/40 animate-ping" style={{ animationDuration: '1.2s' }} />
          <div className="relative h-2 w-2 rounded-full bg-red-500 border border-white/80" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/95 border border-red-500/50 px-1.5 py-0.5 text-[8px] font-mono text-red-400">
            ALERT: SECURE_FAIL
          </div>
        </div>

        {/* Beacon 3 (Flagged Entity) */}
        <div className="absolute left-[45%] top-[65%] -ml-2 -mt-2 group">
          <div className="absolute h-4 w-4 rounded-full bg-amber-500/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative h-2 w-2 rounded-full bg-amber-500 border border-white/50" />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/90 border border-slate-700/80 px-1.5 py-0.5 text-[8px] font-mono text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
            TARGET-9A | SUSP_VAL
          </div>
        </div>

        {/* Target Reticle Overlay */}
        <div className="absolute right-8 bottom-8 pointer-events-none flex flex-col items-end gap-1.5 border-l border-b border-blue-500/20 pl-3 pb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>SYS_AUTO_SCAN</span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            RNG: 14.2 KM | HDG: 184°
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute left-4 bottom-4 flex flex-col gap-2 bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setZoom(z => Math.min(z + 10, 150))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(z - 10, 70))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => setZoom(100)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset Map"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
