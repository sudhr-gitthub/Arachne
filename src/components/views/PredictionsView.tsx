"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Cpu, ShieldAlert, Sliders, Play, RefreshCw, BarChart3, Settings, HelpCircle } from "lucide-react";

interface HotspotZone {
  id: string;
  coordinates: [number, number][];
  risk_level: string;
}

interface RunLog {
  id: number;
  predicted_at: string;
  location_lat: number;
  location_lng: number;
  predicted_category_id: number;
  risk_score: number;
}

export default function PredictionsView() {
  const { token, role } = useAppStore();
  
  // DBSCAN Hotspots Sweep Parameters
  const [eps, setEps] = useState(0.012);
  const [minSamples, setMinSamples] = useState(5);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [history, setHistory] = useState<RunLog[]>([]);
  const [runningHotspots, setRunningHotspots] = useState(false);

  // Model training metrics state
  const [trainingMetrics, setTrainingMetrics] = useState<any>(null);
  const [training, setTraining] = useState(false);

  // Form Inputs for Classifier
  const [district, setDistrict] = useState("Central");
  const [category, setCategory] = useState("Theft");
  const [timeShift, setTimeShift] = useState("Day");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [month, setMonth] = useState(1);
  
  // Prediction Outputs
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  const districts = ["Central", "North", "South", "East", "West"];
  const categories = ["Theft", "Assault", "Armed Robbery", "Cyber Fraud"];
  const shifts = ["Day", "Night"];
  const days = [
    { label: "Monday", val: 0 },
    { label: "Tuesday", val: 1 },
    { label: "Wednesday", val: 2 },
    { label: "Thursday", val: 3 },
    { label: "Friday", val: 4 },
    { label: "Saturday", val: 5 },
    { label: "Sunday", val: 6 },
  ];
  const months = [
    { label: "January", val: 1 },
    { label: "February", val: 2 },
    { label: "March", val: 3 },
    { label: "April", val: 4 },
    { label: "May", val: 5 },
    { label: "June", val: 6 },
    { label: "July", val: 7 },
    { label: "August", val: 8 },
    { label: "September", val: 9 },
    { label: "October", val: 10 },
    { label: "November", val: 11 },
    { label: "December", val: 12 },
  ];

  const fetchHistory = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch("http://localhost:8000/api/v1/predictions/history?limit=8", { headers });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runHotspotsSweep = async () => {
    setRunningHotspots(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`http://localhost:8000/api/v1/predictions/patrols?eps=${eps}&min_samples=${minSamples}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHotspots(data);
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningHotspots(false);
    }
  };

  const trainModel = async () => {
    setTraining(true);
    setTrainingMetrics(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch("http://localhost:8000/api/v1/predictions/train", {
        method: "POST",
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setTrainingMetrics(data.metrics);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Training failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setPredictResult(null);
    setPredictError(null);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      const res = await fetch("http://localhost:8000/api/v1/predictions/predict", {
        method: "POST",
        headers,
        body: JSON.stringify({
          district,
          category,
          time_shift: timeShift,
          day_of_week: dayOfWeek,
          month
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPredictResult(data);
      } else {
        const errData = await res.json();
        setPredictError(errData.detail || "Prediction execution failed.");
      }
    } catch (err) {
      console.error(err);
      setPredictError("Failed to connect to the predictive backend model.");
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    runHotspotsSweep();
    fetchHistory();
  }, [token]);

  return (
    <div className="w-full flex flex-col gap-6 font-mono text-slate-300">
      
      {/* Dynamic Model Tuning Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Hotspot Sweeps Config */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-blue-500" /> Hotspot Parameters
            </h3>
            <span className="text-[8px] text-slate-500 uppercase">DBSCAN Spatial Sweeps</span>
          </div>

          <div className="flex flex-col gap-4 text-[9px] text-slate-400">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between uppercase font-bold">
                <span>Epsilon radius</span>
                <span className="text-blue-400 font-black">{eps}</span>
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

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between uppercase font-bold">
                <span>Min density samples</span>
                <span className="text-indigo-400 font-black">{minSamples}</span>
              </div>
              <input
                type="number"
                min="2"
                max="20"
                value={minSamples}
                onChange={(e) => setMinSamples(parseInt(e.target.value) || 2)}
                className="bg-slate-950 border border-slate-800 rounded py-1 px-2.5 text-slate-200 focus:outline-none"
              />
            </div>

            <button
              onClick={runHotspotsSweep}
              disabled={runningHotspots}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors shadow-[0_0_10px_rgba(59,130,246,0.3)] mt-1.5 uppercase"
            >
              {runningHotspots ? "Sweeping coordinates..." : "Run Hotspot Sweep"}
            </button>
          </div>
        </div>

        {/* Column 2: Live ML Predictor Form */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-indigo-500" /> Classifier predictions
            </h3>
            <span className="text-[8px] text-slate-500 uppercase">Random Forest Predictive risk scorer</span>
          </div>

          <form onSubmit={handlePredict} className="flex flex-col gap-2.5 text-[9px] text-slate-400">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="uppercase">District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none cursor-pointer"
                >
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="uppercase">Crime Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="uppercase">Shift</label>
                <select
                  value={timeShift}
                  onChange={(e) => setTimeShift(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none cursor-pointer"
                >
                  {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="uppercase">Day</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none cursor-pointer"
                >
                  {days.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="uppercase">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 focus:outline-none cursor-pointer"
                >
                  {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={predicting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors shadow-[0_0_10px_rgba(99,102,241,0.3)] mt-1.5 uppercase"
            >
              {predicting ? "Running Classifier..." : "Execute risk predict"}
            </button>
          </form>
        </div>

        {/* Column 3: Retrain Model Panel */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-emerald-500" /> ML Model Settings
            </h3>
            <span className="text-[8px] text-slate-500 uppercase">Database Model management</span>
          </div>

          <div className="flex flex-col gap-3 text-[9px] text-slate-400">
            <p>Retrain the random forest classifier dynamically using all records currently committed to the SQL database.</p>
            
            {(role === "Commissioner" || role === "Analyst") ? (
              <button
                onClick={trainModel}
                disabled={training}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2 rounded-lg cursor-pointer transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)] uppercase"
              >
                {training ? "Training model weights..." : "Retrain Random Forest"}
              </button>
            ) : (
              <p className="text-[8px] text-amber-500 border border-amber-500/20 bg-amber-950/10 p-2 rounded">
                RESTRICTED: Level_Analyst clearance required to retrain ML model weights.
              </p>
            )}

            {trainingMetrics && (
              <div className="mt-1 border-t border-slate-850 pt-2 flex flex-col gap-1">
                <span className="font-bold text-white uppercase text-[8px]">Metrics calculated:</span>
                <p>Accuracy: {(trainingMetrics.accuracy * 100).toFixed(1)}%</p>
                <p>Precision: {(trainingMetrics.precision * 100).toFixed(1)}%</p>
                <p>Recall: {(trainingMetrics.recall * 100).toFixed(1)}%</p>
                <p>F1 Score: {(trainingMetrics.f1 * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Predictions Output Results Panel */}
      {predictResult && (
        <div className="glass-card rounded-xl p-5 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
          
          <div className="md:col-span-1 flex flex-col gap-1 border-r border-slate-850 pr-4">
            <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-0.5">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-500" /> Calculated Risk
            </span>
            <h4 className={`text-xl font-black uppercase ${
              predictResult.risk_level === "Critical" ? "text-red-400" :
              predictResult.risk_level === "High" ? "text-amber-400" :
              predictResult.risk_level === "Medium" ? "text-blue-400" : "text-slate-400"
            }`}>
              {predictResult.risk_level}
            </h4>
          </div>

          <div className="md:col-span-1 flex flex-col gap-1 border-r border-slate-850 pr-4">
            <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-0.5">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" /> Probability Score
            </span>
            <h4 className="text-xl font-black text-white">
              {predictResult.risk_score}%
            </h4>
          </div>

          <div className="md:col-span-1 flex flex-col gap-1 border-r border-slate-850 pr-4">
            <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-0.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-500" /> Suggested Patrol Strength
            </span>
            <h4 className="text-xl font-black text-emerald-400">
              {predictResult.patrol_strength} Units
            </h4>
          </div>

          <div className="md:col-span-1 flex flex-col gap-1 text-[9px] text-slate-400">
            <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-0.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-500" /> Explainability
            </span>
            <p className="leading-relaxed mt-0.5 text-slate-300 font-sans">{predictResult.explanation}</p>
          </div>

        </div>
      )}

      {predictError && (
        <div className="p-3 border border-red-500/20 bg-red-950/10 text-red-400 text-[10px] rounded-lg">
          {predictError}
        </div>
      )}

      {/* Computed Hotspots and Sweeps History lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Computed Hotspot list */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase text-slate-200 border-b border-slate-800 pb-2">
            Active threat zones
          </h4>
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
            {hotspots.length === 0 ? (
              <p className="text-slate-600 text-center py-6 text-[10px] uppercase">No active hotspots found.</p>
            ) : (
              hotspots.map((zone) => (
                <div key={zone.id} className="bg-slate-950 border border-slate-900 p-3 rounded-lg flex justify-between items-center text-[9px]">
                  <div>
                    <span className="text-white font-bold block">{zone.id}</span>
                    <span className="text-slate-500">{zone.coordinates.length} Mapped Coordinate points</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    zone.risk_level === "Critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {zone.risk_level}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History of runs logs */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase text-slate-200 border-b border-slate-800 pb-2">
            Spatial prediction sweeps history
          </h4>
          <div className="flex flex-col gap-3.5 max-h-64 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-slate-600 text-center py-6 text-[10px] uppercase">No runs registered.</p>
            ) : (
              history.map((log) => (
                <div key={log.id} className="border-l-2 border-slate-800 pl-3 flex flex-col gap-1 text-[9px]">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-bold text-indigo-400 uppercase">SWEEP RUN</span>
                    <span>{new Date(log.predicted_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-400">GPS location centroid: {log.location_lat.toFixed(4)}, {log.location_lng.toFixed(4)}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
