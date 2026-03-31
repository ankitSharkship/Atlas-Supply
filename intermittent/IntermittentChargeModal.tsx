import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useIntermittentChargeForm } from "../hooks/useIntermittentChargeForm";
import { getVendorsLookup } from "../lib/vehicleAssignmentService";
import { colors } from "./SharedComponents";
import { Step1ShipmentDetails } from "./Step1ShipmentDetails";
import { Step2ChargeDetails } from "./Step2ChargeDetails";
import { Step3AmountTransfer } from "./Step3AmountTransfer";
import { Step4Approval } from "./Step4Approval";

const STEP_LABELS = ["Shipment", "Charges", "Transfer", "Approval"];

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


  // Sync VENDOR RECOVERY locked fields into form state when step changes
  useEffect(() => {
    if (formState.step1.vendorPaymentStatus === "VENDOR RECOVERY") {
      if (currentStep === 2) {
        updateStep2({
          paymentAdjustment: "NOT BILL TO CLIENT",
          chargeCategory: "OTHERS",
        });
      }
      if (currentStep === 3) {
        updateStep3({ amountTransferTo: "REGISTERED VENDOR" });
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
            step1={formState.step1}
            step2={formState.step2}
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
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

        {/* Top Bar for Closing */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Intermittent Charges</Text>
          {/* <Text style={styles.modalSubtitle}>
            Optional subtitle or description
          </Text> */}
        </View>

        {/* Step Indicator */}
        {/* <StepIndicator
          current={currentStep}
          total={TOTAL_STEPS}
          labels={STEP_LABELS}
        /> */}

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
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 24 : 16,
    paddingBottom: 8,
    alignItems: "flex-end",
    backgroundColor: colors.bg,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "800",
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5", // subtle separator
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
