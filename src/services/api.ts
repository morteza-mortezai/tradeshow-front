import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use((response) => {
  const body = response.data;
  response.data = body?.success === true && "data" in body ? body.data : body;
  return response;
});

export default api;
