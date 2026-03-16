import api from "./api";
import { SERVICES } from "./mockData";

export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration_min: number;
  price: number;
}

function toApiShape(s: typeof SERVICES[number]): Service {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    duration_min: s.duration,
    price: s.price,
  };
}

export async function getServices(): Promise<Service[]> {
  try {
    const { data } = await api.get("/services", { timeout: 5000 });
    return data.data ?? [];
  } catch {
    return SERVICES.map(toApiShape);
  }
}

export async function getService(id: string): Promise<Service> {
  try {
    const { data } = await api.get(`/services/${id}`, { timeout: 5000 });
    return data.data;
  } catch {
    const s = SERVICES.find((x) => x.id === id);
    if (!s) throw new Error("Service not found");
    return toApiShape(s);
  }
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
