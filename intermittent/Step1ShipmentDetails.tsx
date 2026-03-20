import { DateTimePickerModal } from "@/components/dateTimeModel";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEnquiryLookup } from "../hooks/useIntermittentChargeForm";
import {
  FormErrors,
  Step1Form,
  VENDOR_PAYMENT_STATUSES,
  VendorPaymentStatus,
} from "../utils/types";
import {
  FormField,
  NavButtons,
  SectionCard,
  SelectDropdown,
  StyledInput,
  colors,
} from "./SharedComponents";

interface Props {
  form: Step1Form;
  errors: FormErrors;
  onChange: (fields: Partial<Step1Form>) => void;
  onCancel: () => void;
  onNext: () => void;
}

export const Step1ShipmentDetails: React.FC<Props> = ({
  form,
  errors,
  onChange,
  onCancel,
  onNext,
}) => {
  const { isLoading, enquiryData, lookupFailed, lookup, reset } =
    useEnquiryLookup();
  const [enquirySearched, setEnquirySearched] = useState(false);
  // const [dateTime, setDateTime] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  // Auto-fill when enquiry data is successfully fetched
  useEffect(() => {
    if (enquiryData) {
      onChange({
        grNo:
          enquiryData.lorry_receipts?.length > 0
            ? enquiryData.lorry_receipts[0]
            : "",
        vehicleNo: enquiryData.vehicle_no || "",
      });
    }
  }, [enquiryData]);

  // When enquiry no changes, clear the lookup or fetch if length >= 10
  const handleEnquiryChange = async (val: string) => {
    onChange({ enquiryNo: val, grNo: "", vehicleNo: "" });

    if (val.trim().length >= 10) {
      setEnquirySearched(true);
      await lookup(val.trim());
    } else {
      reset();
      setEnquirySearched(false);
    }
  };

  // LR (GR) dropdown options derived from enquiryData
  const lrOptions = enquiryData
    ? enquiryData.lorry_receipts.map((lr) => ({ label: lr, value: lr }))
    : [];

  const handleDateSelect = (dateTime: Date) => {
    const dd = String(dateTime.getDate()).padStart(2, "0");
    const mm = String(dateTime.getMonth() + 1).padStart(2, "0");
    const yy = String(dateTime.getFullYear()).slice(-2);
    const hh = String(dateTime.getHours()).padStart(2, "0");
    const min = String(dateTime.getMinutes()).padStart(2, "0");
    
    onChange({
      shipmentDate: `${dd}/${mm}/${yy} ${hh}:${min}`,
    });
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(" ");
    if (parts.length !== 2) return null;
    
    const [datePart, timePart] = parts;
    const dateParts = datePart.split("/");
    if (dateParts.length !== 3) return null;
    
    const timeParts = timePart.split(":");
    if (timeParts.length !== 2) return null;
    
    const [d, m, yy] = dateParts.map(Number);
    const [h, min] = timeParts.map(Number);
    
    if (isNaN(d) || isNaN(m) || isNaN(yy) || isNaN(h) || isNaN(min)) return null;
    
    const fullYear = yy < 100 ? 2000 + yy : yy;
    
    const parsed = new Date(fullYear, m - 1, d, h, min);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  };

  // When LR is selected, auto-fill vehicle (vehicle_no is same for whole enquiry)
  const handleLrSelect = (lr: string) => {
    onChange({
      grNo: lr,
      vehicleNo: enquiryData?.vehicle_no ?? form.vehicleNo,
    });
  };

  const manualMode = lookupFailed || !enquirySearched;
  const showLrDropdown = enquiryData && enquiryData.lorry_receipts.length > 0;

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <FormField label="Shipment Date" required error={errors.shipmentDate}>
            <TextInput
              placeholder="dd/mm/yyyy"
              onPress={() => {
                setOpen(true);
              }}
              value={form.shipmentDate || ""}
            />
          </FormField>
        </View>
        <View style={styles.col}>
          {/* Enquiry Number (auto-searches at length >= 10) */}
          <FormField label="Enquiry Number" required error={errors.enquiryNo}>
            <View style={styles.searchRow}>
              <StyledInput
                value={form.enquiryNo}
                onChangeText={handleEnquiryChange}
                placeholder="ENQ-000000"
                error={!!errors.enquiryNo}
                autoCapitalize="characters"
                style={{ flex: 1 }}
              />
              {isLoading && (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              )}
            </View>
          </FormField>
        </View>
      </View>

      {/* API failure notice */}
      {lookupFailed && (
        <SectionCard variant="yellow" style={styles.warnCard}>
          <Text style={styles.warnText}>
            ⚠️ Could not find enquiry data. Please enter the details manually.
          </Text>
        </SectionCard>
      )}

      {/* Row 2 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <FormField label="GR Number" required error={errors.grNo}>
            {showLrDropdown ? (
              <SelectDropdown
                options={lrOptions}
                value={form.grNo}
                onChange={handleLrSelect}
                placeholder="Select LR / GR number"
                error={!!errors.grNo}
              />
            ) : (
              <StyledInput
                value={form.grNo}
                onChangeText={(v) => onChange({ grNo: v })}
                placeholder="GR-000000"
                error={!!errors.grNo}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            )}
          </FormField>
        </View>
        <View style={styles.col}>
          <FormField label="Vehicle Number" required error={errors.vehicleNo}>
            <StyledInput
              value={form.vehicleNo}
              onChangeText={(v) => onChange({ vehicleNo: v })}
              placeholder="UP-16-AX-0000"
              error={!!errors.vehicleNo}
              autoCapitalize="characters"
              // auto-filled when LR selected from dropdown
              editable={!showLrDropdown}
            />
          </FormField>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Vendor Payment Status */}
      <FormField
        label="Vendor Payment Status"
        required
        error={errors.vendorPaymentStatus}
      >
        <SelectDropdown<VendorPaymentStatus>
          options={VENDOR_PAYMENT_STATUSES.map((v) => ({ label: v, value: v }))}
          value={form.vendorPaymentStatus}
          onChange={(v) => onChange({ vendorPaymentStatus: v })}
          placeholder="Choose status..."
          error={!!errors.vendorPaymentStatus}
        />
      </FormField>

      {/* Immediate Payment toggle — only for PAYMENT TO VENDOR */}
      {form.vendorPaymentStatus === "PAYMENT TO VENDOR" && (
        <FormField label="Payment Timing">
          <View style={styles.paymentTimingRow}>
            {(["Immediate Payment", "Add to Balance"] as const).map((opt) => {
              const isImmediate = opt === "Immediate Payment";
              const isActive = form.immediatePayment === isImmediate;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.paymentOption,
                    isActive && styles.paymentOptionActive,
                  ]}
                  onPress={() => onChange({ immediatePayment: isImmediate })}
                >
                  <View style={[styles.radio, isActive && styles.radioActive]}>
                    {isActive && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.paymentOptionText,
                      isActive && styles.paymentOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormField>
      )}

      <NavButtons onCancel={onCancel} onNext={onNext} showPrev={false} />
      <DateTimePickerModal
        visible={open}
        selectedDateTime={form.shipmentDate ? parseDateString(form.shipmentDate) : new Date()}
        onSelect={handleDateSelect}
        onClose={() => setOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24 },
  row: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 16 },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  loaderContainer: {
    padding: 8,
    justifyContent: "center",
  },
  warnCard: { marginBottom: 12 },
  warnText: { fontSize: 13, color: "#92400E" },
  paymentTimingRow: { flexDirection: "row", gap: 12 },
  paymentOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  paymentOptionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  paymentOptionTextActive: { color: colors.primary, fontWeight: "600" },
});
