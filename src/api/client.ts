import axios from "axios";

export const BASE_URL = "https://api.veritascorporation.co/api/v1";
export const BASE_MEDIA = "https://api.veritascorporation.co";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const imgUrl = (path?: string | null): string => {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads")) return `${BASE_MEDIA}${path}`;
  return `${BASE_MEDIA}/uploads/${path}`;
};
