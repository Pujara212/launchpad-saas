import api from "./api";

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; phone: string; password: string; }
export interface AuthUser { id: string; name: string; email: string; phone: string; role: "customer" | "admin"; }

export async function login(payload: LoginPayload): Promise<{ user: AuthUser; token: string }> {
  const { data } = await api.post("/auth/login", payload);
  return data.data;
}

export async function register(payload: RegisterPayload): Promise<{ user: AuthUser; token: string }> {
  const { data } = await api.post("/auth/register", payload);
  return data.data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get("/auth/me");
  return data.data.user;
}
