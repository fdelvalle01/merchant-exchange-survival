import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL
});
