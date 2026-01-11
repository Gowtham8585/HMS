
# 🕵️‍♂️ Diagnostic Step

To find out why the Admin Page isn't showing the attendance, we need to peek inside the database.

1.  Open **Supabase SQL Editor**.
2.  Run the script: `database/diagnostic_attendance.sql`
3.  **Paste the Results** here in the chat.

This will tell us:
1.  If the data is actually being saved (or if it's missing).
2.  If the columns `check_in` / `in_time` actually exist.
