"use client";
import { API_BASE_URL } from "@/services/api/config";


import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Incident, fetchIncidents } from "@/services/api/geoApi";
import { GraphNode, GraphEdge, fetchNexusGraph } from "@/services/api/nexusApi";
import { askAIChat } from "@/services/api/aiApi";
import { Database, FileSpreadsheet, Plus, Send, Brain, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";

export default function DatabaseView() {
  const { token, role } = useAppStore();
  const [activeSubTab, setActiveSubTab] = useState<"incidents" | "nodes" | "edges" | "ai_chat">("incidents");

  // Data states
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms states
  const [incidentForm, setIncidentForm] = useState({ lat: 12.9716, lng: 77.5946, category: "Theft", time_shift: "Day", description: "" });
  const [nodeForm, setNodeForm] = useState({ id: "", label: "", group: 1, risk_score: 50.0 });
  const [edgeForm, setEdgeForm] = useState({ source: "", target: "", relationship: "Called" });
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CSV states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  // RAG Chat states
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string; sources?: string[] }[]>([
    { role: "assistant", text: "Tactical AI assistant initialized. You can ask queries about incidents, suspect nodes, or risk hot-zones." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Reload data
  const loadData = async () => {
    try {
      setLoading(true);
      const incData = await fetchIncidents();
      setIncidents(incData);

      const graphData = await fetchNexusGraph();
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
    } catch (err) {
      console.error("Failed to load database collections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form handlers
  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/geo/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(incidentForm),
      });
      if (!res.ok) throw new Error("Failed to register incident");
      setFormMsg({ type: "success", text: "Incident logged successfully in the database!" });
      setIncidentForm({ lat: 12.9716, lng: 77.5946, category: "Theft", time_shift: "Day", description: "" });
      loadData();
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "Failed to add incident." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/nexus/nodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(nodeForm),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to register node");
      }
      setFormMsg({ type: "success", text: `Node '${nodeForm.id}' successfully mapped in graph database!` });
      setNodeForm({ id: "", label: "", group: 1, risk_score: 50.0 });
      loadData();
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "Failed to add node." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/nexus/edges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(edgeForm),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to link nodes");
      }
      setFormMsg({ type: "success", text: `Relationship established successfully!` });
      setEdgeForm({ source: "", target: "", relationship: "Called" });
      loadData();
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message || "Failed to add relationship." });
    } finally {
      setFormLoading(false);
    }
  };

  // CSV Parsing & Upload handler
  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setCsvStatus("Parsing CSV file...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      
      // Assume CSV Header: lat,lng,category,time_shift,description
      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length < 4) continue;
        
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        const category = parts[2].trim();
        const time_shift = parts[3].trim();
        const description = parts[4] ? parts[4].replace(/"/g, "").trim() : "";

        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/geo/incidents`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ lat, lng, category, time_shift, description }),
          });
          if (res.ok) successCount++;
          else errorCount++;
        } catch {
          errorCount++;
        }
      }
      setCsvStatus(`Upload complete! Processed ${successCount} incidents successfully. Errors: ${errorCount}.`);
      setCsvFile(null);
      loadData();
    };
    reader.readAsText(csvFile);
  };

  // Chat queries handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userText = chatQuery;
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setChatQuery("");
    setChatLoading(true);

    try {
      const res = await askAIChat(userText, token);
      setChatMessages(prev => [...prev, { role: "assistant", text: res.response, sources: res.sources }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Offline AI Assistant: Connection to the Gemini cognitive stream failed. Check API key." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="w-full glass-card rounded-xl p-6 border border-slate-800 flex flex-col gap-6 relative overflow-hidden min-h-[650px]">
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-500" />
            Clearance Level 4 Database Control
          </h2>
          <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
            Module ID: DB-GRID-9 // Write / Query Authorized node database
          </p>
        </div>

        {/* Database Toggles */}
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg self-start sm:self-auto font-mono text-[10px]">
          <button
            onClick={() => { setActiveSubTab("incidents"); setFormMsg(null); }}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeSubTab === "incidents" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Incidents ({incidents.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("nodes"); setFormMsg(null); }}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeSubTab === "nodes" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Nodes ({nodes.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("edges"); setFormMsg(null); }}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeSubTab === "edges" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Edges ({edges.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("ai_chat"); setFormMsg(null); }}
            className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
              activeSubTab === "ai_chat" ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Brain className="h-3 w-3" />
            AI RAG ASSISTANT
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Dynamic list/grid */}
        {activeSubTab !== "ai_chat" ? (
          <div className="flex-1 border border-slate-800 bg-slate-950/20 rounded-lg p-4 flex flex-col min-h-[350px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-900 pb-2">
              Registered Collections
            </h3>
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase">Synchronizing databases...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-auto max-h-[400px] custom-scrollbar text-xs font-mono">
                {activeSubTab === "incidents" && (
                  <table className="w-full text-left text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="pb-2">ID</th>
                        <th className="pb-2">COORDS</th>
                        <th className="pb-2">CATEGORY</th>
                        <th className="pb-2">SHIFT</th>
                        <th className="pb-2">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {incidents.slice().reverse().map((inc, i) => (
                        <tr key={i} className="hover:bg-slate-900/20">
                          <td className="py-2.5 font-bold text-blue-400">{inc.id.substring(0, 8)}</td>
                          <td className="py-2.5 text-slate-500">{inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}</td>
                          <td className="py-2.5 font-semibold text-slate-200">{inc.category}</td>
                          <td className="py-2.5">
                            <span className={`px-1 rounded text-[10px] font-bold ${inc.time_shift === "Day" ? "bg-amber-500/10 text-amber-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                              {inc.time_shift}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 truncate max-w-[200px]" title={inc.description}>{inc.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSubTab === "nodes" && (
                  <table className="w-full text-left text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="pb-2">NODE ID</th>
                        <th className="pb-2">LABEL</th>
                        <th className="pb-2">GROUP</th>
                        <th className="pb-2">RISK SCORE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {nodes.map((node, i) => (
                        <tr key={i} className="hover:bg-slate-900/20">
                          <td className="py-2.5 font-bold text-red-400">{node.id}</td>
                          <td className="py-2.5 text-slate-200 font-sans">{node.label}</td>
                          <td className="py-2.5">
                            {["Suspect", "Burner Phone", "Vehicle", "FIR"][node.group - 1]}
                          </td>
                          <td className="py-2.5 font-bold text-slate-100">{node.risk_score.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSubTab === "edges" && (
                  <table className="w-full text-left text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="pb-2">SOURCE ID</th>
                        <th className="pb-2">TARGET ID</th>
                        <th className="pb-2">RELATIONSHIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {edges.map((edge, i) => (
                        <tr key={i} className="hover:bg-slate-900/20">
                          <td className="py-2.5 font-bold text-blue-400">{edge.source}</td>
                          <td className="py-2.5 font-bold text-amber-400">{edge.target}</td>
                          <td className="py-2.5 text-slate-300 uppercase tracking-wide">{edge.relationship}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ) : (
          /* AI RAG Chat interface */
          <div className="flex-1 border border-indigo-900/40 bg-indigo-950/5 rounded-lg p-4 flex flex-col min-h-[400px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3 border-b border-indigo-900/40 pb-2 flex items-center gap-1.5">
              <Brain className="h-4 w-4" /> Cognitive Intelligence Stream
            </h3>

            {/* Chat Box */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[300px] mb-3 custom-scrollbar flex flex-col">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl p-3 text-[11px] leading-relaxed font-sans ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white self-end"
                      : "bg-slate-900 border border-slate-800 text-slate-300 self-start"
                  }`}
                >
                  <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                    {msg.role === "user" ? "OPERATOR" : "ARACHNE AI"}
                  </span>
                  <p>{msg.text}</p>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/80 font-mono text-[8px] text-slate-500">
                      SOURCES: {msg.sources.join(" // ")}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="max-w-[85%] rounded-xl p-3 bg-slate-900 border border-slate-800 text-slate-300 self-start flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">QUERYING KNOWLEDGE BASE...</span>
                </div>
              )}
            </div>

            {/* Chat Form */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                placeholder="Query database... (e.g. 'Summarize S1' or 'Show incident hotspots')"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                disabled={chatLoading}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Right Side: Command panels / CSV upload / Form entry */}
        <div className="w-full md:w-[320px] flex flex-col gap-6">
          
          {/* Form write entry (Requires SHO role write permission) */}
          <div className="border border-slate-800 bg-slate-950/30 rounded-lg p-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 flex items-center justify-between">
              <span>DB Entry Form</span>
              <span className="text-[8px] font-mono bg-blue-950/80 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                ROLE: {role}
              </span>
            </h3>

            {formMsg && (
              <div className={`p-2.5 rounded text-[10px] font-semibold flex items-start gap-1.5 ${
                formMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {formMsg.type === "success" ? <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                <span>{formMsg.text}</span>
              </div>
            )}

            {/* Incidents Entry Form */}
            {activeSubTab === "incidents" && (
              <form onSubmit={handleAddIncident} className="flex flex-col gap-3 font-mono text-[10px] text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Incident Category</label>
                  <select
                    value={incidentForm.category}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Armed Robbery">Armed Robbery</option>
                    <option value="Cyber Fraud">Cyber Fraud</option>
                    <option value="Assault">Assault</option>
                    <option value="Theft">Theft</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="uppercase tracking-wide text-slate-500">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={incidentForm.lat}
                      onChange={(e) => setIncidentForm(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="uppercase tracking-wide text-slate-500">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={incidentForm.lng}
                      onChange={(e) => setIncidentForm(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Shift</label>
                  <div className="flex bg-slate-950 border border-slate-850 p-0.5 rounded">
                    {["Day", "Night"].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setIncidentForm(prev => ({ ...prev, time_shift: s }))}
                        className={`flex-1 py-1 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                          incidentForm.time_shift === s ? "bg-blue-600 text-white" : "text-slate-500"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Details Description</label>
                  <textarea
                    placeholder="Log details..."
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 h-16 font-sans resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> LOG NEW INCIDENT
                </button>
              </form>
            )}

            {/* Nodes Entry Form */}
            {activeSubTab === "nodes" && (
              <form onSubmit={handleAddNode} className="flex flex-col gap-3 font-mono text-[10px] text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Node Unique ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S6, P6, V4"
                    value={nodeForm.id}
                    onChange={(e) => setNodeForm(prev => ({ ...prev, id: e.target.value.toUpperCase() }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Label / Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inspector John Doe"
                    value={nodeForm.label}
                    onChange={(e) => setNodeForm(prev => ({ ...prev, label: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Group Classification</label>
                  <select
                    value={nodeForm.group}
                    onChange={(e) => setNodeForm(prev => ({ ...prev, group: parseInt(e.target.value) || 1 }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">Suspect (Group 1)</option>
                    <option value="2">Burner Phone (Group 2)</option>
                    <option value="3">Vehicle Asset (Group 3)</option>
                    <option value="4">FIR Case File (Group 4)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Risk Score Rating ({nodeForm.risk_score}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={nodeForm.risk_score}
                    onChange={(e) => setNodeForm(prev => ({ ...prev, risk_score: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> MAP GRAPH NODE
                </button>
              </form>
            )}

            {/* Edges Entry Form */}
            {activeSubTab === "edges" && (
              <form onSubmit={handleAddEdge} className="flex flex-col gap-3 font-mono text-[10px] text-slate-400">
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Source Node ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S1"
                    value={edgeForm.source}
                    onChange={(e) => setEdgeForm(prev => ({ ...prev, source: e.target.value.toUpperCase() }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Target Node ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P1"
                    value={edgeForm.target}
                    onChange={(e) => setEdgeForm(prev => ({ ...prev, target: e.target.value.toUpperCase() }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wide text-slate-500">Relationship Link</label>
                  <select
                    value={edgeForm.relationship}
                    onChange={(e) => setEdgeForm(prev => ({ ...prev, relationship: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Called">Called (Group 1-2)</option>
                    <option value="Drives">Drives (Group 1-3)</option>
                    <option value="Mentioned In">Mentioned In (Group 1-4)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-colors mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> ESTABLISH CONNECTION
                </button>
              </form>
            )}

            {/* Instructions / Placeholder when AI Chat tab is open */}
            {activeSubTab === "ai_chat" && (
              <div className="text-[10px] text-slate-500 font-mono space-y-2 leading-relaxed">
                <p>&gt; RAG cognitive AI analyzer enabled.</p>
                <p>&gt; Scans incident records and nexus node linkages locally.</p>
                <p>&gt; Translates natural language questions to contextual sub-queries using Gemini.</p>
                <div className="border border-indigo-900/30 bg-indigo-950/20 rounded p-2.5 text-indigo-400 mt-2">
                  <span className="font-bold block uppercase mb-1">SAMPLE QUESTIONS (CLICK TO QUERY):</span>
                  <div className="flex flex-col gap-1.5 mt-1 select-none">
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Summarize crime trends")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Summarize crime trends"
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Explain district-wise increase")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Explain district-wise increase"
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Suggest patrol allocation")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Suggest patrol allocation"
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Generate executive summaries")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Generate executive summaries"
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Show cybercrime trend")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Show cybercrime trend"
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Which district has highest theft?")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Which district has highest theft?"
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setChatQuery("Predict next month's robbery")}
                      className="text-left hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      &gt; "Predict next month's robbery"
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk CSV Incidents Upload */}
          {activeSubTab === "incidents" && (
            <div className="border border-slate-800 bg-slate-950/30 rounded-lg p-4 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Bulk Incidents Upload
              </h3>
              
              {csvStatus && (
                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded text-[9px] font-mono text-slate-400">
                  &gt; {csvStatus}
                </div>
              )}

              <form onSubmit={handleCSVUpload} className="flex flex-col gap-3 font-mono text-[10px]">
                <div className="border border-dashed border-slate-800 hover:border-blue-500/50 transition-colors bg-slate-950 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-slate-500 cursor-pointer relative">
                  <FileSpreadsheet className="h-6 w-6 text-slate-600" />
                  <span className="text-[9px] uppercase tracking-wide">
                    {csvFile ? csvFile.name : "Select Incidents CSV"}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!csvFile}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-white py-2 rounded font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  UPLOAD & PARSE CSV
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
