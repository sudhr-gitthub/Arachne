"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import { MapContainer as LeafletMapContainer, TileLayer, Polygon, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Incident, PatrolZone } from "@/services/api/geoApi";

interface HeatLayerCreator {
  heatLayer: (points: number[][], options: Record<string, unknown>) => L.Layer;
}

interface HeatmapLayerProps {
  incidents: Incident[];
}

function HeatmapLayer({ incidents }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points = incidents.map((inc) => [inc.lat, inc.lng]);

    // Cast L using helper interface instead of 'any' to avoid explicit-any warning
    const heatLayer = (L as unknown as HeatLayerCreator).heatLayer(points, {
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

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, incidents]);

  return null;
}

interface MapRendererProps {
  incidents: Incident[];
  showPredictiveZones: boolean;
  patrolZones: PatrolZone[];
}

export default function MapRenderer({
  incidents,
  showPredictiveZones,
  patrolZones,
}: MapRendererProps) {
  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <LeafletMapContainer
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

        {showPredictiveZones &&
          patrolZones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                color: "#ef4444",
                dashArray: "5, 5",
                fillColor: "#ef4444",
                fillOpacity: 0.25,
                weight: 2,
              }}
            />
          ))}
      </LeafletMapContainer>
    </div>
  );
}
