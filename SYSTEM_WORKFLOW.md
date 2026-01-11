# 🏥 Hospital Management System - Complete User Flow

## 🔐 Authentication System Overview

### **Admin Creates All Accounts**
The admin is responsible for creating login credentials for all users (doctors, receptionists, and patients).

---

## 👥 User Roles & Access

### 1️⃣ **ADMIN**
**Login:** Uses their own admin credentials

**Responsibilities:**
- ✅ Create doctor accounts (email + password)
- ✅ Create receptionist/staff accounts (email + password)
- ✅ Manage all system settings
- ✅ View all attendance, bills, and reports

**How to Create Accounts:**
1. Login as Admin
2. Go to **Admin Dashboard** → **Staff Accounts**
3. Fill in details (Name, Email, Password, Role)
4. Click **"GENERATE SYSTEM ACCESS"**
5. Provide credentials to the staff member

---

### 2️⃣ **DOCTOR**
**Login:** Uses email/password provided by admin

**Dashboard Access:**
- 📅 Today's Appointments
- 👤 Patient Details
- 🎤 Voice Prescription
- 🕒 My Attendance

**Created By:** Admin only

---

### 3️⃣ **RECEPTIONIST (Coworker)**
**Login:** Uses email/password provided by admin

**Dashboard Access:**
- 👤 Register New Patients (with login credentials)
- 📅 Book Appointments
- 💰 Billing
- 🕒 Worker Attendance
- 🕐 My Attendance

**Responsibilities:**
- ✅ Register patients and create their login accounts
- ✅ Book appointments for patients
- ✅ Generate bills
- ✅ Mark attendance for workers (watchman, cleaner, etc.)

**Created By:** Admin only

---

### 4️⃣ **PATIENT**
**Login:** Uses email/password provided by receptionist

**Dashboard Access:**
- 📅 My Appointments
- 📋 Medical History
- 💊 Prescriptions
- 📄 Bills

**Created By:** Receptionist only

---

## 🔄 Complete Workflow

### **Step 1: Admin Setup**
```
Admin logs in
  ↓
Creates Doctor accounts (email/password)
  ↓
Creates Receptionist accounts (email/password)
  ↓
Provides credentials to staff
```

### **Step 2: Doctor Access**
```
Doctor receives credentials from admin
  ↓
Logs in with email/password
  ↓
Accesses Doctor Dashboard
  ↓
Views appointments, creates prescriptions, marks attendance
```

### **Step 3: Receptionist Access**
```
Receptionist receives credentials from admin
  ↓
Logs in with email/password
  ↓
Accesses Receptionist Dashboard
  ↓
Registers patients (creates their login accounts)
  ↓
Books appointments, generates bills
```

### **Step 4: Patient Access**
```
Patient visits clinic
  ↓
Receptionist registers patient (creates email/password)
  ↓
Patient receives login credentials
  ↓
Patient logs in from home
  ↓
Views appointments, medical history, bills
```

---

## 🛠️ Important Database Setup

### **Before Creating Accounts, Run These SQL Scripts:**

1. **Fix Profiles Table** (REQUIRED)
   - File: `database/complete_profile_fix.sql`
   - Purpose: Allows profile creation for all users
   - Run in: Supabase SQL Editor

2. **Reset Doctors Table** (Optional - for clean start)
   - File: `database/reset_doctors_clean.sql`
   - Purpose: Fresh doctors table linked to auth
   - Run in: Supabase SQL Editor

3. **Disable Email Confirmation** (REQUIRED)
   - Location: Supabase Dashboard → Authentication → Providers → Email
   - Setting: Turn OFF "Confirm email"
   - Purpose: Users can log in immediately without email verification

---

## ✅ Testing the System

### **Test 1: Create Doctor Account**
1. Admin Dashboard → Staff Accounts
2. Create doctor with:
   - Email: test@doctor.com
   - Password: test123
   - Role: Doctor
3. Log out
4. Log in as test@doctor.com / test123
5. Should see Doctor Dashboard ✅

### **Test 2: Create Receptionist Account**
1. Admin Dashboard → Staff Accounts
2. Create receptionist with:
   - Email: receptionist@clinic.com
   - Password: recep123
   - Role: Coworker
3. Log out
4. Log in as receptionist@clinic.com / recep123
5. Should see Receptionist Dashboard ✅

### **Test 3: Create Patient Account**
1. Log in as receptionist
2. Go to Register Patient
3. Fill in patient details + email/password
4. Log out
5. Log in as patient
6. Should see Patient Dashboard ✅

---

## 🚨 Troubleshooting

### **"Unknown Role" Error**
- **Cause:** Profile not created
- **Fix:** Run `complete_profile_fix.sql` in Supabase

### **"User created but Profile failed"**
- **Cause:** RLS policies blocking profile insertion
- **Fix:** Run `complete_profile_fix.sql` in Supabase

### **"Failed to log in. Check email/password"**
- **Cause:** Email confirmation required
- **Fix:** Disable email confirmation in Supabase (Authentication → Providers → Email)

---

## 📊 Summary

| Role | Created By | Can Create | Dashboard Access |
|------|-----------|-----------|-----------------|
| **Admin** | Manual Setup | Doctors, Receptionists | Full System Access |
| **Doctor** | Admin | - | Appointments, Prescriptions, Attendance |
| **Receptionist** | Admin | Patients | Patient Registration, Billing, Appointments |
| **Patient** | Receptionist | - | View Appointments, Medical History |

---

**System Status:** ✅ Fully Operational
**Last Updated:** 2026-01-07
