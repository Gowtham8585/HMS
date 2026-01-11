
# 🔓 Unlock Database Constraint

The error `violates foreign key constraint "attendance_user_id_fkey"` is the **Smoking Gun**.

It means the database has a rule: *"Only allow attendance if the ID belongs to a Login User."*
But Workers **don't have logins**, so the database blocks them.

## Solution
We must delete this rule so the database accepts "Workers" too.

1.  Open **Supabase SQL Editor**.
2.  Run: `database/remove_restrictive_fk.sql`

**After running this, try the scanner again. It will work.**
