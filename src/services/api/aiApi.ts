export interface AIQueryResponse {
  query: string;
  response: string;
  sources: string[];
}

export interface AISummaryResponse {
  node_id: string;
  summary: string;
}

export async function fetchAISummary(nodeId: string, token: string | null): Promise<AISummaryResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("http://localhost:8000/api/v1/ai/insights/summary", {
    method: "POST",
    headers,
    body: JSON.stringify({ node_id: nodeId }),
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve entity summary from AI engine");
  }

  return response.json();
}

export async function askAIChat(query: string, token: string | null): Promise<AIQueryResponse> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("http://localhost:8000/api/v1/ai/insights/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve chat response from AI engine");
  }

  return response.json();
}
