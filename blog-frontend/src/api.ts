import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({ baseURL: BASE_URL });

// Endpoints that must never carry (or trigger a refresh of) the access token.
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
const isAuthPath = (url = "") => AUTH_PATHS.some((p) => url.endsWith(p));

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem("accessToken");
  },
  get refresh(): string | null {
    return localStorage.getItem("refreshToken");
  },
  set(tokens: { accessToken?: string; refreshToken?: string }) {
    if (tokens.accessToken) localStorage.setItem("accessToken", tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem("refreshToken", tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};

/** Pull a human-readable message out of an Axios error. */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    return data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

// Attach the access token to protected requests.
api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const t = tokenStore.access;
  if (t && !isAuthPath(cfg.url)) {
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

// Single in-flight refresh shared by concurrent 401s.
let refreshPromise: Promise<string> | null = null;

function forceLogout() {
  tokenStore.clear();
  window.dispatchEvent(new Event("auth:logout"));
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) throw new Error("No refresh token");
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken as string;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthPath(original.url)) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const newAccess = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        refreshPromise = null;
        forceLogout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
