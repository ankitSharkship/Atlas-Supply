import Colors from "@/constants/colors";
import { ApiService } from "@/lib/api-service";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const VEHICLE_TYPES = [
  "12 Tyre", "14 Tyre", "16 Tyre", "18 Tyre", "22 Tyre",
  "17FTSXL", "18FTSXL", "19FTSXL",
  "20FTSXL", "22FTSXL", "24FTSXL", "34FTSXL",
  "22FTMXL", "24FTMXL", "32FTMXL", "34FTMXL", "40FTMXL",
  "32FTTXL", "32FTSXLHQ", "32FTSXLUHQ", "32FTMXLHQ",
  "4 TYRE(14FT)",
  "40FT HIGH BED", "40FT SEMI BED", "40FT LOW BED",
];

export default function VendorOnboardingForm() {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<any>({
    vendorName: "",
    vendorType: "",
    ownerFleet: "",
    vehicleBody: "",
    vehicleTypes: [],
    lane1: "",
    lane2: "",
    panNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    gstRegistered: "",
  });

  const [files, setFiles] = useState<any>({});
  const [dropdown, setDropdown] = useState<any>({ visible: false, field: "", options: [], title: "" });
  const [loading, setLoading] = useState(false);

  // -------- FILE PICKER --------
  const pickFile = async (key: string) => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
    });

    if (!res.canceled) {
      const file = res.assets[0];
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert("File Too Large", "File must be less than 10MB.");
        return;
      }
      setFiles((prev: any) => ({ ...prev, [key]: file }));
    }
  };

  // -------- DROPDOWN --------
  const openDropdown = (field: string, options: string[], title: string) => {
    setDropdown({ visible: true, field, options, title });
  };

  const selectOption = (value: string) => {
    setForm((prev: any) => ({ ...prev, [dropdown.field]: value }));
    setDropdown({ visible: false, field: "", options: [], title: "" });
  };

  // -------- MULTI SELECT --------
  const toggleVehicle = (type: string) => {
    setForm((prev: any) => {
      const exists = prev.vehicleTypes.includes(type);
      return {
        ...prev,
        vehicleTypes: exists
          ? prev.vehicleTypes.filter((t: string) => t !== type)
          : [...prev.vehicleTypes, type],
      };
    });
  };

  // -------- VALIDATION --------
  const validate = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!form.vendorName) return "Vendor Name is required";
    if (!form.vendorType) return "Vendor Type is required";
    if (form.vendorType === "Fleet Owner" && !form.ownerFleet)
      return "Owner Fleet count is required";
    if (!form.vehicleBody) return "Vehicle Body type is required";
    if (!form.vehicleTypes.length) return "At least one Vehicle Type is required";
    if (!form.lane1 || !form.lane2) return "Both Operating Lanes are required";

    if (!files.office) return "Office Photo is required";
    if (!files.pan) return "PAN Copy is required";
    if (!panRegex.test(form.panNumber)) return "PAN Number is invalid (e.g. ABCDE1234F)";

    if (!files.aadhar) return "Aadhar Copy is required";

    if (!form.contactName) return "Contact Name is required";
    if (!emailRegex.test(form.contactEmail)) return "Email address is invalid";
    if (form.contactPhone.length < 10) return "Phone number must be at least 10 digits";

    if (!form.gstRegistered) return "GST registration status is required";
    if (form.gstRegistered === "Yes" && !files.gst) return "GST Certificate is required";

    if (!files.cheque) return "Cancelled Cheque is required";

    return null;
  };
   const handleClose = () => {
      router.back();
    };

  // -------- SUBMIT --------
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Incomplete Form", err);
      return;
    }

    try {
      setLoading(true);

      const numbers = form.contactPhone.split(',').map((n: string) => n.trim());
      const primary_mobile_no = numbers[0];
      const rest_mobile_phones = numbers.slice(1).join(', ');

      const submissionData: any = {
        vendor_company_name: form.vendorName,
        vendor_name: form.contactName, // Mapping contact name to vendor_name
        vendor_type: form.vendorType,
        owner_fleet: form.ownerFleet,
        operating_lane_one: form.lane1,
        operating_lane_two: form.lane2,
        pan_no: form.panNumber,
        email: form.contactEmail,
        primary_mobile_no,
        mobile_phone: numbers,
        preferred_vehicle_type: form.vehicleTypes.join(', '),
        onboarding_date: new Date().toISOString().split('T')[0],
      };


      // Map files to API keys
      const fileMapping: Record<string, string> = {
        pan: "pan_upload",
        aadhar: "aadhar_card_upload",
        office: "vendor_office_photo",
        gst: "gst_upload",
        cheque: "cancelled_cheque_upload",
      };

      Object.keys(files).forEach((k) => {
        const apiField = fileMapping[k];
        if (apiField && files[k]) {
          submissionData[apiField] = {
            uri: files[k].uri,
            name: files[k].name,
            type: files[k].mimeType || "application/octet-stream",
          };
        }
      });
      console.log("Submission Data:", submissionData);
      await ApiService.postFormData("/api/create_vendor", submissionData);

      Alert.alert("Success", "Vendor submitted successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error("Submission Error:", error);
      Alert.alert("Error", error.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
         <Pressable onPress={handleClose} style={styles.backBtn}>
                  <Feather name="arrow-left" size={22} color={Colors.white} />
                </Pressable>
        
         <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Vendor Onboarding</Text>
        <Text style={styles.headerSubtitle}>Fill in all required details below</Text>
      </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── BUSINESS INFORMATION ── */}
        <SectionHeader title="Business Information" icon="briefcase" />

        <FormCard>
          <Input
            label="Vendor Name"
            required
            value={form.vendorName}
            onChange={(v: string) => setForm({ ...form, vendorName: v })}
            placeholder="Enter vendor company name"
          />

          <DropdownField
            label="Vendor Type"
            required
            value={form.vendorType}
            placeholder="Select vendor type"
            onPress={() =>
              openDropdown("vendorType", ["Broker", "Fleet Owner", "Transporter", "Driver Cum Owner"], "Vendor Type")
            }
          />

          {form.vendorType === "Fleet Owner" && (
            <Input
              label="Owner Fleet Count"
              required
              value={form.ownerFleet}
              onChange={(v: string) => setForm({ ...form, ownerFleet: v })}
              placeholder="Number of owned vehicles"
              keyboardType="number-pad"
            />
          )}

          <DropdownField
            label="Vehicle Body"
            required
            value={form.vehicleBody}
            placeholder="Select vehicle body type"
            onPress={() =>
              openDropdown("vehicleBody", ["Closed Body", "Open Body", "Trailer"], "Vehicle Body")
            }
          />
        </FormCard>

        {/* ── VEHICLE TYPES ── */}
        <SectionHeader title="Vehicle Types" icon="truck" />

        <FormCard>
          <Text style={styles.fieldLabel}>
            Select Vehicle Types <Text style={styles.required}>*</Text>
          </Text>
          {form.vehicleTypes.length > 0 && (
            <Text style={styles.selectedCount}>
              {form.vehicleTypes.length} type{form.vehicleTypes.length > 1 ? "s" : ""} selected
            </Text>
          )}
          <View style={styles.chips}>
            {VEHICLE_TYPES.map((t) => {
              const active = form.vehicleTypes.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => toggleVehicle(t)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormCard>

        {/* ── OPERATING LANES ── */}
        <SectionHeader title="Operating Lanes" icon="map-pin" />

        <FormCard>
          <Input
            label="Lane 1"
            required
            value={form.lane1}
            onChange={(v: string) => setForm({ ...form, lane1: v })}
            placeholder="e.g. Mumbai → Delhi"
          />
          <Input
            label="Lane 2"
            required
            value={form.lane2}
            onChange={(v: string) => setForm({ ...form, lane2: v })}
            placeholder="e.g. Chennai → Bangalore"
          />
        </FormCard>

        {/* ── DOCUMENTS ── */}
        <SectionHeader title="Documents" icon="file-text" />

        <FormCard>
          <FileUpload
            label="Office Photo"
            required
            file={files.office}
            onPress={() => pickFile("office")}
          />
          <FileUpload
            label="PAN Copy"
            required
            file={files.pan}
            onPress={() => pickFile("pan")}
          />
          <Input
            label="PAN Number"
            required
            value={form.panNumber}
            onChange={(v: string) => setForm({ ...form, panNumber: v.toUpperCase() })}
            placeholder="ABCDE1234F"
            autoCapitalize="characters"
            maxLength={10}
          />
          <FileUpload
            label="Aadhar Copy"
            required
            file={files.aadhar}
            onPress={() => pickFile("aadhar")}
          />
        </FormCard>

        {/* ── CONTACT INFORMATION ── */}
        <SectionHeader title="Contact Information" icon="user" />

        <FormCard>
          <Input
            label="Contact Name"
            required
            value={form.contactName}
            onChange={(v: string) => setForm({ ...form, contactName: v })}
            placeholder="Full name of primary contact"
          />
          <Input
            label="Email Address"
            required
            value={form.contactEmail}
            onChange={(v: string) => setForm({ ...form, contactEmail: v })}
            placeholder="example@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Phone Number"
            required
            value={form.contactPhone}
            onChange={(v: string) => setForm({ ...form, contactPhone: v })}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
          />
        </FormCard>

        {/* ── GST & BANKING ── */}
        <SectionHeader title="GST & Banking" icon="credit-card" />

        <FormCard>
          <DropdownField
            label="GST Registered"
            required
            value={form.gstRegistered}
            placeholder="Select registration status"
            onPress={() =>
              openDropdown("gstRegistered", ["Yes", "No"], "GST Registered?")
            }
          />
          {form.gstRegistered === "Yes" && (
            <FileUpload
              label="GST Certificate"
              required
              file={files.gst}
              onPress={() => pickFile("gst")}
            />
          )}
          <FileUpload
            label="Cancelled Cheque"
            required
            file={files.cheque}
            onPress={() => pickFile("cheque")}
          />
        </FormCard>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* SUBMIT BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* DROPDOWN MODAL */}
      <Modal
        visible={dropdown.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdown({ ...dropdown, visible: false })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdown({ ...dropdown, visible: false })}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{dropdown.title}</Text>
              <TouchableOpacity
                onPress={() => setDropdown({ ...dropdown, visible: false })}
                style={styles.modalClose}
              >
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={dropdown.options}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectOption(item)}
                  style={[
                    styles.optionRow,
                    dropdown.field in form &&
                      form[dropdown.field] === item &&
                      styles.optionRowActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      dropdown.field in form &&
                        form[dropdown.field] === item &&
                        styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {dropdown.field in form && form[dropdown.field] === item && (
                    <Feather name="check" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────── SUB-COMPONENTS ───────────────────────────

const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconBg}>
      <Feather name={icon as any} size={15} color={Colors.primary} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const FormCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  ...rest
}: any) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={Colors.textLight}
      style={[styles.textInput, rest.multiline && { height: 80, textAlignVertical: 'top' }]}
      {...rest}
    />
  </View>
);

const DropdownField = ({ label, value, onPress, placeholder, required }: any) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TouchableOpacity onPress={onPress} style={styles.dropdownTrigger} activeOpacity={0.7}>
      <Text style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>
        {value || placeholder || "Select"}
      </Text>
      <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

const FileUpload = ({ label, file, onPress, required }: any) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fileUpload, file && styles.fileUploadDone]}
      activeOpacity={0.7}
    >
      <View style={[styles.fileIconBg, file && styles.fileIconBgDone]}>
        <Feather
          name={file ? "check" : "upload"}
          size={18}
          color={file ? Colors.success : Colors.primary}
        />
      </View>
      <View style={styles.fileTextGroup}>
        <Text style={[styles.fileLabel, file && styles.fileLabelDone]}>
          {file ? "File Uploaded" : `Upload ${label}`}
        </Text>
        <Text style={styles.fileSubLabel}>
          {file ? file.name : "PDF or Image • Max 10MB"}
        </Text>
      </View>
      {!file && (
        <Feather name="chevron-right" size={16} color={Colors.textSecondary} />
      )}
    </TouchableOpacity>
  </View>
);

// ────────────────────────────── STYLES ──────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header
  header: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
    },
  
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
   backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },


  // ── Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EBF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 0.2,
  },

  // ── Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Fields
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  required: {
    color: Colors.error,
  },

  // ── Text input
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    backgroundColor: Colors.white,
  },

  // ── Dropdown
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: Colors.white,
  },
  dropdownValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  dropdownPlaceholder: {
    color: Colors.textLight,
  },

  // ── File Upload
  fileUpload: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#F5F8FF",
  },
  fileUploadDone: {
    borderColor: Colors.success,
    borderStyle: "solid",
    backgroundColor: Colors.successLight,
  },
  fileIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EBF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fileIconBgDone: {
    backgroundColor: Colors.successLight,
  },
  fileTextGroup: {
    flex: 1,
  },
  fileLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  fileLabelDone: {
    color: Colors.success,
  },
  fileSubLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // ── Vehicle type chips
  selectedCount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: -8,
    marginBottom: 2,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EBF1FF",
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Footer / Submit
  footer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "55%",
    paddingBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionRowActive: {
    backgroundColor: "#EBF1FF",
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  optionTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});


