# API Integration Guide

This guide provides the necessary information for the backend developer (Kunal) to integrate the real backend with the Worker Portal UI.

## Overview
The frontend uses a central `mockService.js` located in `src/services/`. To integrate the real backend, replace the methods in `mockService.js` with real `fetch` or `axios` calls.

## Endpoints

### 1. Authentication
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  { "id": "E123", "password": "password" }
  ```
- **Response**:
  ```json
  {
    "id": "E123",
    "name": "John Doe",
    "designation": "Assembly Specialist",
    "department": "Production",
    "shift": "09:00 AM - 05:00 PM",
    "hourlyRate": 15.00
  }
  ```

### 2. Dashboard
- **Endpoint**: `GET /api/worker/dashboard`
- **Response**:
  ```json
  {
    "stats": {
      "workedHours": 145,
      "overtime": 12,
      "leaveBalance": 5,
      "estimatedEarnings": 2400
    },
    "notices": [
      { "id": "1", "text": "Safety inspection at 2 PM" },
      { "id": "2", "text": "Holiday on Friday" }
    ]
  }
  ```

### 3. Attendance
- **Punch In**: `POST /api/attendance/punch-in`
- **Punch Out**: `POST /api/attendance/punch-out`
- **History**: `GET /api/worker/attendance-history?month=2023-10`
  - **Response**: Array of objects:
    ```json
    {
      "date": "Oct 24, Mon",
      "in": "09:00 AM",
      "out": "05:00 PM",
      "total": 8,
      "ot": 0,
      "status": "Present"
    }
    ```

### 4. Leave Management
- **Apply Leave**: `POST /api/worker/apply-leave`
- **Request Body**:
  ```json
  { "type": "Casual", "fromDate": "2023-10-27", "toDate": "2023-10-27", "reason": "Family function" }
  ```

### 5. Profile & Payslip
- **Get Profile**: `GET /api/worker/profile`
- **Download Payslip**: `GET /api/worker/download-payslip`

## Implementation Notes
- Ensure CORS is handled on the backend.
- Use JWT or Cookie-based authentication for secure requests.
- The UI follows a "Global Simulator" design (400x850px), so keep responses concise.
