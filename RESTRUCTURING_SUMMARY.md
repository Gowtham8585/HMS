# 🔄 System Renaming & Restructuring - Summary

## ✅ **Completed Changes:**

### 1. **Staff Accounts Page (AccountManager.jsx)**
- ✅ Renamed "Coworker" → "Receptionist"
- ✅ Added "Worker" role option
- ✅ Added worker-specific fields:
  - Worker Type (Watchman, Cleaner, Peon, etc.)
  - Daily Salary (₹)
- ✅ Auto-creates worker records in `workers` table

---

## 🔨 **Remaining Changes Needed:**

### 2. **Database Role Updates**
Need to update `profiles` table role values:
```sql
-- Update existing coworker roles to receptionist
UPDATE profiles SET role = 'receptionist' WHERE role = 'coworker';
```

### 3. **Code Updates Required**

#### **Files to Update (Replace 'coworker' with 'receptionist'):**

1. `src/App.jsx` - Routes and role checks
2. `src/components/ProtectedRoute.jsx` - Role validation
3. `src/pages/admin/AllAttendance.jsx` - Attendance filtering
4. `src/pages/admin/AdminDashboard.jsx` - Stats query
5. `src/pages/admin/StaffList.jsx` - Staff filtering
6. `src/pages/admin/Payroll.jsx` - Payroll query
7. `src/pages/coworker/*.jsx` - All receptionist pages
8. `src/contexts/AuthContext.jsx` - Role checks

#### **New Files to Create:**

1. `src/pages/admin/WorkersList.jsx` - View-only workers list
   - Show: Name, Role, Salary, Join Date
   - No add/edit/delete (managed via Staff Accounts)

#### **Admin Dashboard Updates:**

**Remove:**
- ❌ "Worker Management" button

**Add:**
- ✅ "Workers List" button (view-only)

**Keep:**
- ✅ "Staff Accounts" (for creating all accounts)

---

## 📊 **New System Structure:**

### **Admin Creates Accounts For:**
1. **Doctors** → Auto-added to `doctors` table
2. **Receptionists** → Role: `receptionist` in `profiles`
3. **Workers** → Auto-added to `workers` table
4. **Patients** → Created by receptionists

### **View-Only Lists:**
- **Doctors List** - Shows all doctors
- **Staff List** - Shows all receptionists
- **Workers List** - Shows all workers (NEW)
- **Patients List** - Shows all patients

---

## 🎯 **User Flow:**

```
Admin logs in
    ↓
Goes to "Staff Accounts"
    ↓
Selects role:
    - Receptionist → Creates receptionist account
    - Doctor → Creates doctor account + adds to directory
    - Worker → Creates worker account + adds to workers table
    ↓
User logs in with provided credentials
    ↓
Redirected to appropriate dashboard
```

---

## ⚠️ **Important Notes:**

1. **Database Migration Required:**
   - Run SQL to update `coworker` → `receptionist` in profiles table
   - Ensure `workers` table has `id` column (UUID, references auth.users)

2. **Folder Structure:**
   - Keep `src/pages/coworker/` folder name (no need to rename)
   - Just update role references inside files

3. **Backward Compatibility:**
   - Existing receptionists will need role updated in database
   - Existing routes will continue to work

---

**Status:** 🟡 Partially Complete
**Next Step:** Update database role values and create WorkersList.jsx
