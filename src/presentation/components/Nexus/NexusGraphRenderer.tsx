"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NexusGraphData, GraphNode } from "@/domain/entities/NexusGraph";

// Dynamically import ForceGraph2D to prevent SSR/hydration issues
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d"),
  { ssr: false }
);

interface NexusGraphRendererProps {
  data: NexusGraphData;
  onNodeClick?: (node: GraphNode | null) => void;
}

export default function NexusGraphRenderer({ data, onNodeClick }: NexusGraphRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Handle container resizing to fit the parent element perfectly
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Format the domain entities to the structure react-force-graph expects
  const graphData = {
    nodes: data.nodes.map((node) => ({ ...node })),
    links: data.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      relationship: edge.relationship,
    })),
  };

  // Pre-calculate the "Blast Radius" connections (first-degree nodes)
  const connectedNodeIds = new Set<string>();
  if (selectedNodeId) {
    connectedNodeIds.add(selectedNodeId);
    data.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        connectedNodeIds.add(edge.target);
      } else if (edge.target === selectedNodeId) {
        connectedNodeIds.add(edge.source);
      }
    });
  }

  // Node coloring helper based on type and highlight state
  const getNodeColorRgba = (type: string, opacity: number) => {
    switch (type) {
      case "suspect":
        return `rgba(239, 68, 68, ${opacity})`; // red
      case "phone":
        return `rgba(59, 130, 246, ${opacity})`; // blue
      case "vehicle":
        return `rgba(234, 179, 8, ${opacity})`; // yellow
      case "fir":
        return `rgba(100, 116, 139, ${opacity})`; // gray
      default:
        return `rgba(203, 213, 225, ${opacity})`; // default
    }
  };

  // Check if a link is connected to the selected node
  const isLinkConnected = (link: any) => {
    if (!selectedNodeId) return true;
    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
    const targetId = typeof link.target === "object" ? link.target.id : link.target;
    return sourceId === selectedNodeId || targetId === selectedNodeId;
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative overflow-hidden bg-slate-950/20 rounded-lg">
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)" // Transparent
        
        // Node Customization with Blast Radius filtering
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const isHighlighted = !selectedNodeId || connectedNodeIds.has(node.id);
          const opacity = isHighlighted ? 1.0 : 0.2;
          const color = getNodeColorRgba(node.type, opacity);
          const radius = 4 + (node.riskScore / 20); // Scale node radius based on risk score (4 to 9)

          // 1. Draw node circle glow
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColorRgba(node.type, isHighlighted ? 0.12 : 0.03);
          ctx.fill();

          // 2. Draw node circle core
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();

          // 3. Draw a border
          ctx.lineWidth = 1.5 / globalScale;
          ctx.strokeStyle = `rgba(15, 23, 42, ${opacity})`; // Deep background outline
          ctx.stroke();

          // 4. Draw label text next to node
          const label = node.label;
          const fontSize = Math.max(9, 12 / globalScale); // Keep text readable at low zoom
          ctx.font = `600 ${fontSize}px sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          
          // Draw text background highlight for high readability
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = `rgba(15, 23, 42, ${isHighlighted ? 0.6 : 0.12})`;
          ctx.fillRect(
            node.x + radius + 4,
            node.y - fontSize / 2 - 2,
            textWidth + 6,
            fontSize + 4
          );

          // Draw the label text
          ctx.fillStyle = node.type === "suspect" 
            ? `rgba(254, 202, 202, ${opacity})` 
            : `rgba(203, 213, 225, ${opacity})`;
          ctx.fillText(label, node.x + radius + 7, node.y);
        }}
        
        // Node Pointer Interactions
        onNodeClick={(node: any) => {
          const nextSelectedId = selectedNodeId === node.id ? null : node.id;
          setSelectedNodeId(nextSelectedId);
          
          if (onNodeClick) {
            if (nextSelectedId) {
              const originalNode = data.nodes.find((n) => n.id === node.id);
              if (originalNode) onNodeClick(originalNode);
            } else {
              onNodeClick(null);
            }
          }
        }}

        // Background Click Resets Selection
        onBackgroundClick={() => {
          setSelectedNodeId(null);
          if (onNodeClick) onNodeClick(null);
        }}

        // Edge/Link Styling with Blast Radius filtering
        linkColor={(link: any) => isLinkConnected(link) ? "rgba(71, 85, 105, 1)" : "rgba(30, 41, 59, 0.2)"}
        linkWidth={(link: any) => isLinkConnected(link) ? 2 : 0.5}
        linkDirectionalArrowLength={(link: any) => isLinkConnected(link) ? 5 : 2}
        linkDirectionalArrowColor={(link: any) => isLinkConnected(link) ? "rgba(71, 85, 105, 1)" : "rgba(30, 41, 59, 0.2)"}
        linkDirectionalArrowRelPos={0.5} // Centered arrows
        
        // Tooltip detail representation
        nodeLabel={(node: any) => `
          <div class="bg-slate-900 border border-slate-700 text-slate-100 text-xs px-3 py-2 rounded-lg shadow-xl font-sans">
            <div class="font-bold text-blue-400 uppercase tracking-wider mb-1">${node.type}</div>
            <div class="text-sm font-semibold">${node.label}</div>
            <div class="mt-1 text-slate-400">Risk Score: <span class="font-bold ${node.riskScore > 75 ? "text-red-400" : "text-slate-300"}">${node.riskScore}</span></div>
          </div>
        `}
        linkLabel={(link: any) => `
          <div class="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-2.5 py-1 rounded shadow-md font-sans font-medium uppercase tracking-widest">
            ${link.relationship}
          </div>
        `}
        
        // Force Simulation Configuration
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
      />
    </div>
  );
}
