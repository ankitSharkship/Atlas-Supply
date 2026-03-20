import { useState } from "react";

export const useIntermittentChargeForm = () => {
  const [form, setForm] = useState<any>({
    vendor_payment_status: "Unpaid",
    payment_adjustment: "Bill to Client",
    amount_transfer_to: "Registered Vendor",
  });
  const [file, setFile] = useState<any>(null);

  const update = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const required = [
      "gr_date",
      "enquiry_no",
      "lr_no",
      "vehicle_no",
      "vendor_payment_status",
      "payment_adjustment",
      "charge_category",
      "amount_transfer_to",
      "name",
      "amount",
      "mail_subject",
    ];

    for (const f of required) {
      if (!form[f] || String(form[f]).trim() === "") return `${f.replace(/_/g, " ")} is required`;
    }

    if (!file) return "Approval file is required";

    if (form.payment_adjustment === "Bill to Client" && !form.charge_amount) {
      return "Charge amount is mandatory when payment adjustment is 'Bill to Client'";
    }

    if (form.amount_transfer_to === "Unregistered Vendor") {
      const fields = [
        "contact_no",
        "bank_name",
        "bank_account_no",
        "ifsc_code",
      ];
      for (const f of fields) {
        if (!form[f] || String(form[f]).trim() === "") return `Missing field for Unregistered Vendor: ${f.replace(/_/g, " ")}`;
      }
    }

    if (form.amount_transfer_to === "Existing Employee") {
      if (!form.employee_code || String(form.employee_code).trim() === "") return "Missing field for Existing Employee: employee code";
    }

    return null;
  };

  return {
    form,
    file,
    setFile,
    update,
    validate,
  };
};
