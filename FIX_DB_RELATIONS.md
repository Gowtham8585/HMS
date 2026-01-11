# Fixing Database Connections

It seems your database tables were created independently without explicit "Foreign Key" connections. This script fixes that by evaluating the relationships and enforcing them.

## 1. Run the Fix Script
Open your **Supabase SQL Editor** and run the contents of the file:
`database/fix_relations.sql`

## What this does:
1.  **Connects Workers -> Auth**: Now, `workers` table is explicitly linked to Supabase Users.
2.  **Connects Bills -> Patients**: Ensures bills are strictly linked to patients.
3.  **Initializes Hospital Settings**: Creates the default "Hospital Profile" row (ID 1) so the settings page works immediately.

## 2. Face Recognition Notes
The `attendance` table is special because it stores records for BOTH `Workers` and `Profiles` (Receptionists/Doctors).
-   It uses a "Polymorphic" ID (`user_id`).
-   Standard SQL cannot force a Foreign Key to *two different tables* at once.
-   This is expected behavior and works correctly in the application logic.

## 3. Verify in App
1.  Go to **Hospital Setup** -> It should now load default data instead of being empty.
2.  Go to **Workers List** -> Existing workers work as normal, but now their data integrity is protected.
