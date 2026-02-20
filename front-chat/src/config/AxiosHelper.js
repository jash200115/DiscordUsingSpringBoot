import axios from "axios";

/**
 * Use Vite's build-time env var VITE_API_BASE_URL (set on Render).
 * Fallback to localhost for local development.
 */
export const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const httpClient = axios.create({
  baseURL: baseURL,
});

/**
 * 🔐 REQUEST INTERCEPTOR
 * Automatically attach JWT token to every request
 */
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ⚠️ RESPONSE INTERCEPTOR (optional but recommended)
 * Handle 401 globally
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Unauthorized - logging out");

      localStorage.removeItem("token");

      // optional: redirect to login
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);