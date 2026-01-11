# Client-Side Face Recognition System

This project now uses a **100% Browser-Based** face recognition system, eliminating the need for Python scripts (`bridge_service.py`) on the client machine.

## How it Works
1.  **Library**: We use `face-api.js` to run AI models directly in the Chrome/Edge browser.
2.  **Models**: The AI models are stored in `public/models`.
3.  **Storage**: Face unique features (descriptors) are stored as JSON arrays in your Supabase database (`workers` table).

## ⚠️ Database Migration Required
You **MUST** add a `face_descriptor` column to your `workers` table for this to work.

Please run the following SQL command in your Supabase SQL Editor:

```sql
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS face_descriptor jsonb;
```

## Setup Instructions for Admin
1.  Go to **Create Accounts -> Create Worker**.
2.  After creating a worker, go to **Workers List**.
3.  Click the **"Register"** camera button next to the worker's name.
4.  Look at the camera and click "Capture".
5.  The system will save the face data to the cloud.

## Setup Instructions for Attendance
1.  Go to the **Worker Attendance** page (Receptionist View).
2.  Browser will ask for Camera Permission (Allow it).
3.  The system will load AI models (takes 2-3 seconds).
4.  When a registered worker looks at the camera, it will automatically Mark Attendance.

## Troubleshooting
-   **"Camera Error"**: Ensure you are on `https://` or `localhost`. Browsers block cameras on insecure `http://` sites (except localhost).
-   **"Models not found"**: Ensure the `public/models` folder exists and contains the shard files.
