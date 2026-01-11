
# 🚨 Critical Fix: Database Access 🚨

The Face Scanner is likely failing because the "Receptionist" user is blocked from reading the "Workers" face data due to security rules (RLS).

## How to Fix (1-Minute)

1.  Open your **Supabase SQL Editor** (in the browser).
2.  Copy and Run the code from this file:
    `database/fix_workers_access.sql`

## What this does
-   **Unblocks Access**: Allows the frontend to read the `workers` table (so it can download face descriptors).
-   **Fixes Saving**: Allows the logic to save/update `attendance` records without "Permission Denied" errors.
-   **Ensures Column**: Double-checks that `face_descriptor` column exists.

## After Running Script
1.  Refresh your app.
2.  Go to **Workers List**.
3.  **Re-Register** your face (just to be safe).
4.  Go to **Worker Attendance** and try again.
