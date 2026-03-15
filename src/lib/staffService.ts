import api from "./api";

export interface Staff {
  id: string;
  name: string;
  specialization?: string;
  bio?: string;
  avatar_url?: string;
}

export async function getStaff(serviceId?: string): Promise<Staff[]> {
  const { data } = await api.get("/staff", { params: serviceId ? { serviceId } : {} });
  return data.data;
}

export async function getStaffServices(staffId: string) {
  const { data } = await api.get(`/staff/${staffId}/services`);
  return data.data;
}

export async function createStaff(payload: Partial<Staff>): Promise<void> {
  await api.post("/staff", payload);
}

export async function updateStaff(id: string, payload: Partial<Staff>): Promise<void> {
  await api.put(`/staff/${id}`, payload);
}
