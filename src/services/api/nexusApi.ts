export interface GraphNode {
  id: string;
  label: string;
  group: number; // 1=Suspect, 2=Phone, 3=Vehicle, 4=FIR
  risk_score: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string; // 'Called', 'Drives', 'Mentioned In'
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchNexusGraph(): Promise<GraphPayload> {
  try {
    const response = await fetch("http://localhost:8000/api/v1/nexus/graph", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 } // Ensure fresh fetching for dynamic updates
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch graph data: ${response.status} ${response.statusText}`);
    }

    const data: GraphPayload = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch Nexus Graph from backend:", error);
    throw error;
  }
}
