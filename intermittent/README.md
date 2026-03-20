# IntermittentChargeForm

A multi-step React Native form modal for recording intermittent overhead charges.

## File Structure

```
IntermittentChargeForm/
├── index.ts                          # Barrel exports
├── types.ts                          # All TypeScript types & constants
├── hooks/
│   └── useIntermittentChargeForm.ts  # Form state, validation, API submission
└── components/
    ├── SharedComponents.tsx           # Reusable UI: FormField, StyledInput, SelectDropdown, etc.
    ├── IntermittentChargeModal.tsx    # Root modal — orchestrates all 4 steps
    ├── Step1ShipmentDetails.tsx       # Shipment date, enquiry/GR/vehicle, payment status
    ├── Step2ChargeDetails.tsx         # Payment adjustment, charge category
    ├── Step3AmountTransfer.tsx        # Amount transfer to (registered/unregistered/employee)
    └── Step4Approval.tsx              # Approved by, file upload, mail subject, remarks
```

## Usage

```tsx
import { IntermittentChargeModal } from './IntermittentChargeForm';

export default function MyScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Button title="Add Charge" onPress={() => setModalVisible(true)} />
      <IntermittentChargeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          // Refresh list, show toast, etc.
          console.log('Charge recorded!');
        }}
      />
    </>
  );
}
```

## Dependencies

- `react-native` (core — already in your project)
- For file picking, wire `pickFile()` stubs in Step3 & Step4 to:
  ```
  expo-document-picker  (Expo)
  react-native-document-picker  (bare RN)
  ```

## Flow Logic

| Vendor Payment Status | Payment Adjustment | Charge Category | Amount Transfer To |
|---|---|---|---|
| PAYMENT TO VENDOR | Both options available | All categories | All options |
| NOT PAID TO VENDOR | Both options available | All categories | All options |
| VENDOR RECOVERY | 🔒 NOT BILL TO CLIENT | 🔒 OTHERS | 🔒 REGISTERED VENDOR |

- **BILL TO CLIENT** selected → `billToClientAmount` field becomes mandatory
- **EXISTING EMPLOYEE** selected on Step 3 → `Approved By` is hidden on Step 4
- If `api/get_enquiry_details` fails → GR number & vehicle number become free-text fields
- If enquiry found → GR number is a dropdown of `lorry_receipts`; selecting one auto-fills `vehicle_no`

## API

### GET enquiry details (on enquiry number search)
```
POST /api/get_enquiry_details
Body: { enquiry_no: string }
```

### Submit
```
POST /api/add_intermittent_charge
Content-Type: multipart/form-data
```

## Validation Summary

| Step | Field | Rule |
|---|---|---|
| 1 | shipmentDate | Required |
| 1 | enquiryNo | Required |
| 1 | grNo | Required |
| 1 | vehicleNo | Required |
| 1 | vendorPaymentStatus | Required |
| 2 | paymentAdjustment | Required |
| 2 | billToClientAmount | Required if BILL TO CLIENT |
| 2 | chargeCategory | Required |
| 3 | amountTransferTo | Required |
| 3 | (sub-fields) | Required per transfer type |
| 4 | approvedBy | Required (unless EXISTING EMPLOYEE) |
| 4 | approvalFile | Required |
| 4 | mailSubject | Required |
