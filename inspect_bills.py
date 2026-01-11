
import os
import requests
import json

# Load env manually since we are in a script
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
# Try direct env vars first, then loaded ones
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", env.get("VITE_SUPABASE_URL"))
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_KEY", env.get("VITE_SUPABASE_KEY"))

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Credentials not found in .env")
    exit(1)

url = f"{SUPABASE_URL}/rest/v1/bills?select=id,items&limit=5&order=created_at.desc"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

try:
    print(f"Fetching bills from {SUPABASE_URL}...")
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(f"✅ Retrieved {len(data)} bills.")
        for i, bill in enumerate(data):
            print(f"\n--- Bill {i+1} (ID: {bill['id']}) ---")
            items = bill.get('items')
            print(f"Raw Type: {type(items)}")
            print(f"Raw Content: {items}")
            
            if isinstance(items, str):
                try:
                    parsed = json.loads(items)
                    print(f"Parsed Content: {parsed}")
                except:
                   print("Failed to parse string content.")
    else:
        print(f"❌ Error: {res.status_code} - {res.text}")
except Exception as e:
    print(f"❌ Connection error: {e}")
