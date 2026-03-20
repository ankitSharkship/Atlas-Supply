// Main entry point — import from here
export { IntermittentChargeModal } from './components/IntermittentChargeModal';

// Individual steps (if you need them standalone)
export { Step1ShipmentDetails } from './components/Step1ShipmentDetails';
export { Step2ChargeDetails } from './components/Step2ChargeDetails';
export { Step3AmountTransfer } from './components/Step3AmountTransfer';
export { Step4Approval } from './components/Step4Approval';

// Shared UI
export * from './components/SharedComponents';

// Hook
export { useIntermittentChargeForm, useEnquiryLookup } from './hooks/useIntermittentChargeForm';

// Types & Constants
export * from '../utils/types';
