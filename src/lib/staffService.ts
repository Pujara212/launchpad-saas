import api from "./api";
import { STAFF } from "./mockData";

export interface Staff {
  id: string;
  name: string;
  specialization?: string;
  bio?: string;
  avatar_url?: string;
}

function toApiShape(s: typeof STAFF[number]): Staff {
  return {
    id: s.id,
    name: s.name,
    specialization: s.specialization,
  };
}

export async function getStaff(serviceId?: string): Promise<Staff[]> {
  try {
    const { data } = await api.get("/staff", {
      params: serviceId ? { serviceId } : {},
      timeout: 5000,
    });
    return data.data ?? [];
  } catch {
    // Fallback: return all mock staff (no service filtering in mock)
    return STAFF.map(toApiShape);
  }
}

export async function getStaffServices(staffId: string) {
  try {
    const { data } = await api.get(`/staff/${staffId}/services`, { timeout: 5000 });
    return data.data;
  } catch {
    return [];
  }
}

export async function createStaff(payload: Partial<Staff>): Promise<void> {
  await api.post("/staff", payload);
}

export async function updateStaff(id: string, payload: Partial<Staff>): Promise<void> {
  await api.put(`/staff/${id}`, payload);
}
