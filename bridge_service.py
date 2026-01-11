import http.server
import socketserver
import subprocess
import urllib.parse
import json
import os

PORT = 5001

class BridgeHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        parsed_path = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed_path.query)
        
        if parsed_path.path == '/register':
            worker_id = params.get('id', [None])[0]
            name_param = params.get('name', [None])[0]
            type_param = params.get('type', [None])[0]
            supa_key = params.get('key', [None])[0]
            supa_url = params.get('url', [None])[0]
            
            worker_name = name_param if (name_param and name_param.strip()) else "Worker"
            user_type = type_param if type_param else "worker"
            
            if worker_id:
                print(f"Triggering registration for {worker_name} (ID: {worker_id}, Type: {user_type})...")
                try:
                    # Pass credentials via ENV
                    curr_env = os.environ.copy()
                    if supa_key: curr_env['VITE_SUPABASE_KEY'] = supa_key
                    if supa_url: curr_env['VITE_SUPABASE_URL'] = supa_url

                    # Launch the process
                    subprocess.Popen(['python', 'face_lock.py', 'register', worker_id, worker_name, user_type], env=curr_env)
                    
                    focus_cmd = f'powershell -Command "$wshell = New-Object -ComObject WScript.Shell; sleep 1; $wshell.AppActivate(\'Face Registration - Stay Still\')"'
                    subprocess.Popen(focus_cmd, shell=True)
                    
                    self.wfile.write(json.dumps({"status": "started", "message": f"Registration started for {worker_name}"}).encode())
                except Exception as e:
                    print(f"Subprocess failed: {e}")
                    self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())
            else:
                print("Registration failed: Missing worker ID")
                self.wfile.write(json.dumps({"status": "error", "message": "Missing ID"}).encode())
                
        elif parsed_path.path == '/verify':
            print("Triggering verification scanner...")
            supa_key = params.get('key', [None])[0]
            supa_url = params.get('url', [None])[0]

            # Pass credentials via ENV
            curr_env = os.environ.copy()
            if supa_key: curr_env['VITE_SUPABASE_KEY'] = supa_key
            if supa_url: curr_env['VITE_SUPABASE_URL'] = supa_url

            subprocess.Popen(['python', 'face_lock.py', 'verify'], env=curr_env)
            
            focus_cmd = 'powershell -Command "$wshell = New-Object -ComObject WScript.Shell; sleep 1; $wshell.AppActivate(\'Attendance Scanner\')"'
            subprocess.Popen(focus_cmd, shell=True)
            
            self.wfile.write(json.dumps({"status": "started", "message": "Verification scanner started"}).encode())
        
        else:
            self.wfile.write(json.dumps({"status": "ready", "message": "Bridge is active"}).encode())

print(f"HMS Python Bridge running on http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), BridgeHandler) as httpd:
    httpd.serve_forever()
