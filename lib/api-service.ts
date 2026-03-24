import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const AUTH_STORAGE_KEY = 'auth_user';

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export class ApiService {
  private static async getHeaders(contentType: string = 'application/json') {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (userData) {
      const { token } = JSON.parse(userData);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  static async getAuthHeaderPublic(): Promise<Record<string, string>> {
    return this.getAuthHeader();
  }

  private static async getAuthHeader(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (userData) {
      const { token } = JSON.parse(userData);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  static async post<T>(endpoint: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    // console.log(`${API_BASE_URL} ${endpoint}`);
    console.log(API_BASE_URL);
    console.log(endpoint);
    
    console.log(body);
    
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    console.log(response);
    

    const data = await response.json();
    console.log(JSON.stringify(data));
    

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  static async postFormData<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const headers = await this.getAuthHeader();
    // Do NOT set Content-Type — fetch auto-sets it with the correct multipart boundary

    const formData = new FormData();
    for (const key of Object.keys(params)) {
      const value = params[key];

      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        // Serialize arrays as a JSON string — appending the same key multiple times
        // only gives Django's request.POST.get() the last value.
        // A JSON string like '["LR001","LR002"]' lets the backend parse all items.
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'object' && value !== null && 'uri' in value) {
        // It's a file metadata object (e.g. from DocumentPicker or ImagePicker)
        formData.append(key, value as any);
      } else if (
        typeof value === 'string' &&
        (value.startsWith('file://') ||
          value.startsWith('content://') ||
          value.startsWith('ph://'))
      ) {
        // It's a local image/file URI — append as a blob so multipart upload works
        const extension = value.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        formData.append(key, {
          uri: value,
          name: `${key}.${extension}`,
          type: mimeType,
        } as any);
      } else {
        formData.append(key, String(value));
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    console.log(data);
    

    if (!response.ok) {
      throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

 static async get<T>(
  endpoint: string,
  queryParams?: Record<string, any>
): Promise<T> {
  console.log('start');
  console.log(endpoint);
  console.log(queryParams);
  const headers = await this.getHeaders();

  let url = `${API_BASE_URL}${endpoint}`;
  
  console.log(url);
  
  if (queryParams) {
    const queryString = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach(v => queryString.append(key, v));
      } else {
        queryString.append(key, value);
      }
    });

    const qs = queryString.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  console.log(url);

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}
}
