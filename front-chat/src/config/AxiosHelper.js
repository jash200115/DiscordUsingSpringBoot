import axios from "axios";

/**
 * Use Vite's build-time env var VITE_API_BASE_URL (set on Render).
 * Fallback to localhost for local development.
 */
export const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const httpClient = axios.create({
  baseURL: baseURL,
});
