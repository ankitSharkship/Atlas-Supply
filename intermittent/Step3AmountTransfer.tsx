import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  FormField,
  StyledInput,
  SelectDropdown,
  ToggleTabs,
  SectionCard,
  FileUploadButton,
  PhoneInput,
  NavButtons,
  colors,
} from './SharedComponents';
import {
  Step1Form,
  Step3Form,
  FormErrors,
  AMOUNT_TRANSFER_OPTIONS,
  AmountTransferTo,
  PaymentVia,
} from '../utils/types';

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
  form: Step3Form;
  step1: Step1Form;
  errors: FormErrors;
  onChange: (fields: Partial<Step3Form>) => void;
  onCancel: () => void;
  onPrev: () => void;
  onNext: () => void;
  vendors?: {label: string, value: string}[];
}

export const Step3AmountTransfer: React.FC<Props> = ({
  form,
  step1,
  errors,
  onChange,
  onCancel,
  onPrev,
  onNext,
  vendors = [],
}) => {
  const isVendorRecovery = step1.vendorPaymentStatus === 'VENDOR RECOVERY';

  const transferOptions = AMOUNT_TRANSFER_OPTIONS.map(v => ({
    label: v,
    value: v,
  }));

  const currentTransfer: AmountTransferTo | '' = isVendorRecovery
    ? 'REGISTERED VENDOR'
    : form.amountTransferTo;

  const handleTransferChange = (v: AmountTransferTo) => {
    // Reset sub-fields when switching
    onChange({
      amountTransferTo: v,
      registeredVendorName: '',
      registeredVendorAmount: '',
      paymentVia: '',
      unregVendorName: '',
      unregContactNo: '',
      unregBankName: '',
      unregAccountNo: '',
      unregBranchName: '',
      unregIfscCode: '',
      unregAmount: '',
      unregQrFile: null,
      employeeName: '',
      employeeContact: '',
      employeeCode: '',
      employeeAmount: '',
    });
  };

  return (
    <View style={styles.container}>
      {/* Amount Transfer To selector */}
      <FormField
        label="Amount Transfer To"
        error={errors.amountTransferTo}
      >
        <SelectDropdown<AmountTransferTo>
          options={transferOptions}
          value={currentTransfer}
          onChange={handleTransferChange}
          placeholder="Select..."
          error={!!errors.amountTransferTo}
          disabled={isVendorRecovery}
        />
      </FormField>

      {/* ── REGISTERED VENDOR ──────────────────────────────────────────────── */}
      {currentTransfer === 'REGISTERED VENDOR' && (
        <SectionCard variant="green">
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField
                label="Select Registered Vendor"
                required
                error={errors.registeredVendorName}
              >
                <SelectDropdown<string>
                  options={vendors}
                  value={form.registeredVendorName}
                  onChange={v => onChange({ registeredVendorName: v })}
                  placeholder="Select vendor..."
                  error={!!errors.registeredVendorName}
                />
              </FormField>
            </View>
            <View style={styles.col}>
              <FormField
                label="Amount"
                required
                error={errors.registeredVendorAmount}
              >
                <StyledInput
                  value={form.registeredVendorAmount}
                  onChangeText={v => onChange({ registeredVendorAmount: v })}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  error={!!errors.registeredVendorAmount}
                />
              </FormField>
            </View>
          </View>
        </SectionCard>
      )}

      {/* ── UNREGISTERED VENDOR ────────────────────────────────────────────── */}
      {currentTransfer === 'UNREGISTERED VENDOR' && (
        <SectionCard variant="yellow">
          {/* Pay via toggle */}
          <FormField label="Payment Method" required error={errors.paymentVia}>
            <ToggleTabs
              options={[
                { label: 'Pay through Bank', value: 'bank' },
                { label: 'Pay through QR', value: 'qr_code' },
              ]}
              value={form.paymentVia}
              onChange={v => onChange({ paymentVia: v as PaymentVia })}
            />
          </FormField>

          {/* QR Upload */}
          {form.paymentVia === 'qr_code' && (
            <FormField
              label="Upload Payment QR Code"
              required
              error={errors.unregQrFile}
            >
              <FileUploadButton
                label="Upload QR Code"
                file={form.unregQrFile}
                onPress={async () => {
                  const f = await pickFile();
                  if (f) onChange({ unregQrFile: f });
                }}
                error={!!errors.unregQrFile}
              />
            </FormField>
          )}

          {/* Bank fields */}
          {form.paymentVia === 'bank' && (
            <>
              <View style={styles.row}>
                <View style={styles.col}>
                  <FormField
                    label="Vendor Name"
                    required
                    error={errors.unregVendorName}
                  >
                    <StyledInput
                      value={form.unregVendorName}
                      onChangeText={v => onChange({ unregVendorName: v })}
                      placeholder="Enter vendor name"
                      error={!!errors.unregVendorName}
                    />
                  </FormField>
                </View>
                <View style={styles.col}>
                  <FormField
                    label="Contact Number"
                    required
                    error={errors.unregContactNo}
                  >
                    <PhoneInput
                      value={form.unregContactNo}
                      onChangeText={v => onChange({ unregContactNo: v })}
                      error={!!errors.unregContactNo}
                    />
                  </FormField>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <FormField
                    label="Bank Name"
                    required
                    error={errors.unregBankName}
                  >
                    <StyledInput
                      value={form.unregBankName}
                      onChangeText={v => onChange({ unregBankName: v })}
                      placeholder="e.g. SBI"
                      error={!!errors.unregBankName}
                    />
                  </FormField>
                </View>
                <View style={styles.col}>
                  <FormField
                    label="Account Number"
                    required
                    error={errors.unregAccountNo}
                  >
                    <StyledInput
                      value={form.unregAccountNo}
                      onChangeText={v => onChange({ unregAccountNo: v })}
                      placeholder="Enter bank account number"
                      keyboardType="numeric"
                      error={!!errors.unregAccountNo}
                    />
                  </FormField>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <FormField
                    label="Branch Name"
                    required
                    error={errors.unregBranchName}
                  >
                    <StyledInput
                      value={form.unregBranchName}
                      onChangeText={v => onChange({ unregBranchName: v })}
                      placeholder="Enter branch name"
                      error={!!errors.unregBranchName}
                    />
                  </FormField>
                </View>
                <View style={styles.col}>
                  <FormField
                    label="IFSC Code"
                    required
                    error={errors.unregIfscCode}
                  >
                    <StyledInput
                      value={form.unregIfscCode}
                      onChangeText={v => onChange({ unregIfscCode: v })}
                      placeholder="Enter IFSC code"
                      autoCapitalize="characters"
                      error={!!errors.unregIfscCode}
                    />
                  </FormField>
                </View>
              </View>
              <FormField
                label="Unregistered Vendor Amount"
                required
                error={errors.unregAmount}
              >
                <StyledInput
                  value={form.unregAmount}
                  onChangeText={v => onChange({ unregAmount: v })}
                  placeholder="Enter number"
                  keyboardType="numeric"
                  error={!!errors.unregAmount}
                />
              </FormField>
            </>
          )}

          {/* QR mode: name, contact, amount */}
          {form.paymentVia === 'qr_code' && (
            <>
              <View style={styles.row}>
                <View style={styles.col}>
                  <FormField
                    label="Vendor Name"
                    required
                    error={errors.unregVendorName}
                  >
                    <StyledInput
                      value={form.unregVendorName}
                      onChangeText={v => onChange({ unregVendorName: v })}
                      placeholder="Enter vendor name"
                      error={!!errors.unregVendorName}
                    />
                  </FormField>
                </View>
                <View style={styles.col}>
                  <FormField
                    label="Contact Number"
                    required
                    error={errors.unregContactNo}
                  >
                    <PhoneInput
                      value={form.unregContactNo}
                      onChangeText={v => onChange({ unregContactNo: v })}
                      error={!!errors.unregContactNo}
                    />
                  </FormField>
                </View>
              </View>
              <FormField
                label="Unregistered Vendor Amount"
                required
                error={errors.unregAmount}
              >
                <StyledInput
                  value={form.unregAmount}
                  onChangeText={v => onChange({ unregAmount: v })}
                  placeholder="Enter number"
                  keyboardType="numeric"
                  error={!!errors.unregAmount}
                />
              </FormField>
            </>
          )}
        </SectionCard>
      )}

      {/* ── EXISTING EMPLOYEE ──────────────────────────────────────────────── */}
      {currentTransfer === 'EXISTING EMPLOYEE' && (
        <SectionCard variant="blue">
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField
                label="Employee Name"
                required
                error={errors.employeeName}
              >
                <StyledInput
                  value={form.employeeName}
                  onChangeText={v => onChange({ employeeName: v })}
                  placeholder="Enter employee name"
                  error={!!errors.employeeName}
                />
              </FormField>
            </View>
            <View style={styles.col}>
              <FormField
                label="Employee Contact"
                required
                error={errors.employeeContact}
              >
                <PhoneInput
                  value={form.employeeContact}
                  onChangeText={v => onChange({ employeeContact: v })}
                  error={!!errors.employeeContact}
                />
              </FormField>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField
                label="Employee Code"
                required
                error={errors.employeeCode}
              >
                <StyledInput
                  value={form.employeeCode}
                  onChangeText={v => onChange({ employeeCode: v })}
                  placeholder="e.g. EMP009"
                  autoCapitalize="characters"
                  error={!!errors.employeeCode}
                />
              </FormField>
            </View>
            <View style={styles.col}>
              <FormField label="Amount" required error={errors.employeeAmount}>
                <StyledInput
                  value={form.employeeAmount}
                  onChangeText={v => onChange({ employeeAmount: v })}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  error={!!errors.employeeAmount}
                />
              </FormField>
            </View>
          </View>
        </SectionCard>
      )}

      <NavButtons
        onCancel={onCancel}
        onPrev={onPrev}
        onNext={onNext}
        showPrev
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: { flexDirection: 'column', gap: 0 },
  col: { flex: undefined },
});
