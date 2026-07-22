"use client";

import React, { useEffect, useState } from "react";
import { MockNexusRepository } from "@/infrastructure/repositories/MockNexusRepository";
import { GetNexusGraphUseCase } from "@/application/useCases/GetNexusGraphUseCase";
import { NexusGraphData, GraphNode } from "@/domain/entities/NexusGraph";
import NexusGraphRenderer from "./NexusGraphRenderer";
import { Activity, ShieldAlert, CheckCircle, Info } from "lucide-react";

export default function NexusContainer() {
  const [graphData, setGraphData] = useState<NexusGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const repository = new MockNexusRepository();
        const useCase = new GetNexusGraphUseCase(repository);
        const data = await useCase.execute();
        setGraphData(data);
      } catch (error) {
        console.error("Failed to load Nexus Graph data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center">
        <Activity className="w-10 h-10 text-accent-blue animate-pulse mb-3" />
        <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
          Fetching Syndicate Relations...
        </span>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-10 h-10 text-accent-red mb-3" />
        <span className="text-sm font-semibold text-slate-400">
          Data load failure
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full h-full">
      {/* Visual Graph Area (3/4 width) */}
      <div className="xl:col-span-3 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative group">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent-blue" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Interactive Relationship Network
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Click node to calculate Blast Radius. Click background to reset.</span>
          </div>
        </div>

        <div className="flex-1 min-h-[450px]">
          <NexusGraphRenderer
            data={graphData}
            onNodeClick={(node) => setSelectedNode(node)}
          />
        </div>
      </div>

      {/* Selected Entity Intelligence panel (1/4 width) */}
      <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Entity Intelligence
            </h2>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[10px] text-accent-blue hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-accent-blue tracking-wider">
                  Type: {selectedNode.type}
                </span>
                <h3 className="text-lg font-black text-slate-100 mt-1 leading-tight">
                  {selectedNode.label}
                </h3>
              </div>

              {/* Risk Level Gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Risk Assessment Score</span>
                  <span className={`font-bold ${selectedNode.riskScore > 75 ? "text-accent-red" : selectedNode.riskScore > 40 ? "text-yellow-400" : "text-slate-400"}`}>
                    {selectedNode.riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${selectedNode.riskScore > 75 ? "bg-accent-red" : selectedNode.riskScore > 40 ? "bg-yellow-500" : "bg-accent-blue"}`}
                    style={{ width: `${selectedNode.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Associated Connections summary */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Tactical Connections
                </span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {graphData.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge, idx) => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const otherNode = graphData.nodes.find((n) => n.id === otherId);
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-800/80 rounded-md text-xs hover:border-slate-800 transition-all">
                          <span className="text-slate-200 truncate max-w-[120px]" title={otherNode?.label}>
                            {otherNode?.label}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {edge.relationship}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg">
              <CheckCircle className="w-8 h-8 text-slate-700 mb-2" />
              <span className="text-xs text-slate-400 font-semibold">Select Node to Analyze</span>
              <p className="text-[10px] text-slate-600 max-w-[180px] mt-1">
                Visualizes node connections and details intelligence logs.
              </p>
            </div>
          )}
        </div>

        {/* Audit footer */}
        <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500">
          <span>KSP Cryptographic Audit Active</span>
        </div>
      </div>
    </div>
  );
}
