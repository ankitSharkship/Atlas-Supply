import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import {
  APPROVED_BY_OPTIONS,
  FormErrors,
  Step3Form,
  Step4Form,
} from "../utils/types";
import {
  FileUploadButton,
  FormField,
  NavButtons,
  SelectDropdown,
  StyledInput,
  colors,
} from "./SharedComponents";

import * as DocumentPicker from "expo-document-picker";

const pickFile = async (): Promise<any | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      };
    }
  } catch (err) {
    console.warn("Failed to pick document", err);
  }
  return null;
};

interface Props {
  form: Step4Form;
  step3: Step3Form;
  errors: FormErrors;
  onChange: (fields: Partial<Step4Form>) => void;
  onCancel: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export const Step4Approval: React.FC<Props> = ({
  form,
  step3,
  errors,
  onChange,
  onCancel,
  onPrev,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  // Hide "Approved By" if amount transfer is to EXISTING EMPLOYEE
  const showApprovedBy = step3.amountTransferTo !== "EXISTING EMPLOYEE";

  const approvedByOptions = APPROVED_BY_OPTIONS.map((v) => ({
    label: v,
    value: v,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          {/* Approved By */}
          {showApprovedBy && (
            <View style={styles.col}>
              <FormField label="Approved By" required error={errors.approvedBy}>
                <SelectDropdown
                  options={approvedByOptions}
                  value={form.approvedBy}
                  onChange={(v) => onChange({ approvedBy: v })}
                  placeholder="Select authority..."
                  error={!!errors.approvedBy}
                />
              </FormField>
            </View>
          )}

          {/* Upload Management Approval */}
          <View style={showApprovedBy ? styles.col : styles.fullCol}>
            <FormField
              label="Upload Management Approval"
              required
              error={errors.approvalFile}
            >
              <FileUploadButton
                label="Management Approval"
                file={form.approvalFile}
                onPress={async () => {
                  const f = await pickFile();
                  if (f) onChange({ approvalFile: f });
                }}
                error={!!errors.approvalFile}
              />
            </FormField>
          </View>
        </View>

        {/* Mail Subject */}
        <FormField label="Mail Subject" required error={errors.mailSubject}>
          <StyledInput
            value={form.mailSubject}
            onChangeText={(v) => onChange({ mailSubject: v })}
            placeholder="Enter mail reference if any..."
            error={!!errors.mailSubject}
          />
        </FormField>

        {/* Final Remarks */}
        <FormField label="Final Remarks" error={errors.finalRemarks}>
          <View style={styles.textareaWrapper}>
            <StyledInput
              value={form.finalRemarks}
              onChangeText={(v) => {
                if (v.length <= 255) onChange({ finalRemarks: v });
              }}
              placeholder="Provide any final details..."
              style={styles.textarea}
            />
            <Text style={styles.charCount}>{form.finalRemarks.length}/255</Text>
          </View>
        </FormField>
      </View>

      {/* Submit error */}
      {!!submitError && (
        <View style={styles.submitError}>
          <Text style={styles.submitErrorText}>⚠️ {submitError}</Text>
        </View>
      )}

      <NavButtons
        onCancel={onCancel}
        onPrev={onPrev}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        showPrev
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surface,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  row: { flexDirection: "column", gap: 0 },
  col: { flex: undefined },
  fullCol: { flex: undefined },
  textareaWrapper: { position: "relative" },
  textarea: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 12,
  } as any,
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  submitError: {
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  submitErrorText: { fontSize: 13, color: colors.error },
});
