"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Incident, PatrolZone, fetchIncidents, fetchPatrolZones } from "@/services/api/geoApi";
import { Filter, Calendar, Activity, Zap } from "lucide-react";

// Dynamically import MapRenderer to prevent SSR/window errors
const MapRenderer = dynamic(() => import("./MapRenderer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span className="text-xs font-mono text-slate-400">INITIALIZING TACTICAL MAP...</span>
    </div>
  ),
});

export default function MapContainer() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrolZones, setPatrolZones] = useState<PatrolZone[]>([]);
  const [showPredictiveZones, setShowPredictiveZones] = useState<boolean>(false);
  const [loadingZones, setLoadingZones] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category: "All",
    timeShift: "All",
  });

  const categories = ["All", "Armed Robbery", "Cyber Fraud", "Assault", "Theft"];
  const shifts = ["All", "Day", "Night"];

  // Local fallback mock incident generator
  const generateLocalMockIncidents = (): Incident[] => {
    const fallbackCategories = ["Armed Robbery", "Cyber Fraud", "Assault", "Theft"];
    const fallbackShifts = ["Day", "Night"];
    const centerLat = 12.9716;
    const centerLng = 77.5946;

    // Box-Muller normal distribution generator
    const normalRandom = () => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const list: Incident[] = [];
    for (let i = 0; i < 150; i++) {
      const lat = centerLat + normalRandom() * 0.015;
      const lng = centerLng + normalRandom() * 0.015;
      const category = fallbackCategories[Math.floor(Math.random() * fallbackCategories.length)];
      const shift = fallbackShifts[Math.floor(Math.random() * fallbackShifts.length)];
      list.push({
        id: `INC-${1000 + i}`,
        lat,
        lng,
        category: category as Incident["category"],
        time_shift: shift as Incident["time_shift"],
      });
    }
    return list;
  };

  // Local fallback mock patrol zones
  const fallbackPatrolZones: PatrolZone[] = [
    {
      id: "ZONE-ALPHA",
      coordinates: [
        [12.982, 77.602],
        [12.995, 77.615],
        [12.985, 77.625],
        [12.972, 77.610],
        [12.982, 77.602],
      ],
      risk_level: "Critical",
    },
    {
      id: "ZONE-BRAVO",
      coordinates: [
        [12.955, 77.582],
        [12.968, 77.595],
        [12.952, 77.608],
        [12.940, 77.590],
        [12.955, 77.582],
      ],
      risk_level: "High",
    },
    {
      id: "ZONE-CHARLIE",
      coordinates: [
        [12.970, 77.570],
        [12.980, 77.582],
        [12.968, 77.590],
        [12.958, 77.575],
        [12.970, 77.570],
      ],
      risk_level: "High",
    },
  ];

  // Fetch incidents on load
  useEffect(() => {
    async function loadIncidents() {
      try {
        const data = await fetchIncidents();
        setIncidents(data);
        setErrorState(null);
      } catch {
        console.warn("Backend geo API offline. Triggering client-side fallback telemetry data.");
        const fallbackData = generateLocalMockIncidents();
        setIncidents(fallbackData);
        setErrorState("offline");
      }
    }
    loadIncidents();
  }, []);

  // Compute filtered incidents dynamically to avoid setState in effect
  const filteredIncidents = useMemo(() => {
    let filtered = incidents;
    if (filters.category !== "All") {
      filtered = filtered.filter((inc) => inc.category === filters.category);
    }
    if (filters.timeShift !== "All") {
      filtered = filtered.filter((inc) => inc.time_shift === filters.timeShift);
    }
    return filtered;
  }, [filters, incidents]);

  // Run ML patrol predictions
  const runPredictiveML = async () => {
    if (showPredictiveZones) {
      setShowPredictiveZones(false);
      return;
    }

    if (patrolZones.length > 0) {
      setShowPredictiveZones(true);
      return;
    }

    try {
      setLoadingZones(true);
      const data = await fetchPatrolZones();
      setPatrolZones(data);
      setShowPredictiveZones(true);
    } catch {
      console.warn("Patrol zones fetching failed. Loading mock ML patrol zones.");
      setPatrolZones(fallbackPatrolZones);
      setShowPredictiveZones(true);
    } finally {
      setLoadingZones(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex flex-col">
      {/* Map Renderer Wrapper */}
      <div className="flex-1 h-full w-full">
        <MapRenderer
          incidents={filteredIncidents}
          showPredictiveZones={showPredictiveZones}
          patrolZones={patrolZones}
        />
      </div>

      {/* Absolutely Positioned Controller Panel Overlay */}
      <div className="absolute top-4 right-4 z-[1000] w-64 glass-card rounded-xl p-4 flex flex-col gap-4 border border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Tactical Filters
            </span>
          </div>
          <span className="text-[9px] font-mono bg-blue-950/80 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
            {filteredIncidents.length} INCS
          </span>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 flex items-center gap-1">
            <Activity className="h-2.5 w-2.5" /> Incident Class
          </label>
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-1.5 px-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Time Shift Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-mono tracking-widest text-slate-500 flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" /> Operations Shift
          </label>
          <div className="flex bg-slate-900 border border-slate-700/60 p-1 rounded-lg">
            {shifts.map((shift) => (
              <button
                key={shift}
                onClick={() => setFilters((f) => ({ ...f, timeShift: shift }))}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filters.timeShift === shift
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {shift}
              </button>
            ))}
          </div>
        </div>

        {/* ML Patrol Predictor Trigger Button */}
        <div className="border-t border-slate-800/80 pt-3">
          <button
            onClick={runPredictiveML}
            disabled={loadingZones}
            className={`w-full py-2.5 px-3 rounded-lg text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 ${
              showPredictiveZones
                ? "bg-red-600/30 border border-red-500/50 hover:bg-red-600/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]"
            } disabled:opacity-50`}
          >
            <Zap className={`h-3.5 w-3.5 ${showPredictiveZones ? "animate-pulse" : ""}`} />
            {loadingZones
              ? "DEPLOYING AGENT ML..."
              : showPredictiveZones
              ? "DEACTIVATE PATROL ML"
              : "RUN PREDICTIVE BEAT ML"}
          </button>
        </div>
      </div>
      {errorState === "offline" && (
        <div className="absolute bottom-2 left-2 z-[1000] text-[8px] font-mono text-amber-500 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/20">
          OFFLINE CACHE ACTIVE
        </div>
      )}
    </div>
  );
}
