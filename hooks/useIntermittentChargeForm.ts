import { ApiService } from "@/lib/api-service";
import { useCallback, useState } from "react";
import {
  EnquiryDetailsResponse,
  FormErrors,
  FormState,
  Step1Form,
  Step2Form,
  Step3Form,
  Step4Form,
} from "../utils/types";

// ─── Initial State ────────────────────────────────────────────────────────────

const initialStep1: Step1Form = {
  shipmentDate: "",
  enquiryNo: "",
  grNo: "",
  vehicleNo: "",
  vendorPaymentStatus: "",
  immediatePayment: false,
};

const initialStep2: Step2Form = {
  paymentAdjustment: "",
  billToClientAmount: "",
  chargeCategory: "",
};

const initialStep3: Step3Form = {
  amountTransferTo: "",
  registeredVendorName: "",
  vendorPan: "",
  vendorGst: "",
  registeredVendorAmount: "",
  paymentVia: "",
  unregVendorName: "",
  unregContactNo: "",
  unregBankName: "",
  unregAccountNo: "",
  unregBranchName: "",
  unregIfscCode: "",
  unregAmount: "",
  unregQrFile: null,
  employeeName: "",
  employeeContact: "",
  employeeCode: "",
  employeeAmount: "",
};

const initialStep4: Step4Form = {
  approvedBy: "",
  approvalFile: null,
  mailSubject: "",
  finalRemarks: "",
};

// ─── useIntermittentChargeForm ─────────────────────────────────────────────────

