
import VehicleTypeSheet from "@/components/VehicleAssignment/vehicleTypeSheet";
import VendorPickerSheet from "@/components/VehicleAssignment/vendorPickupSheet";
import { Colors } from "@/constants/colors";
import {
  updateVehicleAssignment,
  VehicleAssignment,
  Vendor,
  verifyVehicleApi,
  VerifyVehicleSuccessResponse,
} from "@/lib/vehicleAssignmentService";
import { Feather } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DetailItem = ({ label, value, isWarning }: { label: string; value: string; isWarning?: boolean }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, isWarning && styles.warningValue]}>
      {value || "N/A"}
    </Text>
  </View>
);

export default function VehicleAssignmentScreen() {
 const params = useLocalSearchParams();

const item: VehicleAssignment | null =
  typeof params.item === "string"
    ? JSON.parse(params.item)
    : null; 
  const handleClose = () => {
    router.back();
  };
  const insets = useSafeAreaInsets();

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vehicleAssigned, setVehicleAssigned] = useState(item?.vehicle_type);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [isFTL, setIsFTL] = useState(true);
  const [finalVendorRate, setFinalVendorRate] = useState(0);
  const [rateType, setRateType] = useState<"FTL" | "PMT">("FTL");
  const [vendorRate, setVendorRate] = useState("");
  const [vendorMG, setVendorMG] = useState(
    String(item?.min_weight_guarantee ?? "")
  );
const vendorSheetRef = useRef<BottomSheet>(null);
const vehicleTypeSheetRef = useRef<BottomSheet>(null);

const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

const [vehicleVerificationStatus, setVehicleVerificationStatus] =
  useState<"idle" | "verifying" | "verified" | "failed">("idle");

const [verificationDetails, setVerificationDetails] =
  useState<VerifyVehicleSuccessResponse | null>(null);

const [manualVehicleVerified, setManualVehicleVerified] = useState(false);
const [detailsModalVisible, setDetailsModalVisible] = useState(false);
const [expiryAlerts, setExpiryAlerts] = useState<string[]>([]);

 const isValidIndianMobile = (mobile: string): boolean => {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(mobile);
};
const parseVahanDate = (dateStr: string) => {
  if (!dateStr) return null;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return new Date(dateStr);
  return new Date(year, month, day);
};

const isExpiringSoon = (dateStr: string) => {
  if (!dateStr) return false;
  const target = parseVahanDate(dateStr);
  if (!target || isNaN(target.getTime())) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 10 && diffDays >= 0;
};

const verifyVehicle = async (vehicleNo: string) => {
  try {
    setVehicleVerificationStatus("verifying");
    setExpiryAlerts([]);
    setVerificationDetails(null);
    
    const response = await verifyVehicleApi({
      vehiclenumber: vehicleNo,
    });
    
    if (response.status === "verified") {
      setVehicleVerificationStatus("verified");
      setVerificationDetails(response);
      
      const alerts = [];
      if (isExpiringSoon(response.vehicle_details.rc_fit_upto)) {
        alerts.push(`Fitness is expiring on ${response.vehicle_details.rc_fit_upto}`);
      }
      if (isExpiringSoon(response.vehicle_details.rc_insurance_upto)) {
        alerts.push(`Insurance is expiring on ${response.vehicle_details.rc_insurance_upto}`);
      }
      setExpiryAlerts(alerts);
    } else {
      setVehicleVerificationStatus("failed");
    }
  } catch (error) {
    setVehicleVerificationStatus("failed");
  }
};

