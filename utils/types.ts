// ─── API Response Types ───────────────────────────────────────────────────────

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

export interface EnquiryDetailsResponse {
  enquiry_no: string;
  lorry_receipts: string[];
  vehicle_no: string;
}

// ─── Form State Types ─────────────────────────────────────────────────────────

export type VendorPaymentStatus =
  | 'PAYMENT TO VENDOR'
  | 'NOT PAID TO VENDOR'
  | 'VENDOR RECOVERY';

export type PaymentAdjustmentOption = 'BILL TO CLIENT' | 'NOT BILL TO CLIENT';

export type ChargeCategory =
  | 'LOADING CHARGES'
  | 'UNLOADING CHARGES'
  | 'ORIGIN DETENTION'
  | 'DESTINATION DETENTION'
  | 'EXTRA RUN/ROUTE CHARGE'
  | 'CHALLAN(HEIGHT/WEIGHT)'
  | 'OTHERS';

export type AmountTransferTo =
  | 'REGISTERED VENDOR'
  | 'UNREGISTERED VENDOR'
  | 'EXISTING EMPLOYEE';

export type PaymentVia = 'bank' | 'qr_code';

export interface Step1Form {
  shipmentDate: string;
  enquiryNo: string;
  grNo: string;
  vehicleNo: string;
  vendorPaymentStatus: VendorPaymentStatus | '';
  immediatePayment: boolean;
}

export interface Step2Form {
  paymentAdjustment: PaymentAdjustmentOption | '';
  billToClientAmount: string;
  chargeCategory: ChargeCategory | '';
}

export interface Step3Form {
  amountTransferTo: AmountTransferTo | '';
  // Registered Vendor
  registeredVendorName: string;
  registeredVendorAmount: string;
  // Unregistered Vendor
  paymentVia: PaymentVia | '';
  unregVendorName: string;
  unregContactNo: string;
  unregBankName: string;
  unregAccountNo: string;
  unregBranchName: string;
  unregIfscCode: string;
  unregAmount: string;
  unregQrFile: File | null;
  // Existing Employee
  employeeName: string;
  employeeContact: string;
  employeeCode: string;
  employeeAmount: string;
}

export interface Step4Form {
  approvedBy: string;
  approvalFile: File | null;
  mailSubject: string;
  finalRemarks: string;
}

export interface FormState {
  step1: Step1Form;
  step2: Step2Form;
  step3: Step3Form;
  step4: Step4Form;
}

export type FormErrors = Partial<Record<string, string>>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const VENDOR_PAYMENT_STATUSES: VendorPaymentStatus[] = [
  'PAYMENT TO VENDOR',
  'NOT PAID TO VENDOR',
  'VENDOR RECOVERY',
];

export const PAYMENT_ADJUSTMENT_OPTIONS: PaymentAdjustmentOption[] = [
  'BILL TO CLIENT',
  'NOT BILL TO CLIENT',
];

export const CHARGE_CATEGORIES: ChargeCategory[] = [
  'LOADING CHARGES',
  'UNLOADING CHARGES',
  'ORIGIN DETENTION',
  'DESTINATION DETENTION',
  'EXTRA RUN/ROUTE CHARGE',
  'CHALLAN(HEIGHT/WEIGHT)',
  'OTHERS',
];

export const AMOUNT_TRANSFER_OPTIONS: AmountTransferTo[] = [
  'REGISTERED VENDOR',
  'UNREGISTERED VENDOR',
  'EXISTING EMPLOYEE',
];

export const APPROVED_BY_OPTIONS: string[] = ['Ashok Jangra', 'Madan Rajput'];

export const TOTAL_STEPS = 4;
