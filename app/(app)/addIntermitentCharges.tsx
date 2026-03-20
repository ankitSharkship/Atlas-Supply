import { Colors } from "@/constants/colors";
import { useIntermittentChargeForm } from "@/hooks/useIntermittentChargeForm";
import { useVendorSearch } from "@/hooks/useVendorSearch";
import { addIntermittentCharge } from "@/lib/intermittent-service";

import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";

import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddIntermittentChargeScreen() {
  const insets = useSafeAreaInsets();

  const { form, file, setFile, update, validate } = useIntermittentChargeForm();

  const {
    query,
    setQuery,
    vendors,
    loading: vendorLoading,
  } = useVendorSearch();

  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [showCal, setShowCal] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  /* ✅ SAFE INITIAL VALUES */
  useEffect(() => {
    if (!form.vendor_payment_status) update("vendor_payment_status", "Unpaid");

    if (!form.payment_adjustment)
      update("payment_adjustment", "Bill to Client");

    if (!form.amount_transfer_to)
      update("amount_transfer_to", "Registered Vendor");
  }, []);

  const handleDateSelect = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    update("gr_date", `${yyyy}-${mm}-${dd}`);
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
    });

    if (!res.canceled) setFile(res.assets[0]);
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) return Alert.alert("Validation Error", error);

    try {
      setLoading(true);

      await addIntermittentCharge({
        ...form,
        approval_file: file,
      });

      Alert.alert("Success", "Charge added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="white" />
        </Pressable>

        <View>
          <Text style={styles.headerTitle}>Record New Charge</Text>
          <Text style={styles.headerSubtitle}>Provide shipment details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* BASIC */}
        <Card title="Basic Details">
          <Field label="GR Date" required>
            <Pressable
              style={styles.dropdownTrigger}
              onPress={() => setShowCal(true)}
            >
              <Text
                style={form.gr_date ? styles.dropdownText : styles.placeholder}
              >
                {form.gr_date || "e.g. 2024-01-15"}
              </Text>
              <Feather name="calendar" size={18} color={Colors.textSecondary} />
            </Pressable>
          </Field>

          <Field label="Enquiry No" required>
            <TextInput
              style={styles.input}
              value={form.enquiry_no || ""}
              onChangeText={(v) => update("enquiry_no", v)}
            />
          </Field>

          <Field label="LR No" required>
            <TextInput
              style={styles.input}
              value={form.lr_no || ""}
              onChangeText={(v) => update("lr_no", v)}
            />
          </Field>

          <Field label="Vehicle No" required>
            <TextInput
              style={styles.input}
              value={form.vehicle_no || ""}
              onChangeText={(v) => update("vehicle_no", v.toUpperCase())}
            />
          </Field>
        </Card>

        {/* PAYMENT */}
        <Card title="Charge Details">
          <Field label="Vendor Payment Status" required>
            <Segment
              value={form.vendor_payment_status}
              onChange={(v: any) => update("vendor_payment_status", v)}
              options={["Paid", "Unpaid"]}
            />
          </Field>

          <Field label="Payment Adjustment" required>
            <Segment
              value={form.payment_adjustment}
              onChange={(v: any) => update("payment_adjustment", v)}
              options={["Bill to Client", "NOT BILL TO CLIENT"]}
            />
          </Field>

          <Field label="Charge Category" required>
            <Pressable
              style={styles.dropdownTrigger}
              onPress={() => setShowCategoryDropdown(true)}
            >
              <Text
                style={
                  form.charge_category
                    ? styles.dropdownText
                    : styles.placeholder
                }
              >
                {form.charge_category || "Select category..."}
              </Text>
              <Feather
                name="chevron-down"
                size={18}
                color={Colors.textSecondary}
              />
            </Pressable>
          </Field>

          {form.payment_adjustment === "Bill to Client" && (
             <View style={styles.highlightBox}>
              <Field label="Charge Amount" required>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.charge_amount ? String(form.charge_amount) : ""}
                  onChangeText={(v) => update("charge_amount", Number(v))}
                />
              </Field>
            </View>
          )}
        </Card>

        {/* TRANSFER */}
        <Card title="Transfer Details">
          <Field label="Transfer To" required>
            <Segment
              value={form.amount_transfer_to}
              onChange={(v: any) => update("amount_transfer_to", v)}
              options={[
                "Registered Vendor",
                "Unregistered Vendor",
                "Existing Employee",
              ]}
            />
          </Field>

          {form.amount_transfer_to === "Registered Vendor" && (
            <Field label="Select registered vendor" required>
              <Pressable
                style={styles.dropdownTrigger}
                onPress={() => setShowVendorDropdown(true)}
              >
                <Text
                  style={
                    selectedVendor ? styles.dropdownText : styles.placeholder
                  }
                >
                  {selectedVendor
                    ? selectedVendor.vendor_company_name
                    : "Select registered vendor"}
                </Text>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </Field>
          )}

          {form.amount_transfer_to === "Unregistered Vendor" && (
            <View style={styles.yellowBox}>
              <Field label="Vendor Name" required>
                <TextInput
                  style={styles.input}
                  value={form.name || ""}
                  onChangeText={(v) => update("name", v)}
                />
              </Field>

              <Field label="Contact No" required>
                <TextInput
                  style={styles.input}
                  value={form.contact_no || ""}
                  onChangeText={(v) => update("contact_no", v)}
                />
              </Field>

              <Field label="Bank Name" required>
                <TextInput
                  style={styles.input}
                  value={form.bank_name || ""}
                  onChangeText={(v) => update("bank_name", v)}
                />
              </Field>

              <Field label="Account No" required>
                <TextInput
                  style={styles.input}
                  value={form.bank_account_no || ""}
                  onChangeText={(v) => update("bank_account_no", v)}
                />
              </Field>

              <Field label="IFSC" required>
                <TextInput
                  style={styles.input}
                  value={form.ifsc_code || ""}
                  onChangeText={(v) => update("ifsc_code", v)}
                />
              </Field>
            </View>
          )}

          {form.amount_transfer_to === "Existing Employee" && (
            <View style={styles.blueBox}>
              <Field label="Employee Code" required>
                <TextInput
                  style={styles.input}
                  value={form.employee_code || ""}
                  onChangeText={(v) => update("employee_code", v)}
                />
              </Field>
            </View>
          )}

          {(form.amount_transfer_to !== "Registered Vendor" && 
            form.amount_transfer_to !== "Unregistered Vendor") && (
            <Field label="Name" required>
              <TextInput
                style={styles.input}
                value={form.name || ""}
                onChangeText={(v) => update("name", v)}
              />
            </Field>
          )}

          <Field label="Amount" required>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={form.amount ? String(form.amount) : ""}
              onChangeText={(v) => update("amount", Number(v))}
            />
          </Field>
        </Card>

        {/* UPLOAD */}
        <Card title="Upload Approval">
          <Pressable style={styles.uploadBox} onPress={pickFile}>
            <Feather name="upload" size={24} />
            <Text>Click to upload</Text>
          </Pressable>

          {!file && <Text style={{ color: "red" }}>Required</Text>}
          {file && <Text>{file.name}</Text>}
        </Card>

        {/* EXTRAS */}
        <Card title="Extras & Approval">
          <Field label="Mail Subject" required>
            <TextInput
              style={styles.input}
              value={form.mail_subject || ""}
              onChangeText={(v) => update("mail_subject", v)}
            />
          </Field>

          <Field label="Approved By">
            <TextInput
              style={styles.input}
              value={form.approved_by || ""}
              onChangeText={(v) => update("approved_by", v)}
            />
          </Field>

          <Field label="Remarks">
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              multiline
              value={form.remarks || ""}
              onChangeText={(v) => update("remarks", v)}
            />
          </Field>
        </Card>
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? "Submitting..." : "Submit"}
          </Text>
        </Pressable>
      </View>

      {/* MODALS */}
      <CalendarModal
        visible={showCal}
        selectedDate={
          form.gr_date ? new Date(form.gr_date) : null
        }
        onSelect={handleDateSelect}
        onClose={() => setShowCal(false)}
      />

      <DropdownModal
        visible={showCategoryDropdown}
        title="Charge Category"
        options={[
          { label: "LOADING CHARGES", value: "LOADING CHARGES" },
          { label: "UNLOADING CHARGES", value: "UNLOADING CHARGES" },
          { label: "ORIGIN DETENTION", value: "ORIGIN DETENTION" },
          { label: "DESTINATION DETENTION", value: "DESTINATION DETENTION" },
          { label: "EXTRA RUN/ROUTE CHARGE", value: "EXTRA RUN/ROUTE CHARGE" },
          { label: "CHALLAN(HEIGHT/WEIGHT)", value: "CHALLAN(HEIGHT/WEIGHT)" },
          { label: "OTHERS", value: "OTHERS" },
        ]}
        onSelect={(v: any) => update("charge_category", v.value)}
        onClose={() => setShowCategoryDropdown(false)}
      />

      <DropdownModal
        visible={showVendorDropdown}
        title="Select Registered Vendor"
        searchable
        searchQuery={query}
        onSearchChange={setQuery}
        loading={vendorLoading}
        options={vendors.map((v: any) => ({
          label: v.vendor_company_name,
          value: v,
        }))}
        onSelect={(selected: any) => {
          setSelectedVendor(selected.value);
          update("name", selected.value.vendor_company_name);
        }}
        onClose={() => setShowVendorDropdown(false)}
      />
    </View>
  );
}