const handleVehicleChange = (text: string) => {
  // Prevent spaces and force uppercase
  const upper = text.toUpperCase().replace(/\s+/g, "");

  setVehicleNumber(upper);
  setManualVehicleVerified(false);

  if (vehicleRegex.test(upper)) {
    verifyVehicle(upper);
  } else {
    setVehicleVerificationStatus("idle");
    setExpiryAlerts([]);
    setVerificationDetails(null);
  }
};
  useEffect(() => {
    item?.enquiry_type === "ADHOC" ? setVendorRate(item?.vendor_rate?.toString() ?? "") : setVendorRate("");
  }, []);

  const formatINR = (value: number) =>
  `₹${value.toLocaleString("en-IN")}`;

 const handleUpdate = async () => {
  if (!vehicleAssigned) {
    Alert.alert("Validation Error", "Assigned vehicle type is required");
    return;
  }

  if (!vehicleNumber.trim()) {
    Alert.alert("Validation Error", "Vehicle number is required");
    return;
  }
  if (
  vehicleVerificationStatus !== "verified" &&
  !manualVehicleVerified
) {
  Alert.alert(
    "Vehicle verification required",
    "Please verify the vehicle or use manual verification."
  );
  return;
}

  if (!selectedVendor) {
    Alert.alert("Validation Error", "Vendor company is required");
    return;
  }

 if (!isValidIndianMobile(driverMobile)) {
  Alert.alert(
    "Validation Error",
    "Please enter a valid 10 digit mobile number"
  );
  return;
}

  if (!vendorRate.trim()) {
    Alert.alert("Validation Error", "Vendor rate is required");
    return;
  }

  if (!isFTL && !vendorMG.trim()) {
    Alert.alert("Validation Error", "Vendor MG is required for PMT rate");
    return;
  }

  // Parse numbers safely
  const rate = Number(vendorRate || 0);
  const mg = Number(vendorMG || 0);
  const advancePercent = selectedVendor?.advance_percentage ?? 0;

  // Final vendor rate
  const finalRate = isFTL ? rate : rate * mg;

  // Advance amount (same logic used in UI)
  const advanceAmount = isFTL
    ? (rate * advancePercent) / 100
    : (rate * mg * advancePercent) / 100;

  try {
    const response = await updateVehicleAssignment({
      enquiry_no: item!.enquiry_no,
      vehicle_assigned: vehicleAssigned,
      vehicle_number: vehicleNumber,
      driver_mobile_no: driverMobile,
      vendor_name: selectedVendor.vendor_company_name,
      vendor_contact: selectedVendor.primary_mobile_no,
      vendor_rate: rate,
      final_rate: finalRate,
      rate_uom_type: isFTL ? "FTL" : "PMT",
      min_weight_guarantee: mg,
      advance_amount: advanceAmount,
      is_new_vendor: false,
      customer_name: item?.customer_name,
    });

    if ("message" in response) {
      Alert.alert("Success", response.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("Error", response.error);
    }
  } catch {
    Alert.alert("Error", "Failed to update vehicle assignment");
  }
};
  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={handleClose} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vehicle Assignment</Text>
          <Text style={styles.headerSubtitle}>
            Update assignment details
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* BASIC DETAILS */}
        <Text style={styles.sectionTitle}>Basic Assignment Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Requested Vehicle Type</Text>
          <TextInput
            style={[styles.input, styles.disabled]}
            value={item?.vehicle_type}
            editable={false}
          />
        </View>

        <View style={styles.field}>
          <View style={{ flexDirection: "row", gap: 6 }}>
  <Text style={styles.label}>Assigned Vehicle Type</Text>
  <Text style={styles.required}>*</Text>
</View>
          <Pressable
  style={styles.input}
  onPress={() => vehicleTypeSheetRef.current?.expand()}
>
  <Text style={{ color: Colors.text }}>
    {vehicleAssigned || "Select vehicle type"}
  </Text>
