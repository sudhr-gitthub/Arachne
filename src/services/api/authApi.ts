import { API_BASE_URL } from "@/services/api/config";
export interface UserResponse {
  id: string;
  email: string;
  name?: string;
  role: "SHO" | "Commissioner";
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Authentication failed");
  }

  return response.json();
}

export async function registerUser(email: string, password: string, name?: string, role: string = "SHO"): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name, role }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || "Registration failed");
  }

  return response.json();
}

export async function fetchCurrentUser(token: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve user profile");
  }

  return response.json();
}
