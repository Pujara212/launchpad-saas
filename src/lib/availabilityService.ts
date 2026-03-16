import api from "./api";
import { SERVICES, STAFF, AVAILABILITY_WINDOWS, generateSlots } from "./mockData";

export interface AvailabilityWindow {
  id: string;
  staff_id: string;
  staff_name?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

/**
 * Get available time slots for a staff + service + date.
 * Tries the real backend first; falls back to local mock data
 * so the UI works even without the Node.js server running.
 */
export async function getAvailableSlots(staffId: string, serviceId: string, date: string): Promise<string[]> {
  try {
    const { data } = await api.get("/availability/slots", {
      params: { staffId, serviceId, date },
      timeout: 5000, // shorter timeout for faster fallback
    });
    return data.data?.slots ?? [];
  } catch {
    // ── Fallback: generate slots from local mock windows ──────────────
    const svc = SERVICES.find((s) => s.id === serviceId);
    const staff = STAFF.find((s) => s.id === staffId);
    if (!svc || !staff) return [];

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const hasWindow = AVAILABILITY_WINDOWS.some(
      (w) => w.staffId === staffId && w.dayOfWeek === dayOfWeek
    );
    if (!hasWindow) return [];

    return generateSlots(staffId, date, svc.duration, []);
  }
}

export async function getAvailabilityWindows(): Promise<AvailabilityWindow[]> {
  try {
    const { data } = await api.get("/availability");
    return data.data ?? [];
  } catch {
    // Map local mock windows to the API shape
    return AVAILABILITY_WINDOWS.map((w) => ({
      id: w.id,
      staff_id: w.staffId,
      staff_name: STAFF.find((s) => s.id === w.staffId)?.name,
      day_of_week: w.dayOfWeek,
      start_time: w.startTime,
      end_time: w.endTime,
    }));
  }
}

export async function addAvailabilityWindow(payload: Omit<AvailabilityWindow, "id" | "staff_name">): Promise<void> {
  await api.post("/availability", payload);
}

export async function deleteAvailabilityWindow(id: string): Promise<void> {
  await api.delete(`/availability/${id}`);
}
