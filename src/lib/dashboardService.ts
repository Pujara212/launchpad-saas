import api from "./api";

export interface DashboardStats {
  total: number;
  todayCount: number;
  confirmed: number;
  cancelled: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  topServices: { name: string; count: number }[];
  staffPerf: { name: string; bookings: number; revenue: number }[];
  recent: any[];
  monthlyRevenue: { month: string; revenue: number; bookings: number }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await api.get("/dashboard");
  return data.data;
}
