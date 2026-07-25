import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"
API_PREFIX = f"{BASE_URL}/api/v1"

class TestReport:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def add(self, name, success, details=""):
        if success:
            self.passed += 1
            status = "PASSED"
        else:
            self.failed += 1
            status = "FAILED"
        self.tests.append({"name": name, "status": status, "details": details})
        print(f"[{status}] {name} - {details}")

report = TestReport()

def test_root_endpoint():
    try:
        with urllib.request.urlopen(f"{BASE_URL}/", timeout=5) as r:
            body = json.loads(r.read().decode())
            success = r.status == 200 and body.get("status") == "ARACHNE_ONLINE"
            report.add("API Root Health Check", success, f"HTTP {r.status} Status: {body.get('status')}")
    except Exception as e:
        report.add("API Root Health Check", False, str(e))

def test_incorrect_login():
    data = urllib.parse.urlencode({
        "username": "test@arachne.gov",
        "password": "wrongpassword"
    }).encode("utf-8")
    req = urllib.request.Request(f"{API_PREFIX}/auth/token", data=data, method="POST")
    try:
        urllib.request.urlopen(req, timeout=5)
        report.add("Incorrect Login Protection", False, "Incorrect credentials allowed access")
    except urllib.error.HTTPError as e:
        success = e.code == 401
        report.add("Incorrect Login Protection", success, f"HTTP {e.code} (Expected 401)")
    except Exception as e:
        report.add("Incorrect Login Protection", False, str(e))

def test_correct_login_and_headers():
    data = urllib.parse.urlencode({
        "username": "test@arachne.gov",
        "password": "securepass123"
    }).encode("utf-8")
    req = urllib.request.Request(f"{API_PREFIX}/auth/token", data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            headers = r.info()
            body = json.loads(r.read().decode())
            
            # Verify security headers
            hsts = "strict-transport-security" in headers
            xframe = headers.get("x-frame-options") == "DENY"
            xcontent = headers.get("x-content-type-options") == "nosniff"
            xxss = "x-xss-protection" in headers
            
            # Verify cookies
            cookie = headers.get("Set-Cookie", "")
            secure_cookie = "HttpOnly" in cookie and "Secure" in cookie and "SameSite=lax" in cookie
            
            has_token = "access_token" in body
            
            success = has_token and hsts and xframe and xcontent and xxss and secure_cookie
            details = f"HSTS={hsts}, X-Frame={xframe}, Secure-Cookie={secure_cookie}"
            report.add("Secure Login, Headers, & Cookies (OWASP)", success, details)
            return body.get("access_token"), cookie
    except Exception as e:
        report.add("Secure Login, Headers, & Cookies (OWASP)", False, str(e))
        return None, None

def test_refresh_token(cookie):
    if not cookie:
        report.add("Token Refresh Rotation", False, "Skipped due to missing login cookie")
        return
        
    req = urllib.request.Request(f"{API_PREFIX}/auth/refresh", method="POST")
    req.add_header("Cookie", cookie)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            body = json.loads(r.read().decode())
            headers = r.info()
            new_cookie = headers.get("Set-Cookie", "")
            
            success = r.status == 200 and "access_token" in body and new_cookie != ""
            report.add("Token Refresh Rotation", success, f"New Access Token Generated, Refresh Cookie Rotated")
    except Exception as e:
        report.add("Token Refresh Rotation", False, str(e))

def test_patrol_predictions_endpoint(token):
    if not token:
        report.add("Hotspot Clustering API (DBSCAN)", False, "Skipped: Missing access token")
        return
        
    req = urllib.request.Request(f"{API_PREFIX}/geo/predict-patrols?algorithm=dbscan", method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            body = json.loads(r.read().decode())
            success = r.status == 200 and isinstance(body, list)
            report.add("Hotspot Clustering API (DBSCAN)", success, f"HTTP {r.status}, Returned {len(body)} hotspot zones")
    except Exception as e:
        report.add("Hotspot Clustering API (DBSCAN)", False, str(e))

def test_ai_insights_chat(token):
    if not token:
        report.add("Gemini AI Chat Stream", False, "Skipped: Missing access token")
        return
        
    payload = json.dumps({"query": "Which district has highest theft?"}).encode()
    req = urllib.request.Request(f"{API_PREFIX}/ai/insights/chat", data=payload, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    try:
        start_time = time.time()
        with urllib.request.urlopen(req, timeout=30) as r:
            body = json.loads(r.read().decode())
            latency = time.time() - start_time
            success = r.status == 200 and "response" in body
            report.add("Gemini AI Chat Stream", success, f"Latency: {round(latency, 2)}s, Query: '{body.get('query')}'")
    except Exception as e:
        report.add("Gemini AI Chat Stream", False, str(e))

def test_rate_limiting():
    # Make multiple rapid requests to trigger the rate limiter (limit: 120 per minute)
    # We can query "/" endpoint rapidly to trigger 429
    triggered = False
    details = ""
    print("Testing Rate Limiter (Triggering 120+ requests)...")
    for i in range(130):
        try:
            req = urllib.request.Request(f"{BASE_URL}/", method="GET")
            with urllib.request.urlopen(req, timeout=2) as r:
                pass
        except urllib.error.HTTPError as e:
            if e.code == 429:
                triggered = True
                details = f"HTTP 429 Triggered at request {i+1}"
                break
        except Exception as e:
            details = f"Error: {str(e)}"
            break
            
    report.add("Rate Limiting Middleware Check", triggered, details if triggered else "Completed 130 requests without hitting 429 limit")

def run_all_tests():
    print("==================================================")
    print("        ARACHNE TACTICAL TEST SUITE STARTING      ")
    print("==================================================\n")
    
    test_root_endpoint()
    test_incorrect_login()
    token, cookie = test_correct_login_and_headers()
    test_refresh_token(cookie)
    test_patrol_predictions_endpoint(token)
    test_ai_insights_chat(token)
    test_rate_limiting()
    
    print("\n==================================================")
    print("               TEST REPORT SUMMARY                ")
    print("==================================================")
    print(f"TOTAL RUN: {report.passed + report.failed}")
    print(f"PASSED:    {report.passed}")
    print(f"FAILED:    {report.failed}")
    print("==================================================")
    
    if report.failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_all_tests()
