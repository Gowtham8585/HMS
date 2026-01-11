# Face Scanner Deployment Guide

## How the Current System Works (Hybrid Approach)
Your current Face Scanner uses a **Hybrid Architecture**:
1. **Frontend (Website):** React/Vite (Runs in Browser)
2. **Backend (Hardware Control):** Python Script (Runs on the Computer)

This setup is required because **browsers cannot access your full operating system** for security reasons. They strictly forbid websites from opening desktop windows or launching system processes (like your `face_lock.py`) without a "Bridge".

## Hosting on Vercel / Netlify
If you deploy your website to Vercel (e.g., `https://my-hms.vercel.app`):

### scenario 1: Using the Current System (Recommended for Reception Desks)
**You STILL need to run `bridge_service.py` on the receptionist's computer.**
Even though the website is on the cloud, the camera and the Python processing logic are on the local machine.

1. **Deploy** the React app to Vercel.
2. On the **Reception Desk Computer**, download the `bridge_service.py` and `face_lock.py` files.
3. Open a terminal on that computer and run:
   ```powershell
   python bridge_service.py
   ```
4. When the receptionist visits `https://my-hms.vercel.app` and clicks "Scan", the website will talk to `localhost:5001` (the specific computer they are sitting at) and launch the scanner **on that computer**.

**Pros:** 
- Keep using your robust OpenCV/LBPH model.
- Fast local processing.
- Works offline (mostly).

**Cons:** 
- Requires Python installed on the client machine.
- Requires running the script manually once.

---

### Scenario 2: "Click and Go" (No Python Script Required)
If you want the camera to open **purely from the website** without installing Python or running scripts on the client machine, we must **Rewrite the Scanner**.

**What needs to change:**
1. **Remove Python:** We cannot use `bridge_service.py` or `face_lock.py` anymore.
2. **Javascript Face Recognition:** We must use a library like **face-api.js** to recognize faces directly inside the browser window.
3. **Webcam:** We use the browser's native `<video>` element instead of a popup window.

**Pros:**
- Works on any device (iPad, Phone, Laptop) instantly.
- No software installation needed.

**Cons:**
- **Performance:** Browser-based AI is slower than native OpenCV.
- **Accuracy:** Might be less accurate in poor lighting.
- **Complexity:** Requires a complete rewrite of `WorkerAttendance.jsx` to handle the AI logic in Javascript.

## Recommendation
For a professional setting (Reception Desk), **Scenario 1 is standard**. Point-of-Sale (POS) systems and Kiosks typically have a local "Service" running to handle hardware (Printers, Scanners, Cameras).

**To auto-start the bridge:**
Create a shortcut or batch file (e.g., `start_scanner.bat`) in the Windows Startup folder so it runs automatically when the computer turns on.
