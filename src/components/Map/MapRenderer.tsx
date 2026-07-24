"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import { MapContainer as LeafletMapContainer, TileLayer, Polygon, useMap, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Incident, PatrolZone } from "@/services/api/geoApi";
import { useAppStore } from "@/store/useAppStore";
import { useMemo } from "react";

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

interface MapViewUpdaterProps {
  center: [number, number];
  zoom: number;
}

function MapViewUpdater({ center, zoom }: MapViewUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
}

interface MapRendererProps {
  incidents: Incident[];
  showPredictiveZones: boolean;
  patrolZones: PatrolZone[];
  showCCTV: boolean;
  showUnits: boolean;
}

// 15 CCTV Coordinates centered around Bangalore
const cctvLocations: [number, number][] = [
  [12.9716, 77.5946],
  [12.9750, 77.5990],
  [12.9690, 77.5910],
  [12.9735, 77.6020],
  [12.9780, 77.5900],
  [12.9650, 77.5980],
  [12.9820, 77.5960],
  [12.9600, 77.5890],
  [12.9760, 77.6100],
  [12.9710, 77.6050],
  [12.9850, 77.6120],
  [12.9580, 77.6010],
  [12.9630, 77.6150],
  [12.9800, 77.5800],
  [12.9700, 77.5850],
];

// 8 Unit Coordinates centered around Bangalore
const unitLocations: [number, number][] = [
  [12.9740, 77.5970],
  [12.9680, 77.5930],
  [12.9720, 77.6040],
  [12.9790, 77.5920],
  [12.9660, 77.6000],
  [12.9810, 77.5990],
  [12.9610, 77.5910],
  [12.9770, 77.6080],
];

export default function MapRenderer({
  incidents,
  showPredictiveZones,
  patrolZones,
  showCCTV,
  showUnits,
}: MapRendererProps) {
  const { role } = useAppStore();

  const center: [number, number] = useMemo(() => {
    return role === "Commissioner" ? [12.9716, 77.5946] : [12.9784, 77.6408];
  }, [role]);

  const zoom = useMemo(() => {
    return role === "Commissioner" ? 11 : 14;
  }, [role]);

  // Create DivIcons safely on client side
  const cctvIcon = useMemo(() => {
    return L.divIcon({
      html: `<div style="width: 10px; height: 10px; background-color: #64748b; border: 1px solid #94a3b8; border-radius: 2px;"></div>`,
      className: "custom-cctv-icon",
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
  }, []);

  const unitIcon = useMemo(() => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 12px; height: 12px;">
          <div style="position: absolute; top: 0; left: 0; width: 12px; height: 12px; border-radius: 50%; background-color: #3b82f6; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 8px; height: 8px; margin: 2px; border-radius: 50%; background-color: #1d4ed8; border: 2px solid #ffffff;"></div>
        </div>
      `,
      className: "custom-unit-icon",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }, []);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapViewUpdater center={center} zoom={zoom} />
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

        {showCCTV &&
          cctvLocations.map((pos, idx) => (
            <Marker key={`cctv-${idx}`} position={pos} icon={cctvIcon} />
          ))}

        {showUnits &&
          unitLocations.map((pos, idx) => (
            <Marker key={`unit-${idx}`} position={pos} icon={unitIcon} />
          ))}
      </LeafletMapContainer>
    </div>
  );
}
