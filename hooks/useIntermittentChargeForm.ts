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
    const showApprovedBy =
      formState.step3.amountTransferTo !== "EXISTING EMPLOYEE";
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

  const buildFormData = (): FormData => {
    const fd = new FormData();
    const { step1, step2, step3, step4 } = formState;

    // Step 1
    fd.append("gr_date", step1.shipmentDate);
    fd.append("enquiry_no", step1.enquiryNo);
    fd.append("lr_no", step1.grNo);
    fd.append("vehicle_no", step1.vehicleNo);
    fd.append("vendor_payment_status", step1.vendorPaymentStatus);
    fd.append("immediate_payment", String(step1.immediatePayment));

    // Step 2
    fd.append("payment_adjustment", step2.paymentAdjustment);
    fd.append("charge_category", step2.chargeCategory);
    if (
      step2.paymentAdjustment === "BILL TO CLIENT" &&
      step2.billToClientAmount
    ) {
      fd.append("charge_amount", step2.billToClientAmount);
    }

    // Step 3
    fd.append("amount_transfer_to", step3.amountTransferTo);
    if (step3.amountTransferTo === "REGISTERED VENDOR") {
      fd.append("name", step3.registeredVendorName);
      fd.append("amount", step3.registeredVendorAmount);
    } else if (step3.amountTransferTo === "UNREGISTERED VENDOR") {
      fd.append("payment_via", step3.paymentVia);
      fd.append("name", step3.unregVendorName);
      fd.append("contact_no", step3.unregContactNo);
      fd.append("amount", step3.unregAmount);
      if (step3.paymentVia === "bank") {
        fd.append("bank_name", step3.unregBankName);
        fd.append("bank_account_no", step3.unregAccountNo);
        fd.append("branch_name", step3.unregBranchName);
        fd.append("ifsc_code", step3.unregIfscCode);
      } else if (step3.paymentVia === "qr_code" && step3.unregQrFile) {
        fd.append("qr_code_file", step3.unregQrFile);
      }
    } else if (step3.amountTransferTo === "EXISTING EMPLOYEE") {
      fd.append("name", step3.employeeName);
      fd.append("contact_no", step3.employeeContact);
      fd.append("employee_code", step3.employeeCode);
      fd.append("amount", step3.employeeAmount);
    }

    // Step 4
    if (step3.amountTransferTo !== "EXISTING EMPLOYEE") {
      fd.append("approved_by", step4.approvedBy);
    }
    if (step4.approvalFile) fd.append("approval_file", step4.approvalFile);
    fd.append("mail_subject", step4.mailSubject);
    if (step4.finalRemarks.trim()) fd.append("remarks", step4.finalRemarks);

    return fd;
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const fd = buildFormData();
      const res = await fetch("/api/add_intermittent_charge", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || "Something went wrong. Please try again.");
        return;
      }
      onSuccess();
    } catch {
      setSubmitError(
        "Network error. Please check your connection and try again.",
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
