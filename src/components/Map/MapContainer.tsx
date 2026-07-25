"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Incident, PatrolZone, Station, fetchIncidents, fetchPatrolZones, fetchStations } from "@/services/api/geoApi";
import { useAppStore } from "@/store/useAppStore";
import { Filter, Calendar, Activity, Zap, ShieldAlert, Cpu, Eye, FileText, ChevronRight } from "lucide-react";

// Dynamically import MapRenderer to prevent SSR/window errors
const MapRenderer = dynamic(() => import("./MapRenderer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <span className="text-xs font-mono text-slate-400">INITIALIZING TACTICAL MAP...</span>
    </div>
  ),
});

export default function MapContainer() {
  const { token } = useAppStore();
  
  // States
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrolZones, setPatrolZones] = useState<PatrolZone[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [showPredictiveZones, setShowPredictiveZones] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Hotspot clustering params
  const [algorithm, setAlgorithm] = useState<string>("dbscan");
  const [eps, setEps] = useState<number>(0.012);
  const [minSamples, setMinSamples] = useState<number>(5);
  const [nClusters, setNClusters] = useState<number>(4);
  const [minClusterSize, setMinClusterSize] = useState<number>(5);

  // Filters
  const [filters, setFilters] = useState({
    category: "All",
    timeShift: "All",
    district: "All",
    riskLevel: "All",
    search: ""
  });

  // Selected hotspot state details
  const [selectedZone, setSelectedZone] = useState<PatrolZone | null>(null);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);

  const categories = ["All", "Armed Robbery", "Cyber Fraud", "Assault", "Theft"];
  const shifts = ["All", "Day", "Night"];
  const districts = ["All", "Central", "North", "South", "East", "West"];
  const risks = ["All", "Critical", "High"];

  // Helper: compute centroid
  const getCentroid = (coords: [number, number][]): [number, number] => {
    if (!coords || coords.length === 0) return [12.9716, 77.5946];
    let latSum = 0;
    let lngSum = 0;
    coords.forEach(pt => {
      latSum += pt[0];
      lngSum += pt[1];
    });
    return [latSum / coords.length, lngSum / coords.length];
  };

  // Helper: count incidents in zone
  const getCrimesInZone = (zone: PatrolZone, allIncidents: Incident[]) => {
    if (zone.coordinates.length === 0) return { count: 0, categories: {} as Record<string, number> };
    const centroid = zone.centroid || getCentroid(zone.coordinates);
    
    // Proximity lookup within ~1.5km
    const matching = allIncidents.filter(inc => {
      const dist = Math.sqrt(Math.pow(inc.lat - centroid[0], 2) + Math.pow(inc.lng - centroid[1], 2));
      return dist <= 0.018;
    });

    const counts: Record<string, number> = {};
    matching.forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

    return {
      count: matching.length,
      categories: counts
    };
  };

  const loadMapData = async () => {
    setLoading(true);
    try {
      // 1. Fetch filtered incidents
      const incData = await fetchIncidents({
        category: filters.category,
        shift: filters.timeShift,
        district: filters.district,
        search: filters.search,
        token
      });
      setIncidents(incData);

      // 2. Fetch stations
      const stationData = await fetchStations(token);
      setStations(stationData);

      // 3. Fetch patrol prediction hotspots with dynamic clustering parameters
      const zoneData = await fetchPatrolZones({
        algorithm,
        eps,
        minSamples,
        nClusters,
        minClusterSize,
        token
      });
      
      // Filter predictions based on risk filter
      const filteredZones = filters.riskLevel === "All" 
        ? zoneData 
        : zoneData.filter(z => z.risk_level === filters.riskLevel);
      setPatrolZones(filteredZones);

    } catch (err) {
      console.error("Failed to load backend geo metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [filters, algorithm, eps, minSamples, nClusters, minClusterSize, token]);

  // When a zone is clicked, open panel and trigger AI Insights summary prompt
  const handleZoneClick = async (zone: PatrolZone) => {
    setSelectedZone(zone);
    setLoadingBriefing(true);
    setAiBriefing(null);
    
    const zoneMetrics = getCrimesInZone(zone, incidents);
    const catSummary = Object.entries(zoneMetrics.categories)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ") || "No recorded categories";

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      const prompt = `Give brief tactical summary analysis and patrol dispatch recommendations for computed crime hotspot ${zone.id} (Threat level: ${zone.risk_level}) which contains ${zoneMetrics.count} active incidents of type: ${catSummary}. Be extremely concise, output exactly 3 bullet points, using a commanding officer tone.`;
      
      const res = await fetch("http://localhost:8000/api/v1/ai/insights/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiBriefing(data.response);
      } else {
        setAiBriefing("Tactical intelligence node offline. Recommendation: Dispatch standard patrol squads immediately.");
      }
    } catch (err) {
      console.error(err);
      setAiBriefing("Failed to fetch live AI recommendations. Advise standard mobile sweep.");
    } finally {
      setLoadingBriefing(false);
    }
  };

  const selectedZoneMetrics = useMemo(() => {
    if (!selectedZone) return null;
    return getCrimesInZone(selectedZone, incidents);
  }, [selectedZone, incidents]);

  return (
    <div className="relative w-full h-[650px] flex flex-col md:flex-row gap-6 font-mono text-slate-300">
      
      {/* Sidebar Controls Panel */}
      <div className="w-full md:w-80 glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4 relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        
        {/* Title */}
        <div className="relative z-10 border-b border-slate-800 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Tactical Controls</h2>
          </div>
          <span className="text-[8px] font-bold border border-blue-500/20 bg-blue-950/10 text-blue-400 px-2 py-0.5 rounded-full">
            {incidents.length} INCS
          </span>
        </div>

        {/* Filters Form */}
        <div className="relative z-10 flex flex-col gap-3.5 text-[10px] text-slate-400 overflow-y-auto max-h-[500px] pr-1.5">
          
          {/* Search bar */}
          <div className="flex flex-col gap-1">
            <label className="uppercase tracking-wide text-slate-500">Narrative Search</label>
            <input
              type="text"
              placeholder="Query keyword search..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Crime Category */}
          <div className="flex flex-col gap-1">
            <label className="uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Activity className="h-3 w-3 text-indigo-500" /> Crime Type
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Operations Shift */}
          <div className="flex flex-col gap-1">
            <label className="uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-amber-500" /> Operations Shift
            </label>
            <select
              value={filters.timeShift}
              onChange={(e) => setFilters(f => ({ ...f, timeShift: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {shifts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* District filter */}
          <div className="flex flex-col gap-1">
            <label className="uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Eye className="h-3 w-3 text-cyan-500" /> Sector District
            </label>
            <select
              value={filters.district}
              onChange={(e) => setFilters(f => ({ ...f, district: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Risk Level */}
          <div className="flex flex-col gap-1">
            <label className="uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-red-500" /> Predictions Threat Level
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {risks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Hotspot Detection Section */}
          <div className="border-t border-slate-850 pt-3 flex flex-col gap-2.5">
            <span className="uppercase text-slate-200 font-bold flex items-center gap-1 text-[10px]">
              <Cpu className="h-3.5 w-3.5 text-blue-500" /> Hotspot Parameters
            </span>
            
            <div className="flex flex-col gap-1">
              <label className="uppercase text-slate-500 text-[8px] font-bold">Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="dbscan">DBSCAN (Density-Based)</option>
                <option value="kmeans">K-Means (Centroid-Based)</option>
                <option value="hdbscan">HDBSCAN (Hierarchical)</option>
              </select>
            </div>

            {algorithm === "dbscan" && (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between uppercase text-[8px] font-bold text-slate-500">
                    <span>Epsilon radius</span>
                    <span className="text-blue-400 font-bold">{eps}</span>
                  </div>
                  <input
                    type="range"
                    min="0.005"
                    max="0.04"
                    step="0.001"
                    value={eps}
                    onChange={(e) => setEps(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded-lg cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between uppercase text-[8px] font-bold text-slate-500">
                    <span>Min density samples</span>
                    <span className="text-indigo-400 font-bold">{minSamples}</span>
                  </div>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={minSamples}
                    onChange={(e) => setMinSamples(parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </>
            )}

            {algorithm === "kmeans" && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between uppercase text-[8px] font-bold text-slate-500">
                  <span>Number of Clusters (K)</span>
                  <span className="text-emerald-400 font-bold">{nClusters}</span>
                </div>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={nClusters}
                  onChange={(e) => setNClusters(parseInt(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-slate-200 focus:outline-none"
                />
              </div>
            )}

            {algorithm === "hdbscan" && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between uppercase text-[8px] font-bold text-slate-500">
                  <span>Min cluster size</span>
                  <span className="text-indigo-400 font-bold">{minClusterSize}</span>
                </div>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={minClusterSize}
                  onChange={(e) => setMinClusterSize(parseInt(e.target.value) || 2)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-slate-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Layer toggles */}
          <div className="border-t border-slate-850 pt-3 flex flex-col gap-2.5 font-bold">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showPredictiveZones}
                onChange={(e) => setShowPredictiveZones(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
              <span>Predictive Hotspot Beats</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
              <span>Precinct Station HQs</span>
            </label>
          </div>

        </div>

      </div>

      {/* Map Renderer Block */}
      <div className="flex-1 h-full min-h-[400px] relative">
        <MapRenderer
          incidents={incidents}
          showPredictiveZones={showPredictiveZones}
          patrolZones={patrolZones}
          showStations={showStations}
          stations={stations}
          onZoneClick={handleZoneClick}
          onDistrictSelect={(dist) => setFilters(f => ({ ...f, district: dist }))}
          selectedDistrict={filters.district}
        />

        {/* Selected Hotspot Intelligence Panel overlay */}
        {selectedZone && (
          <div className="absolute top-4 right-4 z-[1000] w-72 glass-card rounded-xl p-4 border border-slate-800 shadow-2xl flex flex-col gap-3 font-mono text-[9px] text-slate-300 animate-slide-in bg-slate-950/95 backdrop-blur-md">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1 text-white font-black">
                <Cpu className="h-3.5 w-3.5 text-blue-500" />
                <span>HOTSPOT {selectedZone.id}</span>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-slate-500 hover:text-white font-bold cursor-pointer"
              >
                DISMISS
              </button>
            </div>

            {/* Metrics */}
            <div className="flex flex-col gap-1 border-b border-slate-900 pb-2 text-slate-400">
              <p>&gt; Algorithm: <span className="text-indigo-400 font-bold uppercase">{selectedZone.algorithm || "DBSCAN"}</span></p>
              <p>&gt; Coordinates Centroid: <span className="text-slate-200">{getCentroid(selectedZone.coordinates)[0].toFixed(4)}, {getCentroid(selectedZone.coordinates)[1].toFixed(4)}</span></p>
              <p>&gt; Cluster Density (Crime Count): <span className="text-blue-400 font-bold">{selectedZone.crime_count ?? selectedZoneMetrics?.count} logs</span></p>
              <p>&gt; Patrol Units Suggested: <span className="text-emerald-400 font-bold">{selectedZone.patrol_suggested || 2} units</span></p>
              <p>&gt; Mapped threat factor: <span className={`font-bold ${selectedZone.risk_level === "Critical" ? "text-red-400" : "text-amber-400"}`}>{selectedZone.risk_level.toUpperCase()}</span></p>
            </div>

            {/* Categorized counts */}
            <div className="flex flex-col gap-1">
              <span className="uppercase text-slate-500 font-bold">Class Distribution:</span>
              <div className="grid grid-cols-2 gap-1.5 text-slate-300 max-h-16 overflow-y-auto">
                {selectedZoneMetrics && Object.entries(selectedZoneMetrics.categories).map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-slate-900/60 border border-slate-850 px-2 py-0.5 rounded">
                    <span>{k}</span>
                    <span className="font-bold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights & Recommendations */}
            <div className="flex flex-col gap-1 border-t border-slate-900 pt-2 text-[8px] text-slate-400">
              <span className="uppercase text-blue-400 font-bold flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" /> AI Predictive Intelligence:</span>
              {loadingBriefing ? (
                <p className="text-slate-650 animate-pulse py-1">Querying cognitive summaries node...</p>
              ) : aiBriefing ? (
                <div className="text-slate-300 leading-relaxed font-sans mt-0.5 select-text">
                  {aiBriefing.split("\n").map((line, idx) => (
                    <p key={idx} className="mb-0.5">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">Ready to query intelligence node.</p>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
