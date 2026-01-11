import cv2
import os
import numpy as np
import requests
import json
from datetime import datetime

# Helper to read .env file
def load_env():
    env_vars = {}
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    env_vars[key] = value
    return env_vars

env = load_env()
# Prioritize OS environment variables (passed from bridge) over .env file
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", env.get("VITE_SUPABASE_URL", "YOUR_SUPABASE_URL"))
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_KEY", env.get("VITE_SUPABASE_KEY", "YOUR_SUPABASE_ANON_KEY"))

FACE_DATA_DIR = "face_data"
TRAINER_FILE = os.path.join(FACE_DATA_DIR, "trainer.yml")
MAP_FILE = os.path.join(FACE_DATA_DIR, "id_map.json")

if not os.path.exists(FACE_DATA_DIR):
    os.makedirs(FACE_DATA_DIR)

# Initialize OpenCV Face Recognizer (LBPH - Works great on Windows without dlib)
# Use try-except to handle cases where opencv-contrib isn't installed
try:
    recognizer = cv2.face.LBPHFaceRecognizer_create()
except AttributeError:
    print("Error: 'cv2.face' not found. Please run: pip install opencv-contrib-python")
    exit()

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def register_face(worker_id, worker_name, user_type="worker"):
    """Captures 30 photos for a worker to train the model. Saves metadata."""
    video_capture = cv2.VideoCapture(0)
    print(f"Registering face for {worker_name} ({user_type}). Look at the camera.")
    
    count = 0
    # Create subfolder for worker
    worker_path = os.path.join(FACE_DATA_DIR, str(worker_id))
    if not os.path.exists(worker_path):
        os.makedirs(worker_path)
    
    # Save metadata (name, type) in a JSON file inside the folder
    meta = {"name": worker_name, "type": user_type, "id": worker_id}
    with open(os.path.join(worker_path, "meta.json"), "w") as f:
        json.dump(meta, f)

    window_name = 'Face Registration - Stay Still'
    cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    import time
    last_capture_time = 0
    capture_interval = 0.2 # Capture every 200ms (5 photos per sec)
    
    # 1. Show Instructions first
    instruction_start = time.time()
    while time.time() - instruction_start < 4: # Show for 4 seconds
        ret, frame = video_capture.read()
        if not ret: break
        
        # Overlay Instructions
        overlay = frame.copy()
        cv2.rectangle(overlay, (50, 150), (590, 330), (0,0,0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        cv2.putText(frame, "REGISTRATION STARTING", (120, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3)
        cv2.putText(frame, f"Role: {user_type.upper()}", (120, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
        cv2.putText(frame, "1. Look directly at camera", (100, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, "2. Move head SLOWLY when counting starts", (100, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        countdown = 4 - int(time.time() - instruction_start)
        cv2.putText(frame, f"Starting in {countdown}...", (220, 380), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 3)
        
        cv2.imshow(window_name, frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): return

    # 2. Start Capture
    while True:
        ret, frame = video_capture.read()
        if not ret: break
        
        current_time = time.time()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        for (x, y, w, h) in faces:
            # Only capture if interval has passed AND face is large enough (min 100x100)
            if current_time - last_capture_time > capture_interval and w > 100 and h > 100:
                count += 1
                last_capture_time = current_time
                # Save the captured image into the datasets folder (keep gray for training)
                file_name_path = os.path.join(worker_path, f"{count}.jpg")
                cv2.imwrite(file_name_path, gray[y:y+h, x:x+w])
                print(f"Captured {count}/30...")
            
            # Visual feedback
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            progress = int((count / 30) * 100)
            cv2.putText(frame, f"Capturing: {count}/30 ({progress}%)", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, "Move your head slowly...", (50, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
        cv2.imshow('Face Registration - Stay Still', frame)
        
        # Aggressive "Bring to Front" - retry for first few frames
        if count <= 5:
            try:
                import ctypes
                hwnd = ctypes.windll.user32.FindWindowW(None, 'Face Registration - Stay Still')
                if hwnd:
                    # HWND_TOPMOST (-1), SWP_NOMOVE (0x2), SWP_NOSIZE (0x1), SWP_SHOWWINDOW (0x40)
                    ctypes.windll.user32.SetWindowPos(hwnd, -1, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040)
                    ctypes.windll.user32.SetForegroundWindow(hwnd)
                    ctypes.windll.user32.SetActiveWindow(hwnd)
                    # Force window focus even if calling process is not foreground
                    ctypes.windll.user32.ShowWindow(hwnd, 5) # SW_SHOW
            except:
                pass

        if cv2.waitKey(1) & 0xFF == ord('q') or count >= 30:
            break
            
    video_capture.release()
    
    # Show success for 3 seconds before closing
    if count >= 30:
        success_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(success_frame, "REGISTRATION COMPLETE", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
        cv2.putText(success_frame, f"Worker: {worker_name} ({user_type})", (50, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.imshow('Face Registration - Stay Still', success_frame)
        cv2.waitKey(3000)

    cv2.destroyAllWindows()
    print(f"\nCaptured {count} images. Training model...")
    train_model()

def train_model():
    """Trains the LBPH recognizer and updates ID map with types."""
    faces = []
    ids = []
    
    id_map = {} # {int_id: {uuid: "...", type: "..."}}
    int_counter = 0

    worker_folders = [f for f in os.listdir(FACE_DATA_DIR) if os.path.isdir(os.path.join(FACE_DATA_DIR, f))]
    
    for worker_uuid in worker_folders:
        int_counter += 1
        worker_path = os.path.join(FACE_DATA_DIR, worker_uuid)
        
        # Read metadata if exists
        user_type = "worker"
        user_name = "Unknown"
        meta_path = os.path.join(worker_path, "meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
                user_type = meta.get("type", "worker")
                user_name = meta.get("name", "Unknown")
        
        id_map[str(int_counter)] = {"uuid": worker_uuid, "type": user_type, "name": user_name}
        
        for image_name in os.listdir(worker_path):
            if not image_name.endswith(".jpg"): continue
            img_path = os.path.join(worker_path, image_name)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None: continue
            faces.append(img)
            ids.append(int_counter)

    if faces:
        recognizer.train(faces, np.array(ids))
        recognizer.save(TRAINER_FILE)
        with open(MAP_FILE, "w") as f:
            json.dump(id_map, f)
        print("Training complete! Model saved as " + TRAINER_FILE)
    else:
        print("No face data found to train.")

def verify_and_mark_attendance():
    """Starts camera, recognizes face, matches with ID, and pings Supabase."""
    if not os.path.exists(TRAINER_FILE):
        print("Model not trained. Register workers first.")
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, "No registered faces found!\n\nPlease go to 'Register Support Staff' -> Create/Select Worker -> 'Register Face' first.", "Scanner Error", 0x10)
        except:
            pass
        return

    recognizer.read(TRAINER_FILE)
    with open(MAP_FILE, "r") as f:
        id_map = json.load(f)

    # We need names too? LBPH doesn't store names. 
    # For now, we'll just show the ID or "Verified"
    
    video_capture = cv2.VideoCapture(0)
    print("Attendance Scanner Active. Press 'q' to quit.")

    window_name = 'Attendance Scanner'
    cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    while True:
        ret, frame = video_capture.read()
        if not ret: break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.2, 5)

        for (x, y, w, h) in faces:
            id_int, confidence = recognizer.predict(gray[y:y+h, x:x+w])
            
            # Confidence for LBPH is distance (Lower is better)
            # Usually < 70 is a good match
            if confidence < 75:
                user_data = id_map.get(str(id_int))
                if user_data:
                    if isinstance(user_data, dict):
                        user_uuid = user_data.get("uuid")
                        user_type = user_data.get("type", "worker")
                        user_name = user_data.get("name", "Unknown")
                    else:
                        # Fallback for old map format
                        user_uuid = user_data
                        user_type = "worker"
                        user_name = "Unknown"

                    print(f"Verified: {user_name} ({user_type}) Conf:{round(100 - confidence)}%")
                    
                    # Mark attendance in Supabase and get status string
                    status_msg = mark_supabase_attendance(user_uuid, user_type, user_name)
                    
                    # Visual Feedback
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    cv2.putText(frame, f"{user_name}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                    if status_msg:
                        cv2.putText(frame, status_msg, (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
                    
                    cv2.imshow(window_name, frame)
                    cv2.waitKey(4000) # Show for 4 seconds so they can read it
                    video_capture.release()
                    cv2.destroyAllWindows()
                    return
            else:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                cv2.putText(frame, "Unknown", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        cv2.imshow(window_name, frame)
        
        # Aggressive "Bring to Front" loop for first few frames
        if 'focus_retry' not in locals(): focus_retry = 0
        if focus_retry < 10:
            try:
                import ctypes
                hwnd = ctypes.windll.user32.FindWindowW(None, 'Attendance Scanner')
                if hwnd:
                    ctypes.windll.user32.SetWindowPos(hwnd, -1, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040)
                    ctypes.windll.user32.SetForegroundWindow(hwnd)
                    ctypes.windll.user32.ShowWindow(hwnd, 5)
                focus_retry += 1
            except:
                pass

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()

def mark_supabase_attendance(user_id, user_type, user_name="User"):
    """Post attendance record to Supabase. Handles Check-In and Check-Out. Returns status string."""
    url = f"{SUPABASE_URL}/rest/v1/attendance"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    today = datetime.now().date().isoformat()
    current_time = datetime.now()
    time_str = current_time.strftime("%I:%M %p")
    iso_time = current_time.isoformat()

    # 1. Check if already checked in today
    query_url = f"{url}?user_id=eq.{user_id}&date=eq.{today}&select=*"
    try:
        get_res = requests.get(query_url, headers=headers)
        records = get_res.json()
        
        if records and len(records) > 0:
            # ALREADY CHECKED IN -> DO CHECK OUT
            record_id = records[0]['id']
            if records[0]['check_out']:
                print("Already checked out for today!")
                return f"Already Done: {time_str}"
            
            print(f"Checking OUT for ID: {record_id}")
            update_url = f"{url}?id=eq.{record_id}"
            
            # Helper to try PATCH
            def try_patch(payload):
                res = requests.patch(update_url, headers=headers, json=payload)
                if res.status_code in [200, 204]:
                    return True, res
                return False, res

            # Attempt 1: All columns
            success, res = try_patch({"check_out": iso_time, "out_time": iso_time})
            if not success:
                 print("Retry 1: check_out only")
                 success, res = try_patch({"check_out": iso_time})
            if not success:
                 print("Retry 2: out_time only")
                 success, res = try_patch({"out_time": iso_time})

            if success:
                print(f"Check-out recorded successfully! Time: {iso_time}")
                return f"GOODBYE {user_name}! OUT: {time_str}"
            else:
                print(f"Check-out FAILED. Last Error: {res.text}")
                return "Error: Update Failed"

        else:
            # NOT CHECKED IN -> DO CHECK IN
            print("Checking IN...")
            
            # Helper to try POST
            def try_post(payload):
                res = requests.post(url, headers=headers, json=payload)
                if res.status_code == 201:
                    return True, res
                return False, res

            base_data = {
                "user_id": user_id,
                "user_type": user_type,
                "date": today,
                "status": "present"
            }

            # Attempt 1: All columns
            payload = base_data.copy()
            payload.update({"check_in": iso_time, "in_time": iso_time, "check_in_time": iso_time})
            success, res = try_post(payload)

            if not success:
                print("Retry 1: check_in only")
                payload = base_data.copy()
                payload.update({"check_in": iso_time})
                success, res = try_post(payload)

            if not success:
                print("Retry 2: check_in_time only")
                payload = base_data.copy()
                payload.update({"check_in_time": iso_time})
                success, res = try_post(payload)
            
            if not success:
                print("Retry 3: in_time only")
                payload = base_data.copy()
                payload.update({"in_time": iso_time})
                success, res = try_post(payload)

            if success:
                print(f"Check-in recorded successfully! Time: {iso_time}")
                return f"WELCOME {user_name}! IN: {time_str}"
            else:
                if "foreign key constraint" in res.text:
                    print("Error: User ID does not exist in the database.")
                    return "Error: User Not Found (Re-register)"
                
                print(f"Check-in FAILED. Last Error: {res.text}")
                return "Error: Check-in Failed"
                
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")
        return "Error: Connection Failed"

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "register":
            # python face_lock.py register [id] [name] [optional_type]
            u_id = sys.argv[2]
            u_name = sys.argv[3]
            u_type = sys.argv[4] if len(sys.argv) > 4 else "worker"
            register_face(u_id, u_name, u_type)
        elif sys.argv[1] == "verify":
            verify_and_mark_attendance()
        elif sys.argv[1] == "train":
            train_model()
    else:
        print("Usage:")
        print("  Register: python face_lock.py register <id> <name> [worker|doctor|receptionist]")
        print("  Verify:   python face_lock.py verify")
        print("  Train:    python face_lock.py train")
