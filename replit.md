# OpsTrack - Logistics Operations Mobile App

## Overview
A React Native (Expo) mobile app for logistics operations employees. Supports role-based access with two user types: Implant Employees and Central Employees.

## Architecture

### Frontend (Expo Router, port 8081)
- File-based routing with `app/` directory
- Authentication via AuthContext (AsyncStorage-based session persistence)
- No tabs - pure Stack navigation for operational workflow

### Backend (Express, port 5000)
- Serves API routes and landing page
- Currently minimal - app uses AsyncStorage for all data persistence

## App Structure

```
app/
  _layout.tsx         → Root layout (QueryClient, ErrorBoundary, AuthProvider)
  index.tsx           → Auth redirect (login or dashboard)
  login.tsx           → Login screen
  (app)/
    _layout.tsx       → Protected route guard
    dashboard.tsx     → Role-based dashboard with action cards
    vehicle-reached.tsx   → Vehicle arrival marking module
    documents-submission.tsx → Shipment document upload module
    hpod.tsx          → HPOD tasks list (central employees only)
context/
  AuthContext.tsx     → Auth state, login/logout, role determination
lib/
  mockData.ts         → Demo users, vehicles, HPOD tasks
  query-client.ts     → React Query setup
components/
  ErrorBoundary.tsx
  ErrorFallback.tsx
constants/
  colors.ts           → Design tokens (navy + orange palette)
```

## User Roles

### Implant Employees (5 demo accounts)
- implant1@demo.com through implant5@demo.com
- Password: demo123
- Access: Vehicle Reached, Documents Submission

### Central Employees (5 demo accounts)
- central1@demo.com through central5@demo.com
- Password: demo123
- Access: HPOD

## Modules

### Vehicle Reached
- Select from pending vehicles dropdown
- View vehicle details card
- Set arrival date (custom calendar picker)
- Set arrival time (custom time picker)
- Submit - vehicle removed from pending list

### Documents Submission
- Select vehicle
- Manage GR numbers (add/remove)
- Fill form: GR Date, Loaded Weight, Eway Bill, Rack Height
- Upload documents via camera or gallery
- Submit - vehicle cleared from pending list

### HPOD
- List of pending HPOD tasks with priority badges
- Summary strip showing counts by priority

## Design
- Color palette: Navy blue (#1A3C6E) + Orange (#F97316)
- Font: Inter (all weights)
- Material-quality cards with shadows
- Professional, operational-focused UI

## Tech Stack
- Expo SDK (latest)
- Expo Router (file-based routing)
- React Query (@tanstack/react-query)
- AsyncStorage (data persistence)
- expo-image-picker (document upload)
- expo-haptics (touch feedback)
