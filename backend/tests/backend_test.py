"""
Backend API tests for MakeYourVacation.in — iteration 2
Covers: packages, auth, admin CRUD, bookings (with references + emails),
admin bookings filters/stats/CSV/PATCH.
"""
import os
import re
import time
import uuid
import pytest
import requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for REACT_APP_BACKEND_URL
load_dotenv(Path("/app/frontend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Mahesh@6976"

REFERENCE_RE = re.compile(r"^MYV-\d{8}-\d{4}$")


# ============ Fixtures ============
@pytest.fixture()
def http():
    """Fresh unauth session per test to avoid cookie contamination from login tests."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="session")
def admin_session(admin_token):
    """Session with Bearer auth."""
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}",
    })
    return s


# ============ Public: Packages ============
class TestPackages:
    def test_list_packages_returns_8(self, http):
        r = http.get(f"{API}/packages")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 8

    def test_list_featured_packages(self, http):
        r = http.get(f"{API}/packages", params={"featured": "true"})
        assert r.status_code == 200
        assert all(p.get("featured") is True for p in r.json())

    def test_get_package_by_id(self, http):
        pkg = http.get(f"{API}/packages").json()[0]
        r2 = http.get(f"{API}/packages/{pkg['id']}")
        assert r2.status_code == 200
        assert r2.json()["id"] == pkg["id"]

    def test_get_package_invalid_id_404(self, http):
        r = http.get(f"{API}/packages/nonexistent-id-xxx")
        assert r.status_code == 404


# ============ Auth ============
class TestAuth:
    def test_login_success_sets_cookie_and_token(self, http):
        r = http.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data.get("username") == "admin"
        assert isinstance(data.get("token"), str) and len(data["token"]) > 20
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token" in set_cookie
        assert "HttpOnly" in set_cookie or "httponly" in set_cookie.lower()

    def test_login_wrong_password(self, http):
        r = http.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": "wrong"})
        assert r.status_code == 401

    def test_me_without_auth_401(self, http):
        r = requests.Session().get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_bearer(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json().get("username") == "admin"


# ============ Admin CRUD ============
class TestAdminPackages:
    _created_id = None

    def test_create_without_auth_401(self, http):
        r = http.post(f"{API}/admin/packages", json={
            "name": "TEST_pkg", "destination": "Test", "duration": "1D",
            "price": 1, "hero_image": "https://example.com/x.jpg",
        })
        assert r.status_code == 401

    def test_create_package(self, admin_session):
        payload = {
            "name": "TEST_pkg_" + uuid.uuid4().hex[:6],
            "destination": "TestDestination",
            "duration": "3 Days / 2 Nights",
            "price": 12345,
            "hero_image": "https://example.com/x.jpg",
            "gallery": ["https://example.com/g1.jpg"],
            "short_description": "test",
            "highlights": ["a", "b"],
            "itinerary": [{"day": 1, "title": "d1", "description": "desc"}],
            "inclusions": ["inc"],
            "exclusions": ["exc"],
            "hotel_details": "h",
            "meals": "m",
            "transportation": "t",
            "faqs": [{"question": "q?", "answer": "a."}],
            "featured": False,
        }
        r = admin_session.post(f"{API}/admin/packages", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        TestAdminPackages._created_id = data["id"]

    def test_delete_package(self, admin_session):
        pkg_id = TestAdminPackages._created_id
        assert pkg_id
        r = admin_session.delete(f"{API}/admin/packages/{pkg_id}")
        assert r.status_code == 200
        r2 = requests.get(f"{API}/packages/{pkg_id}")
        assert r2.status_code == 404


# ============ Bookings — references, sequential, emails ============
class TestBookingsFlow:
    _first_ref = None
    _first_id = None
    _second_ref = None
    _second_id = None

    def _payload(self, suffix=""):
        return {
            "full_name": f"TEST_User{suffix}",
            "mobile": "9999999999",
            "email": f"test_user{suffix.lower()}@example.com",
            "destination": "Goa",
            "travel_date": "2026-05-01",
            "adults": 2,
            "children": 1,
            "package_name": "Serene Goa Getaway",
            "message": f"Test booking {suffix}",
        }

    def test_create_booking_returns_reference(self, http):
        r = http.post(f"{API}/bookings", json=self._payload("_A"))
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert "reference" in data
        assert REFERENCE_RE.match(data["reference"]), f"Bad reference format: {data['reference']}"
        # Reference date matches today (UTC)
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        assert today in data["reference"]
        assert "booking_id" in data
        assert isinstance(data.get("admin_email_sent"), bool)
        assert isinstance(data.get("customer_email_sent"), bool)
        TestBookingsFlow._first_ref = data["reference"]
        TestBookingsFlow._first_id = data["booking_id"]

    def test_second_booking_is_sequential(self, http):
        r = http.post(f"{API}/bookings", json=self._payload("_B"))
        assert r.status_code == 200
        data = r.json()
        assert REFERENCE_RE.match(data["reference"])
        TestBookingsFlow._second_ref = data["reference"]
        TestBookingsFlow._second_id = data["booking_id"]
        # Parse trailing 4-digit seq of both — second should be > first
        seq1 = int(TestBookingsFlow._first_ref.split("-")[-1])
        seq2 = int(TestBookingsFlow._second_ref.split("-")[-1])
        # In parallel test runs other bookings may be interleaved; just ensure sequence advances.
        assert seq2 > seq1, f"Expected monotonically increasing refs, got {seq1} → {seq2}"

    def test_booking_invalid_email_422(self, http):
        p = self._payload("_bad")
        p["email"] = "not-an-email"
        r = http.post(f"{API}/bookings", json=p)
        assert r.status_code == 422

    def test_email_flags_present(self, http):
        """Both admin_email_sent and customer_email_sent must be present as booleans."""
        r = http.post(f"{API}/bookings", json=self._payload("_email"))
        assert r.status_code == 200
        data = r.json()
        assert "admin_email_sent" in data
        assert "customer_email_sent" in data
        # We don't force them True (SMTP may fail on this env), but must be booleans.
        assert isinstance(data["admin_email_sent"], bool)
        assert isinstance(data["customer_email_sent"], bool)


# ============ Admin bookings: filters, stats, CSV, PATCH ============
class TestAdminBookings:
    def test_list_no_auth_401(self, http):
        r = http.get(f"{API}/admin/bookings")
        assert r.status_code == 401

    def test_list_authed(self, admin_session):
        r = admin_session.get(f"{API}/admin/bookings")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_filter_by_status(self, admin_session):
        r = admin_session.get(f"{API}/admin/bookings", params={"status": "New"})
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        # All returned must have status=New
        for d in docs:
            assert d.get("status") == "New"

    def test_filter_by_q_search(self, admin_session):
        # Create a booking in this worker to guarantee its presence & known reference.
        payload = {
            "full_name": "TEST_SearchUser",
            "mobile": "9999999999",
            "email": "test_search@example.com",
            "destination": "Kashmir",
            "travel_date": "2026-06-15",
            "adults": 2,
            "children": 0,
            "package_name": "Enchanting Kashmir",
            "message": "Search test",
        }
        cr = requests.post(f"{API}/bookings", json=payload)
        assert cr.status_code == 200
        ref = cr.json()["reference"]
        r = admin_session.get(f"{API}/admin/bookings", params={"q": ref})
        assert r.status_code == 200
        docs = r.json()
        assert any(d.get("reference") == ref for d in docs), f"Search for {ref} should return it"

    def test_filter_by_date_range(self, admin_session):
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        r = admin_session.get(f"{API}/admin/bookings", params={"from": today, "to": today})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        # Should contain today's bookings
        assert len(r.json()) >= 1

    def test_stats(self, admin_session):
        r = admin_session.get(f"{API}/admin/bookings/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert isinstance(data["total"], int)
        assert "by_status" in data
        for s in ["New", "Contacted", "Confirmed", "Cancelled", "Completed"]:
            assert s in data["by_status"], f"Missing status bucket: {s}"
            assert isinstance(data["by_status"][s], int)
        # Sum of buckets should not exceed total
        assert sum(data["by_status"].values()) <= data["total"]

    def test_export_csv_no_auth_401(self, http):
        r = http.get(f"{API}/admin/bookings/export.csv")
        assert r.status_code == 401

    def test_export_csv(self, admin_session):
        r = admin_session.get(f"{API}/admin/bookings/export.csv")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        cd = r.headers.get("content-disposition", "")
        assert "attachment" in cd and ".csv" in cd
        text = r.text
        # Header row
        expected_headers = [
            "Reference", "Status", "Created At", "Full Name", "Email", "Mobile",
            "Destination", "Package", "Travel Date", "Adults", "Children",
            "Message", "Admin Email Sent", "Customer Email Sent"
        ]
        first_line = text.splitlines()[0]
        for h in expected_headers:
            assert h in first_line, f"Missing CSV header: {h}"

    def test_patch_status_valid(self, admin_session):
        # Create fresh booking in this worker
        cr = requests.post(f"{API}/bookings", json={
            "full_name": "TEST_PatchUser", "mobile": "9999999999",
            "email": "test_patch@example.com", "destination": "Ooty",
            "travel_date": "2026-07-01", "adults": 1, "children": 0,
            "package_name": "Ooty Hill Escape", "message": "Patch test",
        })
        assert cr.status_code == 200
        booking_id = cr.json()["booking_id"]
        r = admin_session.patch(f"{API}/admin/bookings/{booking_id}", json={"status": "Contacted"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "Contacted"
        # Verify via list filter
        r2 = admin_session.get(f"{API}/admin/bookings", params={"status": "Contacted"})
        assert any(d.get("id") == booking_id for d in r2.json())

    def test_patch_status_invalid_422(self, admin_session):
        # Create fresh booking
        cr = requests.post(f"{API}/bookings", json={
            "full_name": "TEST_PatchBad", "mobile": "9999999999",
            "email": "test_patch_bad@example.com", "destination": "Goa",
            "travel_date": "2026-07-01", "adults": 1, "children": 0,
            "message": "Patch bad test",
        })
        assert cr.status_code == 200
        booking_id = cr.json()["booking_id"]
        r = admin_session.patch(f"{API}/admin/bookings/{booking_id}", json={"status": "Foo"})
        assert r.status_code == 422

    def test_patch_status_not_found_404(self, admin_session):
        r = admin_session.patch(f"{API}/admin/bookings/nonexistent-uuid", json={"status": "New"})
        assert r.status_code == 404


# ============ Phone number check ============
class TestPhoneNumber:
    def test_customer_email_contains_new_phone(self):
        """server.py's email templates must reference the corrected phone."""
        text = Path("/app/backend/server.py").read_text()
        assert "7569508416" in text
        assert "7569805416" not in text  # old number gone from backend
