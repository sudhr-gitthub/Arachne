"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BarChart, PieChart, LineChart, TrendingUp, AlertTriangle, Users, Map, RefreshCw } from "lucide-react";

interface TrendsData {
  monthly_trends: Record<string, number>;
  yearly_trends: Record<string, number>;
  category_trends: Record<string, number>;
  district_comparison: Record<string, number>;
  time_analysis: Record<string, number>;
  victim_analysis: Record<string, number>;
  risk_scores: Record<string, number>;
}

export default function AnalyticsView() {
  const { token } = useAppStore();
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch("http://localhost:8000/api/v1/analytics/trends", { headers });
      if (res.ok) {
        const data = await res.json();
        setTrends(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics trends data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [token]);

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-950/20 border border-slate-800 rounded-xl gap-3 font-mono text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span className="text-xs uppercase tracking-widest">Compiling Analytics Data...</span>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="w-full text-center py-12 font-mono text-slate-500 uppercase">
        Failed to load analytical metrics.
      </div>
    );
  }

  // Calculate overall statistics
  const totalIncidents = Object.values(trends.category_trends).reduce((a, b) => a + b, 0);
  const totalVictims = Object.values(trends.victim_analysis).reduce((a, b) => a + b, 0);
  const activeDistricts = Object.keys(trends.district_comparison).length;
  const maxRiskDistrict = Object.entries(trends.risk_scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Category counts sorting for Bar Chart
  const categories = Object.keys(trends.category_trends);
  const categoryMax = Math.max(...Object.values(trends.category_trends), 1);

  // Monthly trends sorting
  const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortedMonths = monthsOrder.filter(m => trends.monthly_trends[m] !== undefined);
  const monthlyValues = sortedMonths.map(m => trends.monthly_trends[m]);
  const monthlyMax = Math.max(...monthlyValues, 1);

  // District comparison sorting
  const sortedDistricts = Object.entries(trends.district_comparison).sort((a, b) => b[1] - a[1]);
  const districtMax = Math.max(...Object.values(trends.district_comparison), 1);

  return (
    <div className="w-full flex flex-col gap-6 font-mono text-slate-300">
      
      {/* Header and Refresh */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Arachne Tactical Analytics Engine
          </h2>
          <p className="text-[9px] text-slate-500 uppercase mt-0.5">Persistent database aggregations & mathematical indexing</p>
        </div>
        <button
          onClick={fetchTrends}
          className="p-1.5 rounded border border-slate-800 hover:bg-slate-850 hover:text-white transition-colors cursor-pointer"
          title="Recalculate dynamic statistics"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total incidents count */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] uppercase tracking-widest">Database records count</span>
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{totalIncidents}</h3>
            <span className="text-[8px] text-slate-500 uppercase tracking-wide">Incidents aggregated</span>
          </div>
        </div>

        {/* Total victims count */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] uppercase tracking-widest">Est. victims impact</span>
            <Users className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{totalVictims}</h3>
            <span className="text-[8px] text-slate-500 uppercase tracking-wide">Dynamic metric calculation</span>
          </div>
        </div>

        {/* Active districts count */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] uppercase tracking-widest">Active Sectors</span>
            <Map className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{activeDistricts}</h3>
            <span className="text-[8px] text-slate-500 uppercase tracking-wide">Precinct sectors mapped</span>
          </div>
        </div>

        {/* Max Risk District */}
        <div className="glass-card rounded-xl p-4 border border-slate-800 relative overflow-hidden flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[8px] uppercase tracking-widest">Critical sector focus</span>
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-red-400 uppercase">{maxRiskDistrict}</h3>
            <span className="text-[8px] text-slate-500 uppercase tracking-wide">Highest density threat index</span>
          </div>
        </div>

      </div>

      {/* Charts Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Monthly Trends (SVG Line Chart) */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5 text-blue-500" /> Monthly Crime Trends
          </h4>
          
          {sortedMonths.length === 0 ? (
            <p className="text-slate-600 text-center py-12 text-[10px] uppercase">No monthly data logs found.</p>
          ) : (
            <div className="w-full h-44 flex flex-col gap-2 relative justify-end">
              {/* SVG Line Graph */}
              <div className="w-full h-36 border border-slate-900 bg-slate-950/40 rounded-lg p-2 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path
                    d={monthlyValues.map((val, idx) => {
                      const x = (idx / (monthlyValues.length - 1 || 1)) * 100;
                      const y = 28 - (val / monthlyMax) * 25;
                      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {monthlyValues.map((val, idx) => {
                    const x = (idx / (monthlyValues.length - 1 || 1)) * 100;
                    const y = 28 - (val / monthlyMax) * 25;
                    return (
                      <circle key={idx} cx={x} cy={y} r="1" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.2" />
                    );
                  })}
                </svg>
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 uppercase px-1">
                {sortedMonths.map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Crime Category Analysis (Vertical Bar Chart) */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <BarChart className="h-3.5 w-3.5 text-indigo-500" /> Category Counts Analysis
          </h4>
          
          <div className="flex-1 flex flex-col gap-3 font-mono text-[9px] text-slate-400 py-1">
            {categories.map((cat) => {
              const val = trends.category_trends[cat];
              const percent = Math.round((val / categoryMax) * 100);
              return (
                <div key={cat} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{cat.toUpperCase()}</span>
                    <span>{val} LOGS</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full border border-slate-900 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-blue-700 h-full rounded-full transition-all duration-1000 shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: District Comparison (Horizontal Bar Chart) */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Map className="h-3.5 w-3.5 text-emerald-500" /> District Comparisons
          </h4>

          <div className="flex-1 flex flex-col gap-3 font-mono text-[9px] text-slate-400 py-1">
            {sortedDistricts.map(([name, val]) => {
              const percent = Math.round((val / districtMax) * 100);
              return (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{name.toUpperCase()} SECTOR</span>
                    <span>{val} REPORTS</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full border border-slate-900 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-teal-700 h-full rounded-full transition-all duration-1000 shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Time Shift Analysis (Pie/Donut Ratio) */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <PieChart className="h-3.5 w-3.5 text-amber-500" /> Operational Shift Ratio
          </h4>

          <div className="flex-1 flex items-center justify-around py-4">
            {/* Day */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-16 rounded-full border-4 border-amber-500/20 flex items-center justify-center relative bg-amber-500/5">
                <span className="text-xs font-black text-amber-400">{trends.time_analysis["Day"] || 0}</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-500">Day operations</span>
            </div>

            {/* Night */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 flex items-center justify-center relative bg-indigo-500/5">
                <span className="text-xs font-black text-indigo-400">{trends.time_analysis["Night"] || 0}</span>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-500">Night operations</span>
            </div>
          </div>
        </div>

      </div>

      {/* Analysis Grid Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-850 pt-6">
        
        {/* Victim Impact Matrix */}
        <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900/10 font-bold text-xs uppercase tracking-wider text-slate-200">
            Victims Impact Matrix
          </div>
          <table className="w-full border-collapse text-left text-[9px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase">
                <th className="p-2.5">Crime Category</th>
                <th className="p-2.5 text-right">Estimated Victims Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(trends.victim_analysis).map(([cat, count]) => (
                <tr key={cat} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                  <td className="p-2.5 font-bold uppercase">{cat}</td>
                  <td className="p-2.5 text-right text-indigo-400 font-bold">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* District Risk Scoring Coefficient */}
        <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900/10 font-bold text-xs uppercase tracking-wider text-slate-200">
            District Threat Risk Coefficients
          </div>
          <table className="w-full border-collapse text-left text-[9px] font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 uppercase">
                <th className="p-2.5">District Sector</th>
                <th className="p-2.5 text-right">Risk Score Coefficient (%)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(trends.risk_scores).map(([name, score]) => (
                <tr key={name} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                  <td className="p-2.5 font-bold uppercase">{name} Sector</td>
                  <td className="p-2.5 text-right font-black text-red-400">{score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
