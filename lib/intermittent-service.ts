import { ApiService } from "./api-service";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export interface AddIntermittentChargePayload {
  gr_date: string;
  enquiry_no: string;
  lr_no: string;
  vehicle_no: string;

  vendor_payment_status: "Paid" | "Unpaid";
  payment_adjustment: "Bill to Client" | string;

  charge_category: string;
  charge_amount?: number;

  amount_transfer_to:
    | "Registered Vendor"
    | "Unregistered Vendor"
    | "Existing Employee";

  name: string;
  amount: number;

  mail_subject: string;

  approval_file: any; // File object (DocumentPicker)

  // conditional
  contact_no?: string;
  bank_name?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  employee_code?: string;

  // optional
  branch_name?: string;
  approved_by?: string;
  remarks?: string;
}

export interface AddIntermittentChargeResponse {
  message: string;
}

export interface VendorCharge {
  id: number;
  enquiry_no: string;
  lr_no: string;
  lr_date: string;
  vehicle_no: string;

  charge_category: string;
  charge_amount: number;
  amount: number;

  amount_transfer_to: string;
  name: string;
  contact_no: string | null;

  payment_adjustment: string;
  payment_via: string | null;
  immediate_payment: boolean;
  paid_to_vendor: boolean;

  vendor_payment_status: string;

  approval_file: string | null;
  qr_code_file: string | null;

  approved_by: string;
  mail_subject: string;
  remarks: string;

  utr_no: string | null;

  bank_account_no: string | null;
  bank_name: string | null;
  branch_name: string | null;
  ifsc_code: string | null;

  employee_code: string | null;
}

export interface VendorChargeGroup {
  enquiry_no: string;
  lr_no: string;
  lr_date: string;
  vehicle_no: string;
  charges: VendorCharge[];
}

export interface VendorIntermittentChargesResponse {
  charges_data: VendorChargeGroup[];
  total_groups: number;
}

export const getVendorIntermittentCharges =
  async (): Promise<VendorIntermittentChargesResponse> => {
    return ApiService.get<VendorIntermittentChargesResponse>(
      "/api/vendor_intermittent_charges_display",
    );
  };

export const addIntermittentCharge = async (
  payload: AddIntermittentChargePayload,
): Promise<AddIntermittentChargeResponse> => {
  const headers = await ApiService.getHeaders();

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "approval_file") {
      formData.append("approval_file", {
        uri: value.uri,
        name: value.name || "file.pdf",
        type: value.mimeType || "application/pdf",
      } as any);
    } else {
      formData.append(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/add_intermittent_charge`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};
