"""
Backend API tests for MakeYourVacation.in
Covers: packages, auth, admin CRUD, bookings
"""
import os
import time
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env for REACT_APP_BACKEND_URL
load_dotenv(Path("/app/frontend/.env"))

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Mahesh@6976"


# ============ Fixtures ============
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="session")
def admin_session(admin_token):
    """Session with Bearer auth (works reliably over HTTPS regardless of cookie behavior)."""
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
        assert len(data) >= 8, f"Expected at least 8 seeded packages, got {len(data)}"
        # Validate fields on first item
        p = data[0]
        for f in ["id", "name", "destination", "duration", "price", "hero_image",
                  "highlights", "itinerary", "inclusions", "exclusions", "featured",
                  "created_at", "updated_at"]:
            assert f in p, f"Missing field {f}"

    def test_list_featured_packages(self, http):
        r = http.get(f"{API}/packages", params={"featured": "true"})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # There should be at least the seeded featured 6
        assert len(data) >= 6, f"Expected at least 6 featured, got {len(data)}"
        assert all(p.get("featured") is True for p in data)

    def test_get_package_by_id(self, http):
        r = http.get(f"{API}/packages")
        pkg = r.json()[0]
        r2 = http.get(f"{API}/packages/{pkg['id']}")
        assert r2.status_code == 200
        detail = r2.json()
        assert detail["id"] == pkg["id"]
        # Detail-only fields
        for f in ["itinerary", "faqs", "inclusions", "exclusions",
                  "hotel_details", "meals", "transportation"]:
            assert f in detail

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
        # Check Set-Cookie header contains access_token
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token" in set_cookie, f"Missing access_token cookie: {set_cookie}"
        assert "HttpOnly" in set_cookie or "httponly" in set_cookie.lower()

    def test_login_wrong_password(self, http):
        r = http.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": "wrong"})
        assert r.status_code == 401
        assert "Invalid" in r.text

    def test_me_without_auth_401(self, http):
        s = requests.Session()  # no cookies
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_bearer(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json().get("username") == "admin"

    def test_logout_clears_cookie(self, http, admin_token):
        # Include Authorization so logout endpoint doesn't need cookies
        r = http.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        # response should send a Set-Cookie clearing the cookie
        set_cookie = r.headers.get("set-cookie", "")
        assert "access_token" in set_cookie
        # Typically Max-Age=0 or expires past date
        assert "Max-Age=0" in set_cookie or "expires=" in set_cookie.lower() or "1970" in set_cookie


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
            "gallery": [],
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
        assert data["destination"] == payload["destination"]
        assert data["price"] == 12345
        assert isinstance(data["id"], str) and len(data["id"]) > 10
        TestAdminPackages._created_id = data["id"]

        # Verify persistence via public GET
        r2 = requests.get(f"{API}/packages/{data['id']}")
        assert r2.status_code == 200
        assert r2.json()["name"] == payload["name"]

    def test_update_package(self, admin_session):
        pkg_id = TestAdminPackages._created_id
        assert pkg_id, "prior create must succeed"
        # get original
        orig = requests.get(f"{API}/packages/{pkg_id}").json()
        payload = {
            "name": orig["name"] + "_upd",
            "destination": orig["destination"],
            "duration": orig["duration"],
            "price": 22222,
            "hero_image": orig["hero_image"],
            "gallery": orig.get("gallery", []),
            "short_description": orig.get("short_description", ""),
            "highlights": orig.get("highlights", []),
            "itinerary": orig.get("itinerary", []),
            "inclusions": orig.get("inclusions", []),
            "exclusions": orig.get("exclusions", []),
            "hotel_details": orig.get("hotel_details", ""),
            "meals": orig.get("meals", ""),
            "transportation": orig.get("transportation", ""),
            "faqs": orig.get("faqs", []),
            "featured": True,
        }
        time.sleep(1.1)  # ensure updated_at differs
        r = admin_session.put(f"{API}/admin/packages/{pkg_id}", json=payload)
        assert r.status_code == 200, r.text
        upd = r.json()
        assert upd["price"] == 22222
        assert upd["featured"] is True
        assert upd["updated_at"] != orig["updated_at"], "updated_at should change"

        # Verify via GET
        got = requests.get(f"{API}/packages/{pkg_id}").json()
        assert got["price"] == 22222

    def test_delete_package(self, admin_session):
        pkg_id = TestAdminPackages._created_id
        assert pkg_id
        r = admin_session.delete(f"{API}/admin/packages/{pkg_id}")
        assert r.status_code == 200
        # Verify removed
        r2 = requests.get(f"{API}/packages/{pkg_id}")
        assert r2.status_code == 404


class TestAdminBookings:
    def test_bookings_no_auth_401(self, http):
        r = http.get(f"{API}/admin/bookings")
        assert r.status_code == 401

    def test_bookings_authed(self, admin_session):
        r = admin_session.get(f"{API}/admin/bookings")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ============ Bookings ============
class TestBookings:
    def test_create_booking(self, http):
        payload = {
            "full_name": "TEST_User",
            "mobile": "9999999999",
            "email": "test_user@example.com",
            "destination": "Goa",
            "travel_date": "2026-05-01",
            "adults": 2,
            "children": 1,
            "package_name": "Serene Goa Getaway",
            "message": "Test booking",
        }
        r = http.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert "Thank you" in data["message"]
        assert "booking_id" in data
        assert "email_sent" in data

    def test_booking_invalid_email_422(self, http):
        payload = {
            "full_name": "TEST", "mobile": "9999999999",
            "email": "not-an-email", "destination": "Goa",
            "travel_date": "2026-05-01", "adults": 1,
        }
        r = http.post(f"{API}/bookings", json=payload)
        assert r.status_code == 422
