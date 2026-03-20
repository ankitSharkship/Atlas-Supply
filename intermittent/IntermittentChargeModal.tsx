import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { colors } from './SharedComponents';
import { StepIndicator } from './SharedComponents';
import { Step1ShipmentDetails } from './Step1ShipmentDetails';
import { Step2ChargeDetails } from './Step2ChargeDetails';
import { Step3AmountTransfer } from './Step3AmountTransfer';
import { Step4Approval } from './Step4Approval';
import { useIntermittentChargeForm } from '../hooks/useIntermittentChargeForm';
import { TOTAL_STEPS } from '../utils/types';
import { getVendorsLookup } from '../lib/vehicleAssignmentService';

const STEP_LABELS = ['Shipment', 'Charges', 'Transfer', 'Approval'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IntermittentChargeModal: React.FC<Props> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
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
  } = useIntermittentChargeForm(() => {
    onSuccess?.();
    onClose();
  });

  const [vendorOptions, setVendorOptions] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    if (visible) {
      (async () => {
        try {
          const res = await getVendorsLookup();
          if (res?.success) {
            const opts = res.data.vendors.map((v: any) => ({
              label: v.vendor_company_name,
              value: v.vendor_company_name, // use name as value based on your Form state
            }));
            setVendorOptions(opts);
          }
        } catch (e) {
          console.error("Failed to load vendors", e);
        }
      })();
    }
  }, [visible]);

  // Sync VENDOR RECOVERY locked fields into form state when step changes
  useEffect(() => {
    if (formState.step1.vendorPaymentStatus === 'VENDOR RECOVERY') {
      if (currentStep === 2) {
        updateStep2({ paymentAdjustment: 'NOT BILL TO CLIENT', chargeCategory: 'OTHERS' });
      }
      if (currentStep === 3) {
        updateStep3({ amountTransferTo: 'REGISTERED VENDOR' });
      }
    }
  }, [currentStep, formState.step1.vendorPaymentStatus]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ShipmentDetails
            form={formState.step1}
            errors={errors}
            onChange={updateStep1}
            onCancel={onClose}
            onNext={goNext}
          />
        );
      case 2:
        return (
          <Step2ChargeDetails
            form={formState.step2}
            step1={formState.step1}
            errors={errors}
            onChange={updateStep2}
            onCancel={onClose}
            onPrev={goPrev}
            onNext={goNext}
          />
        );
      case 3:
        return (
          <Step3AmountTransfer
            form={formState.step3}
            step1={formState.step1}
            errors={errors}
            onChange={updateStep3}
            onCancel={onClose}
            onPrev={goPrev}
            onNext={goNext}
            vendors={vendorOptions}
          />
        );
      case 4:
        return (
          <Step4Approval
            form={formState.step4}
            step3={formState.step3}
            errors={errors}
            onChange={updateStep4}
            onCancel={onClose}
            onPrev={goPrev}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerIcon}>+</Text>
            <View>
              <Text style={styles.headerTitle}>RECORD NEW CHARGE</Text>
              <Text style={styles.headerSubtitle}>
                Provide shipment and charge details to record a new intermittent overhead.
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <StepIndicator
          current={currentStep}
          total={TOTAL_STEPS}
          labels={STEP_LABELS}
        />

        {/* Scrollable content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  headerIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
});
