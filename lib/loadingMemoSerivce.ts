import { ApiService } from "./api-service";

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
  vendor_name: string;
  final_rate: string;
  advance_amount: string;
  lorry_receipts: string[];
  lorry_receipt_date: string;
  vehicle_assigned: string;
}

export interface LoadingMemoResponse {
  loading_memo_data: LoadingMemoData[];
  status_filter: string;
  total_count: number;
}

export const getLoadingMemoDisplay = async (
  zone: string[] = [],
): Promise<LoadingMemoResponse> => {
  return ApiService.post<LoadingMemoResponse>("/api/loading_memo_display", {
    zone: zone,
    status_filter: "pending",
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
  400: "Invalid request — enquiry number or file is missing.",
  401: "Session expired. Please log in again.",
  404: "Enquiry not found. The provided enquiry number does not exist.",
  500: "A server error occurred. Please try again later.",
};

export const uploadLoadingMemo = async (
  enquiryNo: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadLoadingMemoResponse> => {
  const headers = await ApiService.getAuthHeaderPublic();

  const formData = new FormData();
  formData.append("enquiry_no", enquiryNo);
  formData.append("loading_memo", {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/loading_memo_upload`,
    {
      method: "POST",
      headers,
      body: formData,
    },
  );

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
