import { API_BASE_URL } from "@/services/api/config";
export interface Incident {
  id: string;
  lat: number;
  lng: number;
  category: "Armed Robbery" | "Cyber Fraud" | "Assault" | "Theft";
  time_shift: "Day" | "Night";
  description?: string;
}

export interface PatrolZone {
  id: string;
  coordinates: [number, number][];
  risk_level: "High" | "Critical";
  crime_count?: number;
  centroid?: [number, number];
  patrol_suggested?: number;
  algorithm?: string;
}

export interface District {
  id: number;
  name: string;
  description?: string;
}

export interface Station {
  id: number;
  name: string;
  district_id: number;
  address?: string;
}

export async function fetchIncidents(filters?: {
  category?: string;
  shift?: string;
  district?: string;
  search?: string;
  token?: string | null;
}): Promise<Incident[]> {
  try {
    let queryParams = "";
    if (filters) {
      const parts = [];
      if (filters.category && filters.category !== "All") parts.push(`category=${encodeURIComponent(filters.category)}`);
      if (filters.shift && filters.shift !== "All") parts.push(`shift=${encodeURIComponent(filters.shift)}`);
      if (filters.district && filters.district !== "All") parts.push(`district=${encodeURIComponent(filters.district)}`);
      if (filters.search) parts.push(`search=${encodeURIComponent(filters.search)}`);
      if (parts.length > 0) {
        queryParams = "?" + parts.join("&");
      }
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (filters?.token) {
      headers["Authorization"] = `Bearer ${filters.token}`;
    }

    const response = await fetch(`{API_BASE_URL}/api/v1/geo/incidents${queryParams}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch incidents: ${response.status}`);
    }

    const data: Incident[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch geo incidents:", error);
    throw error;
  }
}

export async function fetchPatrolZones(
  params: {
    algorithm?: string;
    eps?: number;
    minSamples?: number;
    nClusters?: number;
    minClusterSize?: number;
    token?: string | null;
  } = {}
): Promise<PatrolZone[]> {
  try {
    const {
      algorithm = "dbscan",
      eps = 0.012,
      minSamples = 5,
      nClusters = 4,
      minClusterSize = 5,
      token
    } = params;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const parts = [
      `algorithm=${encodeURIComponent(algorithm)}`,
      `eps=${eps}`,
      `min_samples=${minSamples}`,
      `n_clusters=${nClusters}`,
      `min_cluster_size=${minClusterSize}`
    ];
    const response = await fetch(`{API_BASE_URL}/api/v1/geo/predict-patrols?${parts.join("&")}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch patrol zones: ${response.status}`);
    }

    const data: PatrolZone[] = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch patrol zones:", error);
    throw error;
  }
}

export async function fetchDistricts(token?: string | null): Promise<District[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/api/v1/districts`, { headers });
    if (!response.ok) throw new Error("Failed to fetch districts");
    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function fetchStations(token?: string | null): Promise<Station[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/api/v1/districts/stations`, { headers });
    if (!response.ok) throw new Error("Failed to fetch stations");
    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}
