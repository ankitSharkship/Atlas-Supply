import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

// const API_BASE_URL = 'http://192.168.1.64:8000';
const API_BASE_URL = 'https://atlas.logipod.in';
const ULIP_API_BASE_URL = process.env.EXPO_PUBLIC_ULIP_API_BASE_URL;
const AUTH_STORAGE_KEY = "auth_user";
const DEFAULT_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function safeParseJSON(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text; // Return raw text if not JSON, handleResponse will use it
  }
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export class ApiService {
  private static async getHeaders(contentType: string = "application/json") {
    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };

    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed?.token) {
          headers["Authorization"] = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // Corrupted storage → ignore instead of crash
    }

    return headers;
  }

  static async getAuthHeaderPublic(): Promise<Record<string, string>> {
     return this.getAuthHeader();
  }

  private static async getAuthHeader(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed?.token) {
          headers["Authorization"] = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // Corrupted storage
    }
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    const data = await safeParseJSON(response);

    // console.log(`[API Response] ${response.status} ${response.url}`);
    // console.log(`[API Data]`, data);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        router.dismissAll();
        router.replace("/login");
      }

      const message =
        typeof data === "object"
          ? data?.message || data?.error || `Request failed with status ${response.status}`
          : `Server Error: ${response.status}`;

      throw new ApiError(message, response.status, data);
    }

    return data as T;
  }

  static async post<T>(endpoint: string, body: any): Promise<T> {
    if (!API_BASE_URL) throw new Error("API_BASE_URL is not defined");
    const headers = await this.getHeaders();

    console.log(`[API Request] POST ${API_BASE_URL}${endpoint}`);
    console.log(`[API Body]`, body);

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      return this.handleResponse<T>(response);
    } catch (err: any) {
      if (err.name === "AbortError") throw new ApiError("Request timed out");
      if (err instanceof ApiError) throw err;
      throw new ApiError("Network error: " + err.message);
    }
  }

  static async postUlip<T>(endpoint: string, body: any): Promise<T> {
    if (!ULIP_API_BASE_URL) throw new Error("ULIP_API_BASE_URL is not defined");
    const headers = await this.getHeaders();

    console.log(`[API Request] POST ULIP ${ULIP_API_BASE_URL}${endpoint}`);
    
    try {
      const response = await fetchWithTimeout(`${ULIP_API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      return this.handleResponse<T>(response);
    } catch (err: any) {
      if (err.name === "AbortError") throw new ApiError("Request timed out");
      if (err instanceof ApiError) throw err;
      throw new ApiError("Network error: " + err.message);
    }
  }

  static async postFormData<T>(
    endpoint: string,
    params: Record<string, any>,
  ): Promise<T> {
    if (!API_BASE_URL) throw new Error("API_BASE_URL is not defined");
    const headers = await this.getAuthHeader();

    console.log(`[API Request] POST (FormData) ${API_BASE_URL}${endpoint}`);
    console.log(`[API Params]`, params);

    const formData = new FormData();
    for (const key of Object.keys(params)) {
      const value = params[key];
      if (value == null) continue;

      if (Array.isArray(value)) {
        // Backend expects stringified array or comma separated? 
        // Current code used JSON.stringify, snippet suggested join(",")
        // Keeping original logic of JSON.stringify as it's more standard for complex types
        formData.append(key, JSON.stringify(value));
      } else if (
        typeof value === "string" &&
        (value.startsWith("file://") ||
          value.startsWith("content://") ||
          value.startsWith("ph://"))
      ) {
        const extension = value.split(".").pop()?.toLowerCase() ?? "";
        const mimeMap: Record<string, string> = {
          png: "image/png",
          pdf: "application/pdf",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
        };

        formData.append(key, {
          uri: value,
          name: `${key}.${extension || "jpg"}`,
          type: mimeMap[extension] || "application/octet-stream",
        } as any);
      } else if (typeof value === "object" && value.uri) {
        // Handle picking object directly
        formData.append(key, value as any);
      } else {
        formData.append(key, String(value));
      }
    }

    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}${endpoint}`,
        {
          method: "POST",
          headers,
          body: formData,
        },
        120000, // 2 minutes for uploads
      );
      return this.handleResponse<T>(response);
    } catch (err: any) {
      if (err.name === "AbortError") throw new ApiError("Upload timed out");
      if (err instanceof ApiError) throw err;
      throw new ApiError("Network error: " + err.message);
    }
  }

  static async get<T>(
    endpoint: string, 
    queryParams?: Record<string, any>
  ): Promise<T> {
    if (!API_BASE_URL) throw new Error("API_BASE_URL is not defined");
    const headers = await this.getHeaders();

    let url = `${API_BASE_URL}${endpoint}`;
    if (queryParams) {
      const queryString = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value == null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => queryString.append(key, v));
        } else {
          queryString.append(key, value);
        }
      });
      const qs = queryString.toString();
      if (qs) url += `?${qs}`;
    }

    console.log(`[API Request] GET ${url}`);

    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers,
      });
      return this.handleResponse<T>(response);
    } catch (err: any) {
      if (err.name === "AbortError") throw new ApiError("Request timed out");
      if (err instanceof ApiError) throw err;
      throw new ApiError("Network error: " + err.message);
    }
  }
}