</Pressable>
        </View>

        {/* RATE TYPE */}
        <Text style={styles.label}>Rate Type *</Text>

        <View style={styles.radioRow}>
          <Pressable
            style={[
              styles.radio,
              rateType === "FTL" && styles.radioSelected,
            ]}
            onPress={() =>{ setRateType("FTL")
              setIsFTL(true)
              // calculateFinalRate()
            }}
          >
            <Text
              style={[
                styles.radioText,
                rateType === "FTL" && styles.radioTextActive,
              ]}
            >
              FTL
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.radio,
              rateType === "PMT" && styles.radioSelected,
            ]}
            onPress={() => {setRateType("PMT")
              setIsFTL(false)
            }}
          >
            <Text
              style={[
                styles.radioText,
                rateType === "PMT" && styles.radioTextActive,
              ]}
            >
              PMT
            </Text>
          </Pressable>
        </View>

        {/* VEHICLE NUMBER */}
        <View style={styles.field}>
  <View style={{ flexDirection: "row", gap: 6 }}>
    <Text style={styles.label}>Vehicle Number</Text>
    <Text style={styles.required}>*</Text>
  </View>

  <TextInput
    style={styles.input}
    placeholder="e.g. UP28NB7890"
    value={vehicleNumber}
    onChangeText={handleVehicleChange}
    autoCapitalize="characters"
  />

  {vehicleVerificationStatus === "verifying" && (
    <Text style={styles.verifyInfo}>Verifying vehicle...</Text>
  )}

  {vehicleVerificationStatus === "verified" && (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.verifySuccess}>✓ Vehicle verified</Text>
        <Pressable onPress={() => setDetailsModalVisible(true)}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </Pressable>
      </View>
      
      {expiryAlerts.map((alert, idx) => (
        <View key={idx} style={styles.expiryAlert}>
          <Feather name="alert-triangle" size={12} color="#D97706" />
          <Text style={styles.expiryAlertText}>{alert}</Text>
        </View>
      ))}
    </View>
  )}

  {vehicleVerificationStatus === "failed" && (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={manualVehicleVerified ? styles.verifySuccess : styles.verifyError}>
          {manualVehicleVerified ? "✓ Vehicle Verified Manually" : "Verification Failed"}
        </Text>
        <Pressable 
          style={styles.manualBtn}
          onPress={() => setManualVehicleVerified(!manualVehicleVerified)}
        >
          <Text style={styles.manualBtnText}>
            {manualVehicleVerified ? "Cancel Manual" : "Proceed Manually"}
          </Text>
        </Pressable>
      </View>
    </View>
  )}
</View>

{/* VEHICLE DETAILS MODAL */}
<Modal
  visible={detailsModalVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setDetailsModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Vehicle Details</Text>
        <Pressable onPress={() => setDetailsModalVisible(false)}>
          <Feather name="x" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.modalBody}>
        {verificationDetails ? (
          <View style={styles.detailsGrid}>
            <DetailItem label="Vehicle No" value={verificationDetails.vehicle_details.rc_regn_no || verificationDetails.vehicle_number} />
            <DetailItem label="Owner Name" value={verificationDetails.vehicle_details.rc_owner_name} />
            <DetailItem label="Class" value={verificationDetails.vehicle_details.rc_vh_class_desc} />
            <DetailItem label="Fuel" value={verificationDetails.vehicle_details.rc_fuel_desc} />
            <DetailItem label="Maker" value={verificationDetails.vehicle_details.rc_maker_desc} />
            <DetailItem 
              label="Fitness Upto" 
              value={verificationDetails.vehicle_details.rc_fit_upto} 
              isWarning={isExpiringSoon(verificationDetails.vehicle_details.rc_fit_upto)}
            />
            <DetailItem 
              label="Insurance Upto" 
              value={verificationDetails.vehicle_details.rc_insurance_upto} 
              isWarning={isExpiringSoon(verificationDetails.vehicle_details.rc_insurance_upto)}
            />
            <DetailItem label="Registration Date" value={verificationDetails.vehicle_details.rc_regn_dt || "N/A"} />
            <DetailItem label="Insurance Policy" value={verificationDetails.vehicle_details.rc_insurance_comp || "N/A"} />
            <DetailItem label="Source" value={verificationDetails.verification_source} />
          </View>
        ) : (
          <Text>No details available</Text>
        )}
      </ScrollView>

      <Pressable
        style={styles.closeBtn}
        onPress={() => setDetailsModalVisible(false)}
      >
        <Text style={styles.closeBtnText}>Close</Text>
      </Pressable>
    </View>
  </View>
