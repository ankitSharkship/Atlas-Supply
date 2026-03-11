export const IMPLANT_EMAILS = [
  'implant1@demo.com',
  'implant2@demo.com',
  'implant3@demo.com',
  'implant4@demo.com',
  'implant5@demo.com',
];

export const CENTRAL_EMAILS = [
  'central1@demo.com',
  'central2@demo.com',
  'central3@demo.com',
  'central4@demo.com',
  'central5@demo.com',
];

export const DEMO_PASSWORD = 'demo123';

export type UserRole = 'implant' | 'central';

export interface VRVehicle {
  id: string;
  transactionId: string;
  origin: string;
  destination: string;
  vehicleNumber: string;
  truckDisplayName: string;
  driverNumber: string;
  customerName: string;
}

export interface DSVehicle {
  id: string;
  transactionId: string;
  orderId: string;
  origin: string;
  destination: string;
  truckName: string;
  vehicleNumber: string;
  driverNumber: string;
}

export interface HPODTask {
  id: string;
  transactionId: string;
  customerName: string;
  origin: string;
  destination: string;
  vehicleNumber: string;
  scheduledDate: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
}

export const VR_VEHICLES: VRVehicle[] = [
  {
    id: 'vr-001',
    transactionId: 'TXN-2024-4521',
    customerName: 'Mahindra Logistics',
    origin: 'Mumbai',
    destination: 'Delhi',
    vehicleNumber: 'MH 12 AB 1234',
    truckDisplayName: 'Tata 407',
    driverNumber: '+91 98765 43210',
  },
  {
    id: 'vr-002',
    transactionId: 'TXN-2024-4522',
    customerName: 'Reliance Industries',
    origin: 'Pune',
    destination: 'Bangalore',
    vehicleNumber: 'MH 14 CD 5678',
    truckDisplayName: 'Ashok Leyland 2518',
    driverNumber: '+91 87654 32109',
  },
  {
    id: 'vr-003',
    transactionId: 'TXN-2024-4523',
    customerName: 'ITC Limited',
    origin: 'Chennai',
    destination: 'Hyderabad',
    vehicleNumber: 'TN 22 EF 9012',
    truckDisplayName: 'TATA ACE',
    driverNumber: '+91 76543 21098',
  },
  {
    id: 'vr-004',
    transactionId: 'TXN-2024-4524',
    customerName: 'Hindustan Unilever',
    origin: 'Ahmedabad',
    destination: 'Surat',
    vehicleNumber: 'GJ 01 GH 3456',
    truckDisplayName: 'Eicher Pro 2095',
    driverNumber: '+91 95874 12345',
  },
  {
    id: 'vr-005',
    transactionId: 'TXN-2024-4525',
    customerName: 'Wipro Consumer',
    origin: 'Kolkata',
    destination: 'Bhubaneswar',
    vehicleNumber: 'WB 05 IJ 7890',
    truckDisplayName: 'Tata Prima 4028',
    driverNumber: '+91 84321 09876',
  },
  {
    id: 'vr-006',
    transactionId: 'TXN-2024-4526',
    customerName: 'Asian Paints',
    origin: 'Jaipur',
    destination: 'Jodhpur',
    vehicleNumber: 'RJ 14 KL 2345',
    truckDisplayName: 'Mahindra Blazo',
    driverNumber: '+91 73219 87654',
  },
  {
    id: 'vr-007',
    transactionId: 'TXN-2024-4527',
    customerName: 'Dabur India',
    origin: 'Lucknow',
    destination: 'Kanpur',
    vehicleNumber: 'UP 32 MN 6789',
    truckDisplayName: 'Bharat Benz 1217',
    driverNumber: '+91 62198 76543',
  },
  {
    id: 'vr-008',
    transactionId: 'TXN-2024-4528',
    customerName: 'Godrej Consumer',
    origin: 'Nagpur',
    destination: 'Amravati',
    vehicleNumber: 'MH 31 OP 1234',
    truckDisplayName: 'Tata LPT 1613',
    driverNumber: '+91 51987 65432',
  },
];

