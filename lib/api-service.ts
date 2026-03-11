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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

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
      console.log(key, value);

      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        // Serialize arrays as a JSON string — appending the same key multiple times
        // only gives Django's request.POST.get() the last value.
        // A JSON string like '["LR001","LR002"]' lets the backend parse all items.
        formData.append(key, JSON.stringify(value));
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

  static async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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


// --- Loading Memo ---

export interface LoadingMemoData {
  created_on: string;
  customer_name: string;
  enquiry_no: string;
  from_location: string;
  loading_memo: string | null;
  loading_memo_verification_status: boolean;
  required_on_date: string;
  status: string;
  to_location: string;
  updated_at: string | null;
  updated_by: string | null;
  vehicle_no: string;
}

export interface LoadingMemoResponse {
  loading_memo_data: LoadingMemoData[];
  status_filter: string;
  total_count: number;
}

export const getLoadingMemoDisplay = async (location: string[] = []): Promise<LoadingMemoResponse> => {
  return ApiService.post<LoadingMemoResponse>('/api/loading_memo_display', {
    location,
    status_filter: 'pending',
  });
};

export interface UploadLoadingMemoResponse {
  message: string;
  updated_data: {
    enquiry_no: string;
    vehicle_no: string;
    loading_memo: string;
    loading_memo_verification_status: string;
    updated_at: string;
    updated_by: string;
    customer_name: string;
    from_location: string;
    to_location: string;
    status: string;
  };
}

const UPLOAD_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request — enquiry number or file is missing.',
  401: 'Session expired. Please log in again.',
  404: 'Enquiry not found. The provided enquiry number does not exist.',
  500: 'A server error occurred. Please try again later.',
};

export const uploadLoadingMemo = async (
  enquiryNo: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadLoadingMemoResponse> => {
  const headers = await ApiService.getAuthHeaderPublic();

  const formData = new FormData();
  formData.append('enquiry_no', enquiryNo);
  formData.append('loading_memo', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/loading_memo_upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const friendlyMessage =
      UPLOAD_ERROR_MESSAGES[response.status] ||
      data.message ||
      data.error ||
      `Upload failed (status ${response.status})`;
    throw new Error(friendlyMessage);
  }

  return data as UploadLoadingMemoResponse;
};

