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
  order_number: string | null;
  pending_since: string;
  ageing: string;
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

export const uploadLoadingMemo = async (
  enquiryNo: string,
  fileUri: string,
  vehicleNo: string,
  lorryReceipts: string[],
): Promise<UploadLoadingMemoResponse> => {
  return ApiService.postFormData<UploadLoadingMemoResponse>(
    "/api/loading_memo_upload",
    {
      enquiry_no: enquiryNo,
      loading_memo: fileUri,
      vehicle_no: vehicleNo,
      lorry_receipts: lorryReceipts.join(", "),
    },
  );
};