export const DS_VEHICLES: DSVehicle[] = [
  {
    id: 'ds-001',
    transactionId: 'TXN-2024-5001',
    orderId: 'ORD-8821',
    origin: 'Mumbai',
    destination: 'Ahmedabad',
    truckName: 'Eicher Pro 2095',
    vehicleNumber: 'MH 01 GH 3456',
    driverNumber: '+91 95874 12345',
  },
  {
    id: 'ds-002',
    transactionId: 'TXN-2024-5002',
    orderId: 'ORD-8822',
    origin: 'Delhi',
    destination: 'Chandigarh',
    truckName: 'Tata 407',
    vehicleNumber: 'DL 8C AF 1234',
    driverNumber: '+91 84321 09876',
  },
  {
    id: 'ds-003',
    transactionId: 'TXN-2024-5003',
    orderId: 'ORD-8823',
    origin: 'Bangalore',
    destination: 'Mysore',
    truckName: 'Ashok Leyland 2518',
    vehicleNumber: 'KA 05 BC 9876',
    driverNumber: '+91 73219 87654',
  },
  {
    id: 'ds-004',
    transactionId: 'TXN-2024-5004',
    orderId: 'ORD-8824',
    origin: 'Hyderabad',
    destination: 'Vijayawada',
    truckName: 'TATA Prima',
    vehicleNumber: 'TS 09 CD 5432',
    driverNumber: '+91 62198 76543',
  },
  {
    id: 'ds-005',
    transactionId: 'TXN-2024-5005',
    orderId: 'ORD-8825',
    origin: 'Pune',
    destination: 'Nashik',
    truckName: 'Mahindra Blazo',
    vehicleNumber: 'MH 12 EF 7654',
    driverNumber: '+91 51987 65432',
  },
  {
    id: 'ds-006',
    transactionId: 'TXN-2024-5006',
    orderId: 'ORD-8826',
    origin: 'Chennai',
    destination: 'Coimbatore',
    truckName: 'Bharat Benz 1217',
    vehicleNumber: 'TN 01 GH 3210',
    driverNumber: '+91 43219 87654',
  },
];

export const HPOD_TASKS: HPODTask[] = [
  {
    id: 'hpod-001',
    transactionId: 'TXN-2024-6001',
    customerName: 'Blue Dart Logistics',
    origin: 'Delhi',
    destination: 'Jaipur',
    vehicleNumber: 'DL 8C AF 1234',
    scheduledDate: '2024-03-12',
    priority: 'high',
    status: 'Awaiting POD',
  },
  {
    id: 'hpod-002',
    transactionId: 'TXN-2024-6002',
    customerName: 'DTDC Courier',
    origin: 'Mumbai',
    destination: 'Pune',
    vehicleNumber: 'MH 01 AB 5678',
    scheduledDate: '2024-03-13',
    priority: 'high',
    status: 'POD Pending',
  },
  {
    id: 'hpod-003',
    transactionId: 'TXN-2024-6003',
    customerName: 'TCI Express',
    origin: 'Bangalore',
    destination: 'Chennai',
    vehicleNumber: 'KA 05 CD 9012',
    scheduledDate: '2024-03-14',
    priority: 'medium',
    status: 'Awaiting POD',
  },
  {
    id: 'hpod-004',
    transactionId: 'TXN-2024-6004',
    customerName: 'Gati Limited',
    origin: 'Hyderabad',
    destination: 'Nagpur',
    vehicleNumber: 'TS 09 EF 3456',
    scheduledDate: '2024-03-15',
    priority: 'medium',
    status: 'POD Pending',
  },
  {
    id: 'hpod-005',
    transactionId: 'TXN-2024-6005',
    customerName: 'Safexpress',
    origin: 'Kolkata',
    destination: 'Patna',
    vehicleNumber: 'WB 05 GH 7890',
    scheduledDate: '2024-03-16',
    priority: 'low',
    status: 'Awaiting POD',
  },
];