</Modal>

        <View style={styles.field}>
        <View style={{ flexDirection: "row", gap: 6 }}>
  <Text style={styles.label}>Vendor MG (TON)</Text>
  {!isFTL && <Text style={styles.required}>*</Text>}
</View>
          <TextInput
            style={styles.input}
            value={vendorMG}
            onChangeText={setVendorMG}
            keyboardType="numeric"
          />
        </View>

        {/* VENDOR DROPDOWN */}
        <View style={styles.field}>
          <View style={{ flexDirection: "row", gap: 6 }}>
  <Text style={styles.label}>Vendor Company</Text>
  <Text style={styles.required}>*</Text>
</View>

          <Pressable
  style={styles.input}
  onPress={() => vendorSheetRef.current?.expand()}
>
  <Text style={{ color: Colors.text }}>
    {selectedVendor
      ? selectedVendor.vendor_company_name
      : "Search vendor by company name"}
  </Text>
</Pressable>

        
        </View>

        {/* DRIVER */}
        <View style={styles.field}>
  <View style={{ flexDirection: "row", gap: 6 }}>
    <Text style={styles.label}>Driver Mobile No</Text>
    <Text style={styles.required}>*</Text>
  </View>

  <View style={styles.phoneContainer}>
    <Text style={styles.countryCode}>+91</Text>

    <TextInput
      style={styles.phoneInput}
      keyboardType="phone-pad"
      maxLength={10}
      value={driverMobile}
      onChangeText={(text) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        setDriverMobile(cleaned);
      }}
      placeholder="Enter mobile number"
    />
  </View>
</View>

        {/* FINANCIAL */}
        <Text style={styles.sectionTitle}>Financial Details</Text>

        <View style={styles.field}>
          <View style={{ flexDirection: "row", gap: 6 }}>
  <Text style={styles.label}>Vendor Rate (Rs)</Text>
  <Text style={styles.required}>*</Text>
</View>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={vendorRate}
            onChangeText={setVendorRate}
          />
        </View>

        <View style={styles.field}>
  <Text style={styles.label}>Advance Amount (Rs)</Text>

  <Text style={[styles.input, styles.disabled]}>
    {item?.enquiry_type !== "ADHOC" || isFTL
      ? `${formatINR(
          (Number(vendorRate || 0) *
            Number(selectedVendor?.advance_percentage ?? 0)) /
            100
        )}   (${selectedVendor?.advance_percentage ?? 0}%)`
      : `${formatINR(
          Number(vendorRate || 0) *
            Number(vendorMG || 0) *
            (Number(selectedVendor?.advance_percentage ?? 0) / 100)
        )}   (${selectedVendor?.advance_percentage ?? 0}%)`}
  </Text>
</View>

     
  <View style={styles.rateBox}>
    {isFTL ? (
      <>
        <Text style={styles.rateText}>
          Rate Calculation:{" "}
          <Text style={styles.rateBold}>
            FTL (Full Truck Load)
          </Text>
          : Vendor Rate as entered ={" "}
          {formatINR(Number(vendorRate))}
        </Text>
        <View style={styles.rateDivider} />

    <View style={styles.rateFooter}>
      <Text style={styles.finalLabel}>
        FINAL VENDOR RATE
      </Text>

      <Text style={styles.finalValue}>
        {formatINR(Number(vendorRate))}
      </Text>
    </View>
      </>
      
    ) : (
      <>
        <Text style={styles.rateText}>
          Rate Calculation:{" "}
          <Text style={styles.rateBold}>
            PMT (Per Metric Ton)
          </Text>
          : Vendor Rate × Min Weight Guarantee =
          {" "}
          {vendorRate.toLocaleString()} × {vendorMG} ={" "}
          {formatINR(Number(vendorRate) * Number(vendorMG))}
        </Text>
        <View style={styles.rateDivider} />

    <View style={styles.rateFooter}>
      <Text style={styles.finalLabel}>
        FINAL VENDOR RATE
      </Text>

      <Text style={styles.finalValue}>
         {formatINR(Number(vendorRate) * Number(vendorMG))}
      </Text>
    </View>
      </>
    )}

    
  </View>

      </ScrollView>

      {/* FOOTER */}
     <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
  <Pressable style={styles.updateBtnFull} onPress={handleUpdate}>
    <Text style={styles.updateText}>Update Vehicle Assignment</Text>
  </Pressable>
