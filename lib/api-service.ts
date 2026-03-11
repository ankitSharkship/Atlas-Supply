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

// Interface for Enquiry Status Response
export interface EnquiryStatusResponse {
  summary: {
    Operations: {
      "Collect Original POD": number;
      "Generate Lorry Receipt": number;
      "Get ePOD after Delivery": number;
      "In Transit": number;
      "Original POD Verified": number;
      "Vehicle Delivered": number;
      "Vehicle Gate-In": number;
      "Vehicle Gate-Out & Dispatch": number;
      "Vehicle Get Loaded": number;
      "Vehicle Reported": number;
      "Vehicle Reporting": number;
      "Vehicle Tracking": number;
    }
  };
  total_enquiry_count: number;
}

export interface FirstMileImplantData {
  advance_done: boolean;
  central_team_actual_weight: number | null;
  central_team_client_mg: number | null;
  central_team_customer_invoice_no: string | null;
  central_team_eway_bills: string | null;
  created_on: string;
  customer_name: string;
  document_upload: string | null;
  document_uploaded_by: string | null;
  driver_mobile_no: string | null;
  enquiry_no: string | null;
  from_location: string;
  height: number | null;
  id: any;
  implant_actual_load_weight: number | null;
  implant_eway_bills: string | null;
  lorry_receipt_date: string | null;
  lorry_receipts: string[] | null;
  lr_assigned: string[] | null;
  lr_assigned_count: number | null;
  mark_loaded_datetime: string | null;
  mark_loaded_updated_by: string | null;
  no_of_lr_requested: number | null;
  required_on_date: string;
  status: string;
  to_location: string;
  update_document_flag: any;
  vehicle_assigned: string | null;
  vehicle_assigned_weight_capacity: number | null;
  vehicle_gate_in_datetime: string | null;
  vehicle_gate_in_datetime_updated_by: string | null;
  vehicle_no: string | null;
  vehicle_number: string | null;
  vehicle_reporting_datetime: string | null;
  vehicle_reporting_datetime_updated_by: string | null;
  vehicle_type: string;
  vendor_name: string | null;
}

export interface FirstMileImplantResponse {
  first_mile_implant_data: FirstMileImplantData[];
  total_count: number;
}

export const getEnquiryStatus = async (): Promise<EnquiryStatusResponse> => {
  return ApiService.post<EnquiryStatusResponse>('/api/get_enquiry_status', {
    department: 'Operations',
    location: [],
  });
};

export const getFirstMileImplantDisplay = async (location: string[] = []): Promise<FirstMileImplantResponse> => {
  return ApiService.post<FirstMileImplantResponse>('/api/first_mile_implant_display', {
    location: location,
  });
};

export const editFirstMileImplant = async (params: any): Promise<any> => {
  console.log(params);
  
  return ApiService.postFormData('/api/edit_first_mile_implant', params);
};
// --- HPOD (Last Mile OPOD) ---

export interface LastMileOpodData {
  courier_datetime: string | null;
  courier_name: string | null;
  created_on: string;
  customer_name: string;
  docket_no: string | null;
  enquiry_no: string;
  from_location: string;
  id: number;
  lorry_receipts: string[];
  opod_files: any;
  required_on_date: string;
  status: string;
  to_location: string;
  updated_at: string | null;
  updated_by: string | null;
  vehicle_no: string;
}

export interface LastMileOpodResponse {
  last_mile_opod_data: LastMileOpodData[];
  status_filter: string;
  total_count: number;
}

export const getLastMileOpodDisplay = async (location: string[] = []): Promise<LastMileOpodResponse> => {
  return ApiService.post<LastMileOpodResponse>('/api/last_mile_opod_display', {
    location,
    status_filter: 'pending',
  });
};

export const editLastMileOpod = async (formData: FormData): Promise<any> => {
  const headers = await ApiService.getAuthHeaderPublic();

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/last_mile_opod_edit`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }

  return data;
};

