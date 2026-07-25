"use client";

import React, { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer as LeafletMapContainer, TileLayer, Polygon, Polyline, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { Incident, PatrolZone, Station } from "@/services/api/geoApi";
import { useAppStore } from "@/store/useAppStore";

interface HeatLayerCreator {
  heatLayer: (points: number[][], options: Record<string, unknown>) => L.Layer;
}

interface HeatmapLayerProps {
  incidents: Incident[];
}

function HeatmapLayer({ incidents }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || incidents.length === 0) return;

    const points = incidents.map((inc) => [inc.lat, inc.lng]);

    const heatLayer = (L as unknown as HeatLayerCreator).heatLayer(points, {
      radius: 25,
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
  showStations: boolean;
  stations: Station[];
  onZoneClick: (zone: PatrolZone) => void;
  onDistrictSelect: (districtName: string) => void;
  selectedDistrict: string;
}

// 5 Bangalore District Polygons
const districtBoundaries = [
  {
    name: "Central",
    color: "#06b6d4",
    coordinates: [[12.955, 77.580], [12.985, 77.580], [12.985, 77.615], [12.955, 77.615]] as [number, number][]
  },
  {
    name: "North",
    color: "#3b82f6",
    coordinates: [[12.985, 77.550], [13.030, 77.550], [13.030, 77.625], [12.985, 77.625]] as [number, number][]
  },
  {
    name: "South",
    color: "#6366f1",
    coordinates: [[12.910, 77.550], [12.955, 77.550], [12.955, 77.625], [12.910, 77.625]] as [number, number][]
  },
  {
    name: "East",
    color: "#10b981",
    coordinates: [[12.930, 77.625], [13.000, 77.625], [13.000, 77.670], [12.930, 77.670]] as [number, number][]
  },
  {
    name: "West",
    color: "#f59e0b",
    coordinates: [[12.940, 77.500], [13.000, 77.500], [13.000, 77.550], [12.940, 77.550]] as [number, number][]
  }
];

export default function MapRenderer({
  incidents,
  showPredictiveZones,
  patrolZones,
  showStations,
  stations,
  onZoneClick,
  onDistrictSelect,
  selectedDistrict
}: MapRendererProps) {
  const { role } = useAppStore();

  const center: [number, number] = useMemo(() => {
    return [12.9716, 77.5946];
  }, []);

  const zoom = useMemo(() => {
    return 12;
  }, []);

  // DivIcons for precinct stations
  const stationIcon = useMemo(() => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 14px; height: 14px; display: flex; items-center; justify-content: center;">
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 4px; background-color: #3b82f6; border: 1.5px solid #ffffff; box-shadow: 0 0 8px rgba(59,130,246,0.8);"></div>
          <div style="position: relative; width: 4px; height: 4px; background-color: #ffffff; border-radius: 50%; top: 3.5px;"></div>
        </div>
      `,
      className: "custom-station-icon",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }, []);

  // DivIcons for individual crime markers
  const crimeIcon = (category: string) => {
    const color = 
      category === "Armed Robbery" ? "#ef4444" :
      category === "Assault" ? "#f59e0b" :
      category === "Cyber Fraud" ? "#06b6d4" : "#64748b";
    
    return L.divIcon({
      html: `<div style="width: 8px; height: 8px; background-color: ${color}; border: 1px solid #ffffff; border-radius: 50%; box-shadow: 0 0 5px ${color};"></div>`,
      className: "custom-crime-icon",
      iconSize: [8, 8],
      iconAnchor: [4, 4],
    });
  };

  // Helper: compute centroid of a coordinates array
  const getCentroid = (coords: [number, number][]): [number, number] => {
    if (!coords || coords.length === 0) return [12.9716, 77.5946];
    let latSum = 0;
    let lngSum = 0;
    coords.forEach(pt => {
      latSum += pt[0];
      lngSum += pt[1];
    });
    return [latSum / coords.length, lngSum / coords.length];
  };

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
        
        {/* Heatmap density layer */}
        <HeatmapLayer incidents={incidents} />

        {/* District Boundaries Overlays */}
        {districtBoundaries.map((dist) => {
          const isSelected = selectedDistrict === dist.name;
          return (
            <Polygon
              key={`boundary-${dist.name}`}
              positions={dist.coordinates}
              pathOptions={{
                color: dist.color,
                weight: isSelected ? 2.5 : 1,
                fillColor: dist.color,
                fillOpacity: isSelected ? 0.08 : 0.01,
                dashArray: isSelected ? undefined : "3, 3"
              }}
              eventHandlers={{
                click: () => onDistrictSelect(dist.name === selectedDistrict ? "All" : dist.name)
              }}
            />
          );
        })}

        {/* Crime Hotspots */}
        {showPredictiveZones &&
          patrolZones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                color: zone.risk_level === "Critical" ? "#ef4444" : "#f59e0b",
                dashArray: "5, 5",
                fillColor: zone.risk_level === "Critical" ? "#ef4444" : "#f59e0b",
                fillOpacity: 0.20,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onZoneClick(zone)
              }}
            />
          ))}

        {/* Active Patrol Routes (dotted links connecting nearest stations to hotspot centroids) */}
        {showPredictiveZones && patrolZones.map((zone) => {
          const centroid = zone.centroid || getCentroid(zone.coordinates);
          
          // Find closest station by distance
          let closestStation: Station | null = null;
          let minDistance = Infinity;
          
          stations.forEach((st) => {
            const stLat = 12.9716 + (st.id % 3 === 0 ? 0.015 : st.id % 2 === 0 ? -0.018 : 0.009);
            const stLng = 77.5946 + (st.id % 3 === 0 ? -0.012 : st.id % 2 === 0 ? 0.021 : -0.008);
            const dist = Math.sqrt(Math.pow(stLat - centroid[0], 2) + Math.pow(stLng - centroid[1], 2));
            if (dist < minDistance) {
              minDistance = dist;
              closestStation = st;
            }
          });
          
          let stationPos: [number, number] = [12.9716, 77.5946];
          if (closestStation) {
            const stId = (closestStation as Station).id;
            stationPos = [
              12.9716 + (stId % 3 === 0 ? 0.015 : stId % 2 === 0 ? -0.018 : 0.009),
              77.5946 + (stId % 3 === 0 ? -0.012 : stId % 2 === 0 ? 0.021 : -0.008)
            ];
          }
          
          return (
            <Polyline
              key={`route-${zone.id}`}
              positions={[stationPos, centroid]}
              pathOptions={{
                color: "#10b981",
                weight: 1.5,
                dashArray: "4, 4",
                opacity: 0.8
              }}
            />
          );
        })}

        {/* Police Stations Markers */}
        {showStations &&
          stations.map((st) => {
            // Assign coordinate based on ID index
            const lat = 12.9716 + (st.id % 3 === 0 ? 0.015 : st.id % 2 === 0 ? -0.018 : 0.009);
            const lng = 77.5946 + (st.id % 3 === 0 ? -0.012 : st.id % 2 === 0 ? 0.021 : -0.008);
            return (
              <Marker key={`station-${st.id}`} position={[lat, lng]} icon={stationIcon}>
                <Popup>
                  <div className="font-mono text-[9px] text-slate-800">
                    <span className="font-bold block uppercase">{st.name}</span>
                    <span className="text-slate-500 block">Precinct Sector HQ</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Crime Markers */}
        {incidents.map((inc) => (
          <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={crimeIcon(inc.category)}>
            <Popup>
              <div className="font-mono text-[9px] text-slate-800">
                <span className="font-bold block text-blue-600 uppercase">{inc.category}</span>
                <span className="text-slate-500 block">Shift: {inc.time_shift}</span>
                {inc.description && <p className="mt-1 border-t border-slate-200 pt-1 text-slate-650">{inc.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

      </LeafletMapContainer>
    </div>
  );
}
