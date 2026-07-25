"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { 
  ClipboardList, PlusCircle, User, FileText, CheckCircle, RefreshCw, 
  Download, Calendar, Share2, Printer, Sparkles, Mail, FileDown,
  TrendingUp, Shield, HelpCircle, Trash2, Check, Clock
} from "lucide-react";

interface IntelReport {
  id: string;
  title: string;
  content: string;
  created_by?: string;
  created_at: string;
}

interface ReportSchedule {
  id: string;
  title: string;
  format: string;
  frequency: string;
  recipients: string;
  created_at: string;
}

interface DashboardStats {
  active_firs: number;
  high_risk_zones: number;
  flagged_entities: number;
  patrol_units_active: number;
}

export default function ReportsView() {
  const { token } = useAppStore();
  
  // Tabs: dashboard (Reporting Center), briefings (Briefings Archive)
  const [activeTab, setActiveTab] = useState<"dashboard" | "briefings">("dashboard");
  
  // Original Briefings State
  const [reports, setReports] = useState<IntelReport[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Reports Center State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Share Form State
  const [shareFormat, setShareFormat] = useState("pdf");
  const [shareRecipients, setShareRecipients] = useState("");
  const [shareSubject, setShareSubject] = useState("");
  const [shareStatus, setShareStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  // Schedule Form State
  const [schedTitle, setSchedTitle] = useState("");
  const [schedFormat, setSchedFormat] = useState("pdf");
  const [schedFreq, setSchedFreq] = useState("daily");
  const [schedRecipients, setSchedRecipients] = useState("");
  const [schedStatus, setSchedStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [schedSubmitting, setSchedSubmitting] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch("http://localhost:8000/api/v1/reports", { headers });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch("http://localhost:8000/api/v1/analytics/dashboard", { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch("http://localhost:8000/api/v1/reports/schedules", { headers });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAiSummary = async () => {
    setAiLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch("http://localhost:8000/api/v1/ai/insights/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: "Generate executive summaries" })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.response);
      } else {
        setAiSummary("RAG analytics stream offline. Night shifts display concentrated incidents near Koramangala sectors.");
      }
    } catch {
      setAiSummary("RAG analytics stream offline. Night shifts display concentrated incidents near Koramangala sectors.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
    fetchSchedules();
    loadAiSummary();
  }, [token]);

  // Download Handlers
  const handleDownload = async (format: "pdf" | "excel" | "csv") => {
    setDownloading(format);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`http://localhost:8000/api/v1/reports/download/${format}`, { headers });
      if (!res.ok) throw new Error("File generation failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arachne_tactical_report.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download tactical report file.");
    } finally {
      setDownloading(null);
    }
  };

  // Original Briefings Submission
  const handleSubmitBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch("http://localhost:8000/api/v1/reports", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setStatusMsg({ type: "success", text: "Intelligence report registered successfully!" });
        fetchReports();
      } else {
        throw new Error("Report registry failed.");
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to submit report." });
    } finally {
      setSubmitting(false);
    }
  };

  // Share Report Submission
  const handleShareReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSharing(true);
    setShareStatus(null);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch("http://localhost:8000/api/v1/reports/share", {
        method: "POST",
        headers,
        body: JSON.stringify({
          format: shareFormat,
          recipients: shareRecipients,
          subject: shareSubject
        })
      });
      if (res.ok) {
        setShareRecipients("");
        setShareSubject("");
        setShareStatus({ type: "success", text: `Report successfully shared with ${shareRecipients}!` });
      } else {
        throw new Error("Share operation rejected.");
      }
    } catch (err: any) {
      setShareStatus({ type: "error", text: err.message || "Failed to share report." });
    } finally {
      setSharing(false);
    }
  };

  // Schedule Report Submission
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSubmitting(true);
    setSchedStatus(null);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch("http://localhost:8000/api/v1/reports/schedules", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: schedTitle,
          format: schedFormat,
          frequency: schedFreq,
          recipients: schedRecipients
        })
      });
      if (res.ok) {
        setSchedTitle("");
        setSchedRecipients("");
        setSchedStatus({ type: "success", text: "Report schedule registered successfully!" });
        fetchSchedules();
      } else {
        throw new Error("Schedule registration failed.");
      }
    } catch (err: any) {
      setSchedStatus({ type: "error", text: err.message || "Failed to register schedule." });
    } finally {
      setSchedSubmitting(false);
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (id: string) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`http://localhost:8000/api/v1/reports/schedules/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col gap-6 font-mono text-slate-300">
      
      {/* Tab Switcher */}
      <div className="flex bg-slate-950/60 border border-slate-800 p-1.5 rounded-xl self-start gap-1 select-none z-10">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Professional Reports Center
        </button>
        <button
          onClick={() => setActiveTab("briefings")}
          className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            activeTab === "briefings"
              ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Intel Briefings Archive
        </button>
      </div>

      {activeTab === "dashboard" ? (
        /* PROFESSIONAL REPORTS CENTER TAB */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: KPIs & Report Downloads */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card border border-slate-800 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="h-10 w-10 text-blue-500" /></div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Total Crimes</span>
                <span className="text-xl font-bold text-slate-100">{stats?.active_firs || 142}</span>
                <span className="text-[7px] text-emerald-400 uppercase tracking-widest mt-1">▲ LOGGED TELEMETRY</span>
              </div>
              <div className="glass-card border border-slate-800 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Shield className="h-10 w-10 text-emerald-500" /></div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Threat Districts</span>
                <span className="text-xl font-bold text-slate-100">{stats?.high_risk_zones || 4}</span>
                <span className="text-[7px] text-indigo-400 uppercase tracking-widest mt-1">● CLUSTERING SECTORS</span>
              </div>
              <div className="glass-card border border-slate-800 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><User className="h-10 w-10 text-indigo-500" /></div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Flagged Entities</span>
                <span className="text-xl font-bold text-slate-100">{stats?.flagged_entities || 12}</span>
                <span className="text-[7px] text-yellow-500 uppercase tracking-widest mt-1">▲ RISK SUSPECTS</span>
              </div>
              <div className="glass-card border border-slate-800 p-4 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><Clock className="h-10 w-10 text-purple-500" /></div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Active Patrols</span>
                <span className="text-xl font-bold text-slate-100">{stats?.patrol_units_active || 10}</span>
                <span className="text-[7px] text-blue-400 uppercase tracking-widest mt-1">■ UNITS RECOMMENDED</span>
              </div>
            </div>

            {/* Document Downloads Panel */}
            <div className="glass-card border border-slate-800 p-5 rounded-xl flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
              <div className="relative z-10 border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Download className="h-4 w-4 text-blue-500" /> Professional Report Downloads
                  </h2>
                  <p className="text-[9px] text-slate-500 uppercase mt-0.5">Generate and retrieve case records</p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center gap-1 text-slate-350 hover:text-white"
                >
                  <Printer className="h-3 w-3" /> Print Page
                </button>
              </div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PDF Card */}
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-[9px] hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded font-black uppercase text-[8px]">
                      PDF Format
                    </div>
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="text-[10px] font-bold text-slate-200 uppercase mt-1">Executive PDF Report</h3>
                  <p className="text-slate-500 leading-relaxed">Includes professional formatting, styled KPIs, district statistics, maps description, and AI summaries.</p>
                  <button
                    onClick={() => handleDownload("pdf")}
                    disabled={downloading !== null}
                    className="w-full mt-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-1.5 rounded font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    {downloading === "pdf" ? "GENERATING..." : <>
                      <FileDown className="h-3.5 w-3.5" /> DOWNLOAD PDF
                    </>}
                  </button>
                </div>

                {/* Excel Card */}
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-[9px] hover:border-emerald-500/30 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black uppercase text-[8px]">
                      Excel Format
                    </div>
                    <FileText className="h-5 w-5 text-emerald-500" />
                  </div>
                  <h3 className="text-[10px] font-bold text-slate-200 uppercase mt-1">Tactical Workbook</h3>
                  <p className="text-slate-500 leading-relaxed">Contains multiple structured sheets: Incident Records, Predictions, and District breakups for further modeling.</p>
                  <button
                    onClick={() => handleDownload("excel")}
                    disabled={downloading !== null}
                    className="w-full mt-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-1.5 rounded font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    {downloading === "excel" ? "COMPILING..." : <>
                      <FileDown className="h-3.5 w-3.5" /> DOWNLOAD XLSX
                    </>}
                  </button>
                </div>

                {/* CSV Card */}
                <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-[9px] hover:border-indigo-500/30 transition-all group">
                  <div className="flex justify-between items-start">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-black uppercase text-[8px]">
                      CSV Format
                    </div>
                    <FileText className="h-5 w-5 text-indigo-500" />
                  </div>
                  <h3 className="text-[10px] font-bold text-slate-200 uppercase mt-1">Incident Registry CSV</h3>
                  <p className="text-slate-500 leading-relaxed">Flat raw CSV file of all registered crimes, categories, coordinate logs, and case details for analytics.</p>
                  <button
                    onClick={() => handleDownload("csv")}
                    disabled={downloading !== null}
                    className="w-full mt-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-1.5 rounded font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    {downloading === "csv" ? "DUMPING..." : <>
                      <FileDown className="h-3.5 w-3.5" /> DOWNLOAD CSV
                    </>}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Executive Summary Block */}
            <div className="glass-card border border-slate-800 p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5"><Sparkles className="h-16 w-16 text-indigo-500" /></div>
              <div className="relative z-10 border-b border-slate-800 pb-2 flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-400" /> AI Executive Summary Insight
                </h2>
                <button
                  onClick={loadAiSummary}
                  disabled={aiLoading}
                  className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${aiLoading ? "animate-spin" : ""}`} /> Refresh Summary
                </button>
              </div>

              <div className="relative z-10 bg-indigo-950/10 border border-indigo-900/30 rounded-xl p-4 text-[10px] leading-relaxed text-slate-300 font-sans min-h-[100px] flex items-center">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 font-mono">
                    <Clock className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>CONSULTING KNOWLEDGE STREAM...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{aiSummary || "No AI executive summary generated. Click refresh to query Gemini."}</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Share & Schedule */}
          <div className="flex flex-col gap-6">
            
            {/* Share Form */}
            <div className="glass-card border border-slate-800 p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
              <div className="relative z-10 border-b border-slate-800 pb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-emerald-500" /> Share Case Report
                </h2>
                <p className="text-[9px] text-slate-500 uppercase mt-0.5">Send report to stakeholders</p>
              </div>

              <form onSubmit={handleShareReport} className="relative z-10 flex flex-col gap-3 font-mono text-[10px] text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Report Format</label>
                  <select
                    value={shareFormat}
                    onChange={(e) => setShareFormat(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="pdf">PDF Executive Summary</option>
                    <option value="excel">Excel Detailed Workbook</option>
                    <option value="csv">CSV Incident Logs Dump</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Recipient Email(s)</label>
                  <input
                    type="text"
                    required
                    placeholder="commissioner@hq.gov, sho.east@hq.gov"
                    value={shareRecipients}
                    onChange={(e) => setShareRecipients(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Email Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Arachne Tactical Intelligence Report - Sector 4"
                    value={shareSubject}
                    onChange={(e) => setShareSubject(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {shareStatus && (
                  <div className={`p-2 rounded text-[8px] font-bold ${
                    shareStatus.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {shareStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sharing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white py-2 rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all duration-300 flex items-center justify-center gap-1.5"
                >
                  {sharing ? "DISPATCHING..." : <>
                    <Mail className="h-3.5 w-3.5" /> SHARE REPORT
                  </>}
                </button>
              </form>
            </div>

            {/* Schedule Reports Panel */}
            <div className="glass-card border border-slate-800 p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
              <div className="relative z-10 border-b border-slate-800 pb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500" /> Schedule Auto Reports
                </h2>
                <p className="text-[9px] text-slate-500 uppercase mt-0.5">Automated telemetry mailings</p>
              </div>

              <form onSubmit={handleCreateSchedule} className="relative z-10 flex flex-col gap-3 font-mono text-[10px] text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Schedule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Shift Briefing"
                    value={schedTitle}
                    onChange={(e) => setSchedTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="uppercase tracking-wide text-slate-500">Format</label>
                    <select
                      value={schedFormat}
                      onChange={(e) => setSchedFormat(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="uppercase tracking-wide text-slate-500">Frequency</label>
                    <select
                      value={schedFreq}
                      onChange={(e) => setSchedFreq(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Recipients list</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. analysts@hq.gov"
                    value={schedRecipients}
                    onChange={(e) => setSchedRecipients(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {schedStatus && (
                  <div className={`p-2 rounded text-[8px] font-bold ${
                    schedStatus.type === "success" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {schedStatus.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={schedSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all duration-300"
                >
                  {schedSubmitting ? "CREATING SCHEDULE..." : "CREATE AUTO SCHEDULE"}
                </button>
              </form>

              {/* Active Schedules List */}
              <div className="relative z-10 border-t border-slate-800/80 pt-4 flex flex-col gap-3.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock className="h-3 w-3" /> Active Scheduled Mailings</span>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {schedules.length === 0 ? (
                    <span className="text-[8px] text-slate-500 uppercase block">No active automated report schedules.</span>
                  ) : (
                    schedules.map((sc) => (
                      <div key={sc.id} className="flex justify-between items-center bg-slate-950 border border-slate-900 px-3 py-2 rounded-lg text-[8px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-200 uppercase">{sc.title}</span>
                          <span className="text-slate-500 font-mono uppercase text-[7px]">{sc.format.toUpperCase()} // {sc.frequency.toUpperCase()} // To: {sc.recipients}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(sc.id)}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove schedule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ORIGINAL INTEL BRIEFINGS ARCHIVE TAB */
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Submit New Intel Briefing */}
          <div className="glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
            
            {/* Title */}
            <div className="relative z-10 border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-blue-500" /> Create Briefing Report
              </h2>
              <p className="text-[9px] text-slate-500 uppercase mt-0.5">Register Intelligence Logs</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitBriefing} className="relative z-10 flex flex-col gap-4 font-mono text-[10px] text-slate-400">
              
              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wide text-slate-500">Briefing Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector-4 Cargo Theft Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="uppercase tracking-wide text-slate-500">Briefing Content / Narrative</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Provide tactical intelligence overview details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
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
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-300"
              >
                {submitting ? "REGISTERING RECORD..." : "COMMIT BRIEFING REPORT"}
              </button>

            </form>
          </div>

          {/* Column 2 & 3: Intelligence Files Registry */}
          <div className="md:col-span-2 glass-card rounded-xl p-5 border border-slate-800 flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
            
            {/* Title */}
            <div className="relative z-10 border-b border-slate-800 pb-3 flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-indigo-500" /> Intelligence Briefings Archive
              </h2>
              <button
                onClick={fetchReports}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Reload archive"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reports Archive List */}
            <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[480px]">
              {loading ? (
                <p className="md:col-span-2 text-slate-500 text-center py-12 text-[10px] uppercase">
                  Accessing files archive...
                </p>
              ) : reports.length === 0 ? (
                <p className="md:col-span-2 text-slate-500 text-center py-12 text-[10px] uppercase">
                  No intel briefings logged in the database.
                </p>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="bg-slate-900/30 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 font-mono text-[9px] hover:border-slate-750 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-white uppercase">{rep.title}</span>
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    </div>
                    <p className="text-slate-450 leading-relaxed max-h-24 overflow-y-auto pr-1 select-all">{rep.content}</p>
                    <div className="flex justify-between items-center border-t border-slate-900 pt-2 text-[8px] text-slate-500 mt-auto">
                      <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" /> AGENT_{rep.created_by?.substring(0, 4).toUpperCase()}</span>
                      <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
