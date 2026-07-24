export interface Incident {
  id: string;
  lat: number;
  lng: number;
  category: "Armed Robbery" | "Cyber Fraud" | "Assault" | "Theft";
  time_shift: "Day" | "Night";
}

export interface PatrolZone {
  id: string;
  coordinates: [number, number][];
  risk_level: "High" | "Critical";
}

export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const response = await fetch("http://localhost:8000/api/v1/geo/incidents", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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

export async function fetchPatrolZones(): Promise<PatrolZone[]> {
  try {
    const response = await fetch("http://localhost:8000/api/v1/geo/predict-patrols", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
