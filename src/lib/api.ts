import axios from "axios";

// ── Base URL — change to your deployed backend URL in production ──
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bookease_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally (auto logout)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("bookease_token");
      localStorage.removeItem("bookease_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
