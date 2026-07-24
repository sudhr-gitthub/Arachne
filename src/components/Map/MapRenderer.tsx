"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Incident } from "@/services/api/geoApi";

interface HeatmapLayerProps {
  incidents: Incident[];
}

// Child component to handle leaflet map instance access via useMap
function HeatmapLayer({ incidents }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || incidents.length === 0) return;

    // Map incidents to [lat, lng] array
    const points = incidents.map((inc) => [inc.lat, inc.lng]);

    // Create the heat layer using leaflet.heat plugin
    const heatLayer = (L as any).heatLayer(points, {
      radius: 20,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: "blue",
        0.6: "cyan",
        0.7: "lime",
        0.8: "yellow",
        1.0: "red",
      },
    });

    heatLayer.addTo(map);

    // Clean up layer on unmount or when incidents update
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, incidents]);

  return null;
}

interface MapRendererProps {
  incidents: Incident[];
}

export default function MapRenderer({ incidents }: MapRendererProps) {
  return (
    <div className="w-full h-full min-h-[400px] relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={12}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <HeatmapLayer incidents={incidents} />
      </MapContainer>
    </div>
  );
}
