import api from "./api";

export interface AvailabilityWindow {
  id: string;
  staff_id: string;
  staff_name?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export async function getAvailableSlots(staffId: string, serviceId: string, date: string): Promise<string[]> {
  const { data } = await api.get("/availability/slots", { params: { staffId, serviceId, date } });
  return data.data.slots;
}

export async function getAvailabilityWindows(): Promise<AvailabilityWindow[]> {
  const { data } = await api.get("/availability");
  return data.data;
}

export async function addAvailabilityWindow(payload: Omit<AvailabilityWindow, "id" | "staff_name">): Promise<void> {
  await api.post("/availability", payload);
}

export async function deleteAvailabilityWindow(id: string): Promise<void> {
  await api.delete(`/availability/${id}`);
}