export function useIntermittentChargeForm(onSuccess: () => void) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formState, setFormState] = useState<FormState>({
    step1: initialStep1,
    step2: initialStep2,
    step3: initialStep3,
    step4: initialStep4,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Field updaters ───────────────────────────────────────────────────────

  const updateStep1 = useCallback((fields: Partial<Step1Form>) => {
    setFormState((prev) => ({ ...prev, step1: { ...prev.step1, ...fields } }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fields).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const updateStep2 = useCallback((fields: Partial<Step2Form>) => {
    setFormState((prev) => ({ ...prev, step2: { ...prev.step2, ...fields } }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fields).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const updateStep3 = useCallback((fields: Partial<Step3Form>) => {
    setFormState((prev) => ({ ...prev, step3: { ...prev.step3, ...fields } }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fields).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const updateStep4 = useCallback((fields: Partial<Step4Form>) => {
    setFormState((prev) => ({ ...prev, step4: { ...prev.step4, ...fields } }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(fields).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    const { shipmentDate, enquiryNo, grNo, vehicleNo, vendorPaymentStatus } =
      formState.step1;
    if (!shipmentDate) errs.shipmentDate = "Shipment date is required";
    if (!enquiryNo.trim()) errs.enquiryNo = "Enquiry number is required";
    if (!grNo.trim()) errs.grNo = "GR number is required";
    if (!vehicleNo.trim()) errs.vehicleNo = "Vehicle number is required";
    if (!vendorPaymentStatus)
      errs.vendorPaymentStatus = "Vendor payment status is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    const { paymentAdjustment, billToClientAmount, chargeCategory } =
      formState.step2;
    if (!paymentAdjustment)
      errs.paymentAdjustment = "Payment adjustment is required";
    if (paymentAdjustment === "BILL TO CLIENT" && !billToClientAmount.trim())
      errs.billToClientAmount = "Bill to client amount is required";
    if (!chargeCategory) errs.chargeCategory = "Charge category is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: FormErrors = {};
    const s = formState.step3;
    if (!s.amountTransferTo) {
      errs.amountTransferTo = "Amount transfer to is required";
    } else if (s.amountTransferTo === "REGISTERED VENDOR") {
      if (!s.registeredVendorName.trim())
        errs.registeredVendorName = "Vendor name is required";
      if (!s.registeredVendorAmount.trim())
        errs.registeredVendorAmount = "Amount is required";
    } else if (s.amountTransferTo === "UNREGISTERED VENDOR") {
      if (!s.paymentVia) errs.paymentVia = "Payment method is required";
      if (!s.unregVendorName.trim())
        errs.unregVendorName = "Vendor name is required";
      if (!s.unregContactNo.trim())
        errs.unregContactNo = "Contact number is required";
      if (!s.unregAmount.trim()) errs.unregAmount = "Amount is required";
      if (s.paymentVia === "bank") {
        if (!s.unregBankName.trim())
          errs.unregBankName = "Bank name is required";
        if (!s.unregAccountNo.trim())
          errs.unregAccountNo = "Account number is required";
        if (!s.unregBranchName.trim())
          errs.unregBranchName = "Branch name is required";
        if (!s.unregIfscCode.trim())
          errs.unregIfscCode = "IFSC code is required";
      } else if (s.paymentVia === "qr_code") {
        if (!s.unregQrFile) errs.unregQrFile = "QR code file is required";
      }
    } else if (s.amountTransferTo === "EXISTING EMPLOYEE") {
      if (!s.employeeName.trim())
        errs.employeeName = "Employee name is required";
      if (!s.employeeContact.trim())
        errs.employeeContact = "Contact number is required";
      if (!s.employeeCode.trim())
        errs.employeeCode = "Employee code is required";
      if (!s.employeeAmount.trim()) errs.employeeAmount = "Amount is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errs: FormErrors = {};
    const { approvedBy, approvalFile, mailSubject } = formState.step4;
    const isCase2 =
      formState.step1.vendorPaymentStatus === "PAYMENT TO VENDOR" &&
      formState.step2.paymentAdjustment === "BILL TO CLIENT" &&
      parseFloat(formState.step2.billToClientAmount || "0") >
        parseFloat(formState.step3.registeredVendorAmount || "0");
    const showApprovedBy =
      formState.step3.amountTransferTo !== "EXISTING EMPLOYEE" && !isCase2;
    if (showApprovedBy && !approvedBy)
      errs.approvedBy = "Approved by is required";
    if (!approvalFile)
      errs.approvalFile = "Management approval file is required";
    if (!mailSubject.trim()) errs.mailSubject = "Mail subject is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      default:
        return true;
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((s) => Math.min(s + 1, 4));
    }
  };

  const goPrev = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const buildPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {};
    const { step1, step2, step3, step4 } = formState;

    const formatApiDate = (dateStr: string): string => {
      if (!dateStr) return dateStr;
      const parts = dateStr.trim().split(" ");
      if (parts.length !== 2) return dateStr;
      const dateParts = parts[0].split("/");
      if (dateParts.length !== 3) return dateStr;
      const [d, m, yy] = dateParts;
      const yearNum = Number(yy);
      const fullYear = yearNum < 100 ? 2000 + yearNum : yearNum;
      
      const timePart = parts[1];
      const timeWithSeconds = timePart.length === 5 ? `${timePart}:00` : timePart;
      
      return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")} ${timeWithSeconds}`;
    };

    // Step 1
    payload["gr_date"] = formatApiDate(step1.shipmentDate);
    payload["enquiry_no"] = step1.enquiryNo;
    payload["lr_no"] = step1.grNo;
    payload["vehicle_no"] = step1.vehicleNo;
    payload["vendor_payment_status"] = step1.vendorPaymentStatus;
    payload["immediate_payment"] = step1.immediatePayment;

    // Step 2
    const paymentAdjMap: Record<string, string> = {
      "BILL TO CLIENT": "Bill to Client",
      "NOT BILL TO CLIENT": "Not Bill to Client",
    };
    payload["payment_adjustment"] = paymentAdjMap[step2.paymentAdjustment] || step2.paymentAdjustment;
    
    const categoryMap: Record<string, string> = {
      "LOADING CHARGES": "Loading Charges",
      "UNLOADING CHARGES": "Unloading Charges",
      "ORIGIN DETENTION": "Detention Charges",
      "DESTINATION DETENTION": "Detention Charges",
      "EXTRA RUN/ROUTE CHARGE": "Other Charges",
      "CHALLAN(HEIGHT/WEIGHT)": "Other Charges",
      "OTHERS": "Other Charges",
    };
    payload["charge_category"] = categoryMap[step2.chargeCategory] || step2.chargeCategory;
    
    if (
      step2.paymentAdjustment === "BILL TO CLIENT" &&
      step2.billToClientAmount
    ) {
      payload["charge_amount"] = step2.billToClientAmount;
    }

    // Step 3
    const transferToMap: Record<string, string> = {
      "REGISTERED VENDOR": "Registered Vendor",
      "UNREGISTERED VENDOR": "Unregistered Vendor",
      "EXISTING EMPLOYEE": "Existing Employee",
    };
    payload["amount_transfer_to"] = transferToMap[step3.amountTransferTo] || step3.amountTransferTo;
    
    if (step3.amountTransferTo === "REGISTERED VENDOR") {
      payload["name"] = step3.registeredVendorName;
      if (step3.vendorPan) {
        payload["vendor_pan"] = step3.vendorPan;
      }
      if (step3.vendorGst) {
        payload["vendor_gst"] = step3.vendorGst;
      }
      payload["amount"] = step3.registeredVendorAmount;
    } else if (step3.amountTransferTo === "UNREGISTERED VENDOR") {
      payload["payment_via"] = step3.paymentVia;
      payload["name"] = step3.unregVendorName;
      payload["contact_no"] = step3.unregContactNo;
      payload["amount"] = step3.unregAmount;
      if (step3.paymentVia === "bank") {
        payload["bank_name"] = step3.unregBankName;
        payload["bank_account_no"] = step3.unregAccountNo;
        payload["branch_name"] = step3.unregBranchName;
        payload["ifsc_code"] = step3.unregIfscCode;
      } else if (step3.paymentVia === "qr_code" && step3.unregQrFile) {
        payload["qr_code_file"] = step3.unregQrFile;
      }
    } else if (step3.amountTransferTo === "EXISTING EMPLOYEE") {
      payload["name"] = step3.employeeName;
      payload["contact_no"] = step3.employeeContact;
      payload["employee_code"] = step3.employeeCode;
      payload["amount"] = step3.employeeAmount;
    }

    // Step 4
    const isCase2 =
      formState.step1.vendorPaymentStatus === "PAYMENT TO VENDOR" &&
      formState.step2.paymentAdjustment === "BILL TO CLIENT" &&
      parseFloat(formState.step2.billToClientAmount || "0") >
        parseFloat(formState.step3.registeredVendorAmount || "0");
    const showApprovedBy =
      formState.step3.amountTransferTo !== "EXISTING EMPLOYEE" && !isCase2;
    if (showApprovedBy) {
      payload["approved_by"] = step4.approvedBy;
    }
    if (step4.approvalFile) payload["approval_file"] = step4.approvalFile;
    payload["mail_subject"] = step4.mailSubject;
    if (step4.finalRemarks.trim()) payload["remarks"] = step4.finalRemarks;

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildPayload();
      const endpoint = "/api/add_intermittent_charge";
      
      console.log("=== SUBMITTING INTERMITTENT CHARGE ===");
      console.log("Endpoint:", endpoint);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const res = await ApiService.postFormData<any>(endpoint, payload);

      console.log("=== SUBMIT SUCCESS ===");
      console.log("Response:", res);

      // Complete wipe of the form only exactly upon successful submit
      setCurrentStep(1);
      setFormState({
        step1: initialStep1,
        step2: initialStep2,
        step3: initialStep3,
        step4: initialStep4,
      });
      setErrors({});

      onSuccess();
    } catch (e: any) {
      console.error("=== SUBMIT ERROR ===");
      console.error("Error Message:", e.message);
      console.error("Full Error:", e);
      
      setSubmitError(
        e.message || "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    formState,
    errors,
    isSubmitting,
    submitError,
    updateStep1,
    updateStep2,
    updateStep3,
    updateStep4,
    goNext,
    goPrev,
    handleSubmit,
    setErrors,
  };
}

// ─── useEnquiryLookup ──────────────────────────────────────────────────────────
const API_URL = process.env.EXPO_PUBLIC_API_URL;
export function useEnquiryLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [enquiryData, setEnquiryData] = useState<EnquiryDetailsResponse | null>(
    null,
  );
  const [lookupFailed, setLookupFailed] = useState(false);

  const lookup = useCallback(async (enquiryNo: string) => {
    if (!enquiryNo.trim()) return;

    setIsLoading(true);
    setLookupFailed(false);
    setEnquiryData(null);

    try {
      const data = await ApiService.post<EnquiryDetailsResponse>(
        "/api/get_enquiry_details",
        { enquiry_no: enquiryNo },
      );

      setEnquiryData(data);
    } catch (error) {
      console.log(error);
      setLookupFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setEnquiryData(null);
    setLookupFailed(false);
  }, []);

  return { isLoading, enquiryData, lookupFailed, lookup, reset };
}
