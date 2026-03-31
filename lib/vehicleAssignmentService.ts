import { ApiService } from "./api-service";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const AUTH_STORAGE_KEY = "auth_user";

export interface VehicleAssignmentDisplayRequest {
  status_filter: string;
  zone: string[];
}

export interface VehicleAssignmentDisplayResponse {
  status_filter: string;
  total_count: number;
  vehicle_assignment_data: VehicleAssignmentList;
}
export type VehicleAssignmentList = VehicleAssignment[];

export interface VehicleAssignment {
  id: number;
  enquiry_no: string;
  enquiry_type: string;

  client_code: string;
  client_group: string;
  customer_name: string;

  consignor: string;
  consignee: string;

  from_location: string;
  to_location: string;

  client_origin_pincode: string;
  client_destination_pincode: string;

  from_location_state: string | null;
  from_location_zone: string | null;
  to_location_state: string | null;
  to_location_zone: string | null;

  city: string | null;
  state: string | null;
  pincode: string | null;

  industry_type: string;
  department: string;

  key_account_manager: string;

  vehicle_type: string;
  vehicle_number: string | null;
  vehicle_assigned: string | null;
  vehicle_weight_capacity: number | null;
  vehicle_assigned_weight_capacity: number | null;

  number_of_vehicles: number;

  vendor_name: string | null;
  vendor_rate: number | null;

  target_rate: number | null;
  final_rate: number | null;
  total_amount: number;

  advance_amount: number | null;

  material_weight: number;
  min_weight_guarantee: number;
  weight_unit: string;

  material_dimensions: MaterialDimensions;
  material_dimensions_unit: string;

  rate_type: string | null;
  rate_uom_type: string;

  remarks: string;

  created_by: string;
  created_on: string;
  updated_by: string | null;
  updated_at: string | null;

  order_date: string;
  required_on_date: string;
  order_number: string;

  status: string;

  loading_points: any[];
  unloading_points: any[];

  loading_points_count: number;
  unloading_points_count: number;

  loading_point_charges: any[];
  unloading_point_charges: any[];

  lr_assigned: string[];

  no_of_lr_requested: number;

  driver_mobile_no: string | null;

  distance_info: DistanceInfo;
}

export interface MaterialDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
}

// export interface DistanceInfo {
//   api_used: string;
//   route_type: string;

//   distance_km: number;
//   distance_miles: number;
//   distance_text: string;

//   duration_hours: number;
//   duration_minutes: number;
//   duration_text: string;

//   duration_in_traffic_minutes: number | null;
//   duration_in_traffic_text: string;

//   from_coordinates: Coordinates;
//   to_coordinates: Coordinates;
// }

export interface DistanceInfo {
  api_used: string;
  route_type: string;

  distance_km: number;
  distance_miles: number;
  distance_text: string;

  duration_hours: number;
  duration_minutes: number;
  duration_text: string;

  duration_in_traffic_minutes: number | null;
  duration_in_traffic_text: string;

  from_coordinates: Coordinates;
  to_coordinates: Coordinates;
}
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface VendorsLookupResponse {
  data: VendorsLookupData;
  message: string;
  success: boolean;
}

export interface VendorsLookupData {
  query: string;
  total: number;
  vendors: Vendor[];
}

export interface Vendor {
  id: number;
  value: number;
  label: string;

  vendor_code: string;
  vendor_company_name: string;
  vendor_name: string | null;

  pan_no: string;
  vendor_gst: string | null;

  primary_mobile_no: string;

  advance_percentage: number | null;

  is_active: boolean;
  disabled: boolean;
}

export interface VehicleTypesLookupResponse {
  data: VehicleTypesLookupData;
  message: string;
  success: boolean;
}

export interface VehicleTypesLookupData {
  query: string;
  total: number;
  vehicle_types: VehicleType[];
}

export interface VehicleType {
  id: number;

  value: string;
  label: string;
  display_text: string;

  vehicle_code: string;
  vehicle_name: string;
  vehicle_tonnage: string;

  body_type: "OPEN_BODY" | "CLOSE_BODY" | string;

  is_active: boolean;
  disabled: boolean;
}

export interface UpdateVehicleAssignmentRequest {
  enquiry_no: string;

  advance_amount: number;

  driver_mobile_no: string;

  vehicle_number: string;

  vehicle_assigned?: string;

  customer_name?: string;

  vendor_name?: string;

  vendor_contact?: string;

  final_rate?: number;

  is_new_vendor?: boolean;

  min_weight_guarantee?: number;

  rate_uom_type?: "FTL" | "PMT";

  vendor_rate?: number;
}

export interface UpdateVehicleAssignmentSuccessResponse {
  message: string;
}

export interface UpdateVehicleAssignmentErrorResponse {
  error: string;
}

export type UpdateVehicleAssignmentResponse =
  | UpdateVehicleAssignmentSuccessResponse
  | UpdateVehicleAssignmentErrorResponse;

export interface VerifyVehicleRequest {
  vehiclenumber: string;
  force_failure?: boolean;
}

export interface VerifyVehicleSuccessResponse {
  status: "verified";
  vehicle_number: string;

  owner_name: string;
  registration_date: string;
  vehicle_class: string;
  fuel_type: string;

  maker_model: string;

  fitness_upto: string;
  insurance_upto: string;

  rc_status: string;

  api_used: string;
  verification_source: string;
}

export interface VerifyVehicleNotFoundResponse {
  status: "not_found";
  vehicle_number: string;

  message: string;

  verification_timestamp: string;

  api_used: string;
  verification_source: string;
}

export interface VerifyVehicleErrorResponse {
  status?: "error";

  vehicle_number?: string;

  message?: string;

  error?: string;
  error_type?: string;
  error_details?: string;

  timestamp?: string;

  api_used?: string;
  verification_source?: string;
}

export type VerifyVehicleResponse =
  | VerifyVehicleSuccessResponse
  | VerifyVehicleNotFoundResponse
  | VerifyVehicleErrorResponse;

export const getVehicleAssignmentDisplay = async (
  zone: string[] = [],
): Promise<VehicleAssignmentDisplayResponse> => {
  return ApiService.post<VehicleAssignmentDisplayResponse>(
    "/api/vehicle_assignment_display",
    {
      zone: zone,
      status_filter: "pending",
    },
  );
};

export const getVendorsLookup = async (
  q: string = "",
  limit: number = 50,
): Promise<VendorsLookupResponse> => {
  return ApiService.get<VendorsLookupResponse>("/api/vendors_lookup", {
    q,
    limit: 50,
  });
};

export const getVehicleTypesLookup = async (
  limit: number = 200,
): Promise<VehicleTypesLookupResponse> => {
  return ApiService.get<VehicleTypesLookupResponse>(
    "/api/vehicle_types_lookup",
    { limit },
  );
};

export const updateVehicleAssignment = async (
  payload: UpdateVehicleAssignmentRequest,
): Promise<UpdateVehicleAssignmentResponse> => {
  return ApiService.post<UpdateVehicleAssignmentResponse>(
    "/api/update_vehicle_assignment",
    payload,
  );
};

export const verifyVehicleApi = async (
  payload: VerifyVehicleRequest,
): Promise<VerifyVehicleResponse> => {
  return ApiService.post<VerifyVehicleResponse>(
    "/api/ulip/vehicle/verify/test",
    payload,
  );
};