const Card = ({ title, children }: any) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const Field = ({ label, required, children }: any) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>
      {label} {required && <Text style={{ color: "red" }}>*</Text>}
    </Text>
    {children}
  </View>
);

const Segment = ({ options, value, onChange }: any) => (
  <View style={styles.segmentRow}>
    {options.map((opt: string) => (
      <Pressable
        key={opt}
        style={[styles.segment, value === opt && styles.segmentActive]}
        onPress={() => onChange(opt)}
      >
        <Text
          style={value === opt ? styles.segmentTextActive : styles.segmentText}
        >
          {opt}
        </Text>
      </Pressable>
    ))}
  </View>
);

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function CalendarModal({
  visible,
  selectedDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  
  // Update view when selectedDate changes so we see the correct month
  useEffect(() => {
    if (selectedDate && visible) {
      setViewDate(selectedDate);
    }
  }, [selectedDate, visible]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable style={mStyles.calCard} onPress={() => {}}>
          <View style={mStyles.calHeader}>
            <Pressable
              onPress={() => setViewDate(new Date(year, month - 1, 1))}
              style={mStyles.calNav}
            >
              <Feather name="chevron-left" size={20} color={Colors.text} />
            </Pressable>
            <Text style={mStyles.calTitle}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable
              onPress={() => setViewDate(new Date(year, month + 1, 1))}
              style={mStyles.calNav}
            >
              <Feather name="chevron-right" size={20} color={Colors.text} />
            </Pressable>
          </View>
          <View style={mStyles.calDayRow}>
            {DAYS.map((d) => (
              <Text key={d} style={mStyles.calDayLabel}>
                {d}
              </Text>
            ))}
          </View>
          <View style={mStyles.calGrid}>
            {cells.map((day, i) => {
              const isSelected =
                selectedDate &&
                day === selectedDate.getDate() &&
                month === selectedDate.getMonth() &&
                year === selectedDate.getFullYear();
              const isToday =
                day &&
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <Pressable
                  key={i}
                  style={[
                    mStyles.calCell,
                    day && isSelected ? mStyles.calCellSelected : undefined,
                    day && isToday && !isSelected
                      ? mStyles.calCellToday
                      : undefined,
                  ]}
                  onPress={() => {
                    if (day) {
                      onSelect(new Date(year, month, day));
                      onClose();
                    }
                  }}
                  disabled={!day}
                >
                  {day ? (
                    <Text
                      style={[
                        mStyles.calCellText,
                        isSelected ? mStyles.calCellTextSel : undefined,
                        isToday && !isSelected
                          ? { color: Colors.primary }
                          : undefined,
                      ]}
                    >
                      {day}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DropdownModal({
  visible,
  options,
  onSelect,
  onClose,
  title,
  searchable,
  searchQuery,
  onSearchChange,
  loading,
}: any) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable style={mStyles.calCard} onPress={() => {}}>
          <Text style={[mStyles.calTitle, { marginBottom: 16 }]}>{title}</Text>
          
          {searchable && (
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
            />
          )}
          
          {loading && (
            <Text style={{ marginBottom: 10, color: Colors.textSecondary }}>
              Loading...
            </Text>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 340 }}
            keyboardShouldPersistTaps="handled"
          >
            {options.map((opt: any, index: number) => {
              const label = typeof opt === "string" ? opt : opt.label;
              return (
                <Pressable
                  key={index}
                  style={mStyles.dropdownItem}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                >
                  <Text style={mStyles.dropdownItemText}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  cardTitle: {},
  label: {},
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    flexDirection: "row",
    gap: 10,
  },

  headerTitle: { color: "white", fontSize: 18, fontWeight: "600" },
  headerSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12 },

  content: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  subCard: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  highlightBox: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 10,
  },

  yellowBox: {
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },

  blueBox: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },

  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  dropdownTrigger: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: Colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    fontSize: 14,
    color: Colors.text,
  },

  placeholder: {
    fontSize: 14,
    color: Colors.textLight,
  },

  segmentRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  segment: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    borderRadius: 8,
  },

  segmentActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EEF2FF",
  },

  segmentText: { fontSize: 13 },
  segmentTextActive: { color: Colors.primary },

  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#EF4444",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },

  uploadText: { marginTop: 6 },
  uploadSub: { fontSize: 12, color: Colors.textSecondary },

  error: { color: "red", marginTop: 6 },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },

  submitBtn: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },

  submitText: { color: "white", fontWeight: "600" },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  calCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  calNav: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  calTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  calDayRow: { flexDirection: "row", marginBottom: 8 },
  calDayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  calCellSelected: { backgroundColor: Colors.primary },
  calCellToday: { backgroundColor: Colors.background },
  calCellText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  calCellTextSel: { color: Colors.white, fontFamily: "Inter_600SemiBold" },
  dropdownItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: "Inter_500Medium",
  },
});
