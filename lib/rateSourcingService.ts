import { ApiService } from "./api-service";

export interface DistanceInfo {
  api_used: string;
  distance_km: number;
  distance_miles: number;
  distance_text: string;
  duration_hours: number;
  duration_in_traffic_minutes: number | null;
  duration_in_traffic_text: string;
  duration_minutes: number;
  duration_text: string;
  from_coordinates: {
    lat: number;
    lng: number;
  };
  route_type: string;
  to_coordinates: {
    lat: number;
    lng: number;
  };
}

export interface MaterialDimensions {
  height: number | null;
  length: number | null;
  width: number | null;
}

export interface RateSourcingItem {
  created_by: string;
  created_on: string;
  customer_name: string;
  distance_info: DistanceInfo | null;
  enquiry_no: string;
  enquiry_type: string;
  from_location: string;
  industry_type: string;
  key_account_manager: string;
  l1_rate: number | null;
  l1_vendor_name: string | null;
  l2_rate: number | null;
  l2_vendor_name: string | null;
  l3_rate: number | null;
  l3_vendor_name: string | null;
  material_dimensions: MaterialDimensions;
  material_dimensions_unit: string;
  material_weight: number;
  min_weight_guarantee: number | null;
  order_date: string | null;
  order_number: string;
  rate_sourcing_status: string | null;
  rate_uom_type: string;
  remarks: string;
  required_on_date: string;
  status: string;
  target_rate: string | null;
  to_location: string;
  vehicle_type: string;
  vehicle_weight_capacity: number | null;
  weight_unit: string;
  pending_since: string;
  ageing: string;
}

export interface RateSourcingDisplayResponse {
  rate_sourcing_data: RateSourcingItem[];
  status_filter: string;
  total_count: number;
}

export interface RateSourcingDisplayRequest {
  zone: string[];
  status_filter: string;
}

export interface InsertOrUpdateRateSourcingRequest {
  enquiry_no: string;
  l1_rate: number | null;
  l1_vendor_name: string | null;
  l2_rate: number | null;
  l2_vendor_name: string | null;
  l3_rate: number | null;
  l3_vendor_name: string | null;
}

export interface InsertOrUpdateRateSourcingResponse {
  message: string;
}

export interface VendorLookupItem {
  id?: string;
  vendor_id?: string;
  vendor_name?: string;
  company_name?: string;
  vendor_company_name?: string;
  primary_mobile_no?: string;
}

export interface VendorsLookupResponse {
  data: {
    vendors: VendorLookupItem[];
  };
  status: string;
}

export const getRateSourcingDisplay = async (
  zone: string[] = [],
): Promise<RateSourcingDisplayResponse> => {
  return ApiService.post<RateSourcingDisplayResponse>(
    "/api/rate_sourcing_display",
    {
      zone,
      status_filter: "pending",
    },
  );
};

export const insertOrUpdateRateSourcing = async (
  payload: InsertOrUpdateRateSourcingRequest,
): Promise<InsertOrUpdateRateSourcingResponse> => {
  return ApiService.post<InsertOrUpdateRateSourcingResponse>(
    "/api/insert_or_update_rate_sourcing",
    payload,
  );
};

export const getVendorsLookupPost = async (
  q: string = "",
  limit: number = 50,
): Promise<VendorsLookupResponse> => {
  return ApiService.get<VendorsLookupResponse>("/api/vendors_lookup", {
    q,
    limit
  });
};
