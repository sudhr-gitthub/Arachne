"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GraphPayload } from "@/services/api/nexusApi";

// Dynamically import ForceGraph2D with SSR disabled to prevent hydration errors
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((mod) => mod.default),
  { ssr: false }
);

interface GraphRendererProps {
  data: GraphPayload;
  width?: number;
  height?: number;
}

export default function GraphRenderer({ data, width, height }: GraphRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  // Handle resizing to fill parent container if explicit dimensions are not provided
  useEffect(() => {
    if (width && height) {
      setDimensions({ width, height });
      return;
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 300,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width, height]);

  // Format the data for react-force-graph (maps 'edges' to 'links')
  const formattedData = {
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      relationship: e.relationship,
    })),
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]">
      <ForceGraph2D
        graphData={formattedData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0, 0, 0, 0)"
        nodeVal={(node: any) => Math.max(3, node.risk_score / 15)}
        nodeColor={(node: any) => {
          const group = node.group;
          if (group === 1) return "#ef4444"; // Suspect
          if (group === 2) return "#3b82f6"; // Phone
          if (group === 3) return "#eab308"; // Vehicle
          return "#64748b"; // FIR
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.label || "";
          const group = node.group;
          const risk = node.risk_score || 0;

          // Node color mapping
          let color = "#64748b";
          if (group === 1) color = "#ef4444";
          else if (group === 2) color = "#3b82f6";
          else if (group === 3) color = "#eab308";

          const size = Math.max(3, risk / 15);

          // Draw outer glowing halo for critical risks
          if (risk > 75) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI, false);
            ctx.fillStyle = group === 1 ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)";
            ctx.fill();
          }

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "#0b1326";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw text labels displaying the label property
          const labelText = label.split(" (")[0]; // Clean label representation
          ctx.font = `${8 / globalScale + 3}px JetBrains Mono, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#dae2fd";

          // Text shadow outline
          ctx.shadowColor = "#0b1326";
          ctx.shadowBlur = 3;

          ctx.fillText(labelText, node.x, node.y + size + 7);
          ctx.shadowBlur = 0; // Reset shadow
        }}
        linkColor={() => "#334155"}
        linkWidth={1.5}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={0.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(link: any) => {
          // Color flow particles based on connection relationship
          if (link.relationship === "Called") return "#3b82f6";
          if (link.relationship === "Drives") return "#eab308";
          return "#64748b";
        }}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
