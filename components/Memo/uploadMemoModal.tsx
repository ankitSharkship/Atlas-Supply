import Colors from "@/constants/colors";
import {
  LoadingMemoData,
  uploadLoadingMemo,
  UploadLoadingMemoResponse,
} from "@/lib/loadingMemoSerivce";

import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export function UploadMemoModal({
  visible,
  task,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  task: LoadingMemoData | null;
  onClose: () => void;
  onSuccess: (updated: UploadLoadingMemoResponse["updated_data"]) => void;
}) {
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state whenever the modal opens for a different task
  useEffect(() => {
    console.log("---------");
    console.log(task?.lorry_receipt_date);

    if (visible) {
      setPickedFile(null);
      setIsSubmitting(false);
    }
  }, [visible, task?.enquiry_no]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const sizeBytes = asset.size ?? 0;
      const MAX_BYTES = 5 * 1024 * 1024;

      if (sizeBytes > MAX_BYTES) {
        Alert.alert("File too large", "Please select a file under 5 MB.");
        return;
      }

      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Error", "Unable to pick file. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (!task) return;
    if (!pickedFile) {
      Alert.alert(
        "No file selected",
        "Please choose a PDF or image file first.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result: UploadLoadingMemoResponse = await uploadLoadingMemo(
        task.enquiry_no,
        pickedFile.uri,
        pickedFile.name,
        pickedFile.mimeType,
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const { updated_data } = result;

      Alert.alert(
        "Upload Successful ✓",
        [
          `Enquiry: ${updated_data.enquiry_no}`,
          `Vehicle: ${updated_data.vehicle_no}`,
          `Verification: ${updated_data.loading_memo_verification_status}`,
          `Updated by: ${updated_data.updated_by}`,
        ].join("\n"),
        [{ text: "OK" }],
      );

      // Patch the item in-place in the parent list so the card reflects
      // the new memo URL and verification status immediately
      onSuccess(updated_data);
      onClose();
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  const fileIcon = pickedFile
    ? pickedFile.mimeType === "application/pdf"
      ? "file-pdf-box"
      : "file-image"
    : "file-upload-outline";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={!isSubmitting ? onClose : undefined}
    >
      <View style={uploadStyles.overlay}>
        <View style={uploadStyles.sheet}>
          {/* Header */}
          <View style={uploadStyles.header}>
            <View style={uploadStyles.headerLeft}>
              <MaterialCommunityIcons
                name="file-upload"
                size={24}
                color={Colors.primary}
              />
              <Text style={uploadStyles.headerTitle}>Upload Loading Memo</Text>
            </View>
            {!isSubmitting && (
              <Pressable
                onPress={onClose}
                style={uploadStyles.closeBtn}
                hitSlop={8}
              >
                <Feather name="x" size={20} color={Colors.text} />
              </Pressable>
            )}
          </View>

          {/* Info Card */}
          <View style={uploadStyles.infoCard}>
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Enquiry No:</Text>
              <Text style={uploadStyles.infoValue}>{task.enquiry_no}</Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Vehicle No:</Text>
              <Text style={uploadStyles.infoValue}>{task.vehicle_no}</Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Vehicle Assigned</Text>
              <Text style={uploadStyles.infoValue}>
                {task.vehicle_assigned}
              </Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Vendor Name</Text>
              <Text style={uploadStyles.infoValue}>{task.vendor_name}</Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Lorry Receipt Date</Text>
              <Text
                style={uploadStyles.infoValue}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {task.lorry_receipt_date}
              </Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Advance Amount</Text>
              <Text style={uploadStyles.infoValue}>{task.advance_amount}</Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Final Rate</Text>
              <Text style={uploadStyles.infoValue}>{task.final_rate}</Text>
            </View>
          </View>

          {/* File Picker */}
          <Text style={uploadStyles.fieldLabel}>
            Select Loading Memo File{" "}
            <Text style={uploadStyles.required}>*</Text>
          </Text>
          <Pressable
            style={({ pressed }) => [
              uploadStyles.filePicker,
              pickedFile && uploadStyles.filePickerSelected,
              pressed && { opacity: 0.75 },
            ]}
            onPress={pickFile}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons
              name={fileIcon as any}
              size={20}
              color={pickedFile ? Colors.primary : Colors.textLight}
            />
            <Text
              style={[
                uploadStyles.filePickerText,
                pickedFile && uploadStyles.filePickerTextSelected,
              ]}
              numberOfLines={1}
            >
              {pickedFile ? pickedFile.name : "Choose PDF or Image"}
            </Text>
            {pickedFile && (
              <Pressable
                onPress={() => setPickedFile(null)}
                hitSlop={8}
                style={uploadStyles.fileClearBtn}
              >
                <Feather name="x-circle" size={16} color={Colors.textLight} />
              </Pressable>
            )}
          </Pressable>
          <Text style={uploadStyles.fileHint}>Maximum file size: 5MB</Text>
          <Text style={uploadStyles.fileHint}>
            Allowed file types: PDF, JPG, JPEG, PNG
          </Text>

          {/* Footer */}
          <View style={uploadStyles.footer}>
            <Pressable
              style={({ pressed }) => [
                uploadStyles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={uploadStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                uploadStyles.uploadBtn,
                !pickedFile && uploadStyles.uploadBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleUpload}
              disabled={isSubmitting || !pickedFile}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={18}
                    color={Colors.white}
                  />
                  <Text style={uploadStyles.uploadText}>Upload Memo</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const uploadStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },

  infoLabel: {
    width: 150, // fixed width for label
    fontWeight: "600",
  },

  infoValue: {
    flex: 1,
    flexWrap: "wrap",
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 10,
  },
  required: { color: Colors.error, fontFamily: "Inter_700Bold" },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 8,
  },
  filePickerSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#EBF1FF",
  },
  filePickerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textLight,
  },
  filePickerTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  fileClearBtn: { padding: 2 },
  fileHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  uploadBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
  },
  uploadBtnDisabled: {
    backgroundColor: "#A8B8D8",
  },
  uploadText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
});
