import api from "./api";

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration_min: number;
  price: number;
}

export async function getServices(): Promise<Service[]> {
  const { data } = await api.get("/services");
  return data.data;
}

export async function getService(id: string): Promise<Service> {
  const { data } = await api.get(`/services/${id}`);
  return data.data;
}

export async function createService(payload: Partial<Service>): Promise<void> {
  await api.post("/services", payload);
}

export async function updateService(id: string, payload: Partial<Service>): Promise<void> {
  await api.put(`/services/${id}`, payload);
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
