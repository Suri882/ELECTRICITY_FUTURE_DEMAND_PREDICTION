import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_auth_redesign():
    print("======================================================================")
    print("TESTING REDESIGNED AUTHENTICATION FLOW (LOGIN & REGISTRATION)")
    print("======================================================================")

    session = requests.Session()

    # 1. Test Existing User Login
    print("\n1. Testing Existing Registered User Login (rajesh@example.com)...")
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "rajesh@example.com",
        "password": "Password@123"
    })
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "rajesh@example.com"
    assert data["user"]["role"] == "USER"
    print("   [OK] User login successful. Token acquired. Role: USER")

    # 2. Test Invalid Credentials Error Handling
    print("\n2. Testing Invalid Password Rejection & Error Message...")
    res_bad = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "rajesh@example.com",
        "password": "WrongPassword999"
    })
    assert res_bad.status_code == 401, f"Expected 401, got {res_bad.status_code}"
    bad_msg = res_bad.json().get("detail", "")
    assert "Invalid email or password" in bad_msg
    print(f"   [OK] Correctly rejected with friendly error: '{bad_msg}'")

    # 3. Test New User Registration (Name, Email, Password)
    timestamp = int(time.time())
    new_email = f"builder_{timestamp}@energyintel.com"
    print(f"\n3. Testing New User Registration ({new_email})...")
    res_reg = session.post(f"{BASE_URL}/api/auth/register", json={
        "name": f"Engineer Vikram {timestamp}",
        "email": new_email,
        "password": "SecurePassword@123"
    })
    assert res_reg.status_code == 200, f"Expected 200, got {res_reg.status_code}: {res_reg.text}"
    reg_data = res_reg.json()
    new_token = reg_data["access_token"]
    assert reg_data["user"]["role"] == "USER"
    print(f"   [OK] New user registered successfully without requiring admin approval!")

    # 4. Test Immediate Authenticated Access with New Token
    print("\n4. Verifying Session Management & Profile Access (/api/auth/me)...")
    headers = {"Authorization": f"Bearer {new_token}"}
    res_me = session.get(f"{BASE_URL}/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["email"] == new_email
    print(f"   [OK] Session valid. Profile confirmed: {me_data['name']} ({me_data['role']})")

    # 5. Verify Ordinary User Can Access Projects & Dashboard Data
    print("\n5. Verifying New Registered User Can Access Application Features...")
    res_proj = session.get(f"{BASE_URL}/api/projects", headers=headers)
    assert res_proj.status_code == 200
    print(f"   [OK] User can access construction projects repository (count: {len(res_proj.json())})")

    res_peak = session.get(f"{BASE_URL}/api/peak-demand", headers=headers)
    assert res_peak.status_code == 200
    print(f"   [OK] User can access peak demand analysis engine")

    # 6. Verify Admin Privilege Isolation (Ordinary User CANNOT access Admin Endpoints)
    print("\n6. Verifying Privilege Isolation (Ordinary User cannot access admin endpoints)...")
    res_admin = session.get(f"{BASE_URL}/api/admin/users", headers=headers)
    assert res_admin.status_code == 403, f"Expected 403 Forbidden for ordinary user, got {res_admin.status_code}"
    print(f"   [OK] Ordinary user strictly forbidden from admin endpoints (403 Forbidden)")

    # 7. Test Admin User Login
    print("\n7. Testing Admin Login (admin@smartenergy.com)...")
    res_admin_login = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@smartenergy.com",
        "password": "Admin@12345"
    })
    assert res_admin_login.status_code == 200
    admin_data = res_admin_login.json()
    assert admin_data["user"]["role"] == "ADMIN"
    admin_token = admin_data["access_token"]
    print(f"   [OK] Admin authentication successful. Role: ADMIN")

    # Admin CAN access admin endpoints
    res_admin_check = session.get(f"{BASE_URL}/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_check.status_code == 200
    print(f"   [OK] Admin successfully authorized to access admin endpoints")

    # 8. Test Forgot Password Endpoint
    print("\n8. Testing Password Reset (/api/auth/forgot-password)...")
    res_forgot = session.post(f"{BASE_URL}/api/auth/forgot-password", json={
        "email": new_email,
        "new_password": "NewSecurePassword@456",
        "confirm_new_password": "NewSecurePassword@456"
    })
    assert res_forgot.status_code == 200
    print(f"   [OK] Password reset successful. Response: {res_forgot.json()['message']}")

    # Verify login with new password
    res_relogin = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": new_email,
        "password": "NewSecurePassword@456"
    })
    assert res_relogin.status_code == 200
    print(f"   [OK] Successfully logged in with new password!")

    print("\n======================================================================")
    print("ALL AUTHENTICATION TESTS PASSED: 100% SUCCESS")
    print("======================================================================")

if __name__ == "__main__":
    test_auth_redesign()
