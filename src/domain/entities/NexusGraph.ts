export type NodeType = "suspect" | "phone" | "vehicle" | "fir";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  riskScore: number; // 0-100
}

export interface GraphEdge {
  source: string; // source node id
  target: string; // target node id
  relationship: string;
}

export interface NexusGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
