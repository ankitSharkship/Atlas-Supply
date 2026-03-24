import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  FormField,
  StyledInput,
  SelectDropdown,
  NavButtons,
  colors,
} from './SharedComponents';
import {
  Step1Form,
  Step2Form,
  FormErrors,
  PAYMENT_ADJUSTMENT_OPTIONS,
  CHARGE_CATEGORIES,
  PaymentAdjustmentOption,
  ChargeCategory,
} from '../utils/types';

interface Props {
  form: Step2Form;
  step1: Step1Form;
  errors: FormErrors;
  onChange: (fields: Partial<Step2Form>) => void;
  onCancel: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const Step2ChargeDetails: React.FC<Props> = ({
  form,
  step1,
  errors,
  onChange,
  onCancel,
  onPrev,
  onNext,
}) => {
  const isVendorRecovery = step1.vendorPaymentStatus === 'VENDOR RECOVERY';

  // For VENDOR RECOVERY: force NOT BILL TO CLIENT + OTHERS (locked)
  const paymentAdjOptions = PAYMENT_ADJUSTMENT_OPTIONS.map(v => ({
    label: v,
    value: v,
  }));

  const chargeCategoryOptions = CHARGE_CATEGORIES.map(v => ({
    label: v,
    value: v,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Payment Adjustment */}
        <View style={styles.col}>
          <FormField
            label="Payment Adjustment Option"
            required
            error={errors.paymentAdjustment}
          >
            <SelectDropdown<PaymentAdjustmentOption>
              options={paymentAdjOptions}
              value={
                isVendorRecovery
                  ? 'NOT BILL TO CLIENT'
                  : form.paymentAdjustment
              }
              onChange={v => onChange({ paymentAdjustment: v })}
              placeholder="Select option..."
              error={!!errors.paymentAdjustment}
              disabled={isVendorRecovery}
            />
          </FormField>
        </View>

        {/* Charge Category */}
        <View style={styles.col}>
          <FormField
            label="Charge Category"
            required
            error={errors.chargeCategory}
          >
            <SelectDropdown<ChargeCategory>
              options={chargeCategoryOptions}
              value={
                isVendorRecovery ? 'OTHERS' : form.chargeCategory
              }
              onChange={v => onChange({ chargeCategory: v })}
              placeholder="Select category..."
              error={!!errors.chargeCategory}
              disabled={isVendorRecovery}
            />
          </FormField>
        </View>
      </View>

      {/* Bill To Client Amount — only if BILL TO CLIENT selected */}
      {(isVendorRecovery ? false : form.paymentAdjustment === 'BILL TO CLIENT') && (
        <FormField
          label="Bill To Client Amount"
          required
          error={errors.billToClientAmount}
        >
          <StyledInput
            value={form.billToClientAmount}
            onChangeText={v => onChange({ billToClientAmount: v })}
            placeholder="Enter amount"
            keyboardType="numeric"
            error={!!errors.billToClientAmount}
          />
        </FormField>
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