</View>
      <VendorPickerSheet
  ref={vendorSheetRef}
  onSelect={(vendor) => {
    setSelectedVendor(vendor);
    vendorSheetRef.current?.close();
  }}
/>
<VehicleTypeSheet
  ref={vehicleTypeSheetRef}
  onSelect={(vehicle) => {
    setVehicleAssigned(vehicle.display_text);
    vehicleTypeSheetRef.current?.close();
  }}
/>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
updateBtnFull: {
  width: "100%",
  paddingVertical: 14,
  borderRadius: 10,
  backgroundColor: Colors.primary,
  alignItems: "center",
},
  content: {
    padding: 20,
    paddingBottom: 120,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 12,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },

  disabled: {
    opacity: 0.6,
  },
  required: {
  color: "red",
  fontWeight: "600",
},

  radioRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  radio: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EEF2FF",
  },

  radioText: {
    color: Colors.textSecondary,
  },

  radioTextActive: {
    color: Colors.primary,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    maxHeight: 250,
    backgroundColor: Colors.card,
    marginTop: 6,
  },

  search: {
    borderBottomWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },

  vendorItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },

  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
phoneContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  backgroundColor: Colors.card,
  paddingHorizontal: 12,
},

countryCode: {
  fontSize: 14,
  color: Colors.textSecondary,
  marginRight: 8,
},

phoneInput: {
  flex: 1,
  paddingVertical: 12,
  fontSize: 14,
},
  vendorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 8,
  },

  vendorName: {
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },

  vendorMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 12,
  },

  cancel: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
  },

  cancelText: {
    color: Colors.textSecondary,
  },

  updateBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },

  updateText: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
  },

  rateBox: {
  marginHorizontal: 7,
  marginTop: 7,
  marginBottom: 10,
  borderRadius: 14,
  padding: 16,
  borderWidth: 1,
  borderColor: "#2F5BEA",
  backgroundColor: "#0F172A",
},

rateText: {
  fontSize: 14,
  color: "#CBD5F5",
  lineHeight: 22,
},

rateBold: {
  fontWeight: "600",
  color: "#D6E4FF",
},

rateDivider: {
  height: 1,
  backgroundColor: "#2F5BEA",
  marginVertical: 12,
},

rateFooter: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

finalLabel: {
  fontSize: 15,
  fontWeight: "600",
  color: "#E2E8F0",
},

finalValue: {
  fontSize: 22,
  fontWeight: "700",
  color: "#E2E8F0",
},
verifyInfo: {
  fontSize: 12,
  color: Colors.textSecondary,
  marginTop: 6,
},

verifySuccess: {
  fontSize: 12,
  color: Colors.success,
  marginTop: 6,
},

verifyError: {
  fontSize: 12,
  color: "red",
  marginTop: 6,
},
manualBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  manualBtnText: {
    color: "white",
    fontSize: 12,
  },
  viewDetailsText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  expiryAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  expiryAlertText: {
    fontSize: 12,
    color: "#D97706",
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  manualInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    maxHeight: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalBody: {
    paddingBottom: 20,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  warningValue: {
    color: "#D97706",
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  closeBtnText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
