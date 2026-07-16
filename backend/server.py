from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import smtplib
import asyncio
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ============ Setup ============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

app = FastAPI(title="MakeYourVacation.in API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============ Auth utils ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.admins.find_one({"username": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ============ Models ============
class LoginIn(BaseModel):
    username: str
    password: str

class ItineraryDay(BaseModel):
    day: int
    title: str
    description: str

class FAQItem(BaseModel):
    question: str
    answer: str

class PackageIn(BaseModel):
    name: str
    destination: str
    duration: str
    price: float
    hero_image: str
    gallery: List[str] = []
    short_description: str = ""
    highlights: List[str] = []
    itinerary: List[ItineraryDay] = []
    inclusions: List[str] = []
    exclusions: List[str] = []
    hotel_details: str = ""
    meals: str = ""
    transportation: str = ""
    faqs: List[FAQItem] = []
    featured: bool = False

class PackageOut(PackageIn):
    id: str
    created_at: str
    updated_at: str

class BookingIn(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    destination: str
    travel_date: str
    adults: int
    children: int = 0
    package_id: Optional[str] = None
    package_name: Optional[str] = None
    message: str = ""


# ============ Email service ============
def _send_email_sync(subject: str, html_body: str):
    gmail_user = os.environ['GMAIL_USER']
    gmail_pass = os.environ['GMAIL_APP_PASSWORD'].replace(" ", "")
    to_addr = os.environ['BOOKING_EMAIL_TO']

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"MakeYourVacation.in <{gmail_user}>"
    msg["To"] = to_addr
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, [to_addr], msg.as_string())

async def send_booking_email(booking: dict):
    subject = f"New Booking Inquiry — {booking.get('destination') or booking.get('package_name') or 'Trip'}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background:#f7f7f7;">
      <div style="background:#071E3D; color:#D4AF37; padding:24px; text-align:center;">
        <h1 style="margin:0; font-family: 'Playfair Display', serif;">MakeYourVacation.in</h1>
        <p style="margin:6px 0 0; color:#fff;">New Booking Inquiry</p>
      </div>
      <div style="background:#fff; padding:24px; color:#333;">
        <h2 style="color:#071E3D;">Customer Details</h2>
        <p><b>Name:</b> {booking['full_name']}</p>
        <p><b>Email:</b> {booking['email']}</p>
        <p><b>Mobile:</b> {booking['mobile']}</p>
        <h2 style="color:#071E3D;">Trip Details</h2>
        <p><b>Destination:</b> {booking['destination']}</p>
        <p><b>Package:</b> {booking.get('package_name') or '—'}</p>
        <p><b>Travel Date:</b> {booking['travel_date']}</p>
        <p><b>Adults:</b> {booking['adults']} &nbsp; <b>Children:</b> {booking.get('children', 0)}</p>
        <h2 style="color:#071E3D;">Message</h2>
        <p style="white-space:pre-wrap;">{booking.get('message') or '—'}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
        <p style="color:#888; font-size:12px;">Received at {datetime.now(timezone.utc).strftime('%d %b %Y, %H:%M UTC')}</p>
      </div>
    </div>
    """
    try:
        await asyncio.to_thread(_send_email_sync, subject, html)
        return True
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return False


# ============ Helpers ============
def pkg_to_out(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "destination": doc["destination"],
        "duration": doc["duration"],
        "price": doc["price"],
        "hero_image": doc["hero_image"],
        "gallery": doc.get("gallery", []),
        "short_description": doc.get("short_description", ""),
        "highlights": doc.get("highlights", []),
        "itinerary": doc.get("itinerary", []),
        "inclusions": doc.get("inclusions", []),
        "exclusions": doc.get("exclusions", []),
        "hotel_details": doc.get("hotel_details", ""),
        "meals": doc.get("meals", ""),
        "transportation": doc.get("transportation", ""),
        "faqs": doc.get("faqs", []),
        "featured": doc.get("featured", False),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }


# ============ Routes ============
@api.get("/")
async def root():
    return {"message": "MakeYourVacation.in API is live"}


# Auth
@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    user = await db.admins.find_one({"username": payload.username.strip().lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user["username"])
    response.set_cookie(
        key="access_token", value=token, httponly=True,
        secure=True, samesite="none", max_age=12*3600, path="/",
    )
    return {"username": user["username"], "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return {"username": admin["username"]}


# Packages (public)
@api.get("/packages")
async def list_packages(featured: Optional[bool] = None):
    query = {}
    if featured is not None:
        query["featured"] = featured
    docs = await db.packages.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [pkg_to_out(d) for d in docs]

@api.get("/packages/{pkg_id}")
async def get_package(pkg_id: str):
    doc = await db.packages.find_one({"id": pkg_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg_to_out(doc)


# Packages (admin)
@api.post("/admin/packages")
async def create_package(payload: PackageIn, admin=Depends(get_current_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now
    doc["updated_at"] = now
    await db.packages.insert_one(doc)
    doc.pop("_id", None)
    return pkg_to_out(doc)

@api.put("/admin/packages/{pkg_id}")
async def update_package(pkg_id: str, payload: PackageIn, admin=Depends(get_current_admin)):
    doc = payload.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.packages.update_one({"id": pkg_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    updated = await db.packages.find_one({"id": pkg_id}, {"_id": 0})
    return pkg_to_out(updated)

@api.delete("/admin/packages/{pkg_id}")
async def delete_package(pkg_id: str, admin=Depends(get_current_admin)):
    result = await db.packages.delete_one({"id": pkg_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"ok": True}


# Bookings
@api.post("/bookings")
async def create_booking(payload: BookingIn):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["email_sent"] = False
    await db.bookings.insert_one(doc)
    sent = await send_booking_email(doc)
    if sent:
        await db.bookings.update_one({"id": doc["id"]}, {"$set": {"email_sent": True}})
    doc.pop("_id", None)
    doc["email_sent"] = sent
    return {"ok": True, "message": "Thank you! Your booking inquiry has been received. Our team will contact you shortly.", "booking_id": doc["id"], "email_sent": sent}

@api.get("/admin/bookings")
async def list_bookings(admin=Depends(get_current_admin)):
    docs = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# ============ Seeders ============
DEFAULT_PACKAGES = [
    {
        "name": "Enchanting Kashmir",
        "destination": "Kashmir",
        "duration": "6 Days / 5 Nights",
        "price": 32999,
        "hero_image": "https://images.unsplash.com/photo-1666545381732-b1cc6785ce3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxrYXNobWlyJTIwbW91bnRhaW5zJTIwZGFsJTIwbGFrZXxlbnwwfHx8fDE3ODQyMjk0Mzd8MA&ixlib=rb-4.1.0&q=85",
        "short_description": "Shikara rides on Dal Lake, snow-capped Gulmarg peaks, and blooming meadows of Pahalgam.",
        "highlights": ["Deluxe Houseboat Stay", "Gulmarg Gondola Ride", "Pahalgam Valley", "Sonamarg Excursion"],
        "featured": True,
    },
    {
        "name": "Majestic Manali",
        "destination": "Manali",
        "duration": "5 Days / 4 Nights",
        "price": 21999,
        "hero_image": "https://images.unsplash.com/photo-1619344901057-d4dbeced24af?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHw0fHxtYW5hbGklMjBzbm93JTIwbW91bnRhaW5zfGVufDB8fHx8MTc4NDIyOTQzN3ww&ixlib=rb-4.1.0&q=85",
        "short_description": "Snow-clad Solang Valley, Rohtang Pass, and riverside luxury retreats.",
        "highlights": ["Solang Valley Adventure", "Rohtang Pass", "Hadimba Temple", "Riverside Resort"],
        "featured": True,
    },
    {
        "name": "Serene Goa Getaway",
        "destination": "Goa",
        "duration": "4 Days / 3 Nights",
        "price": 18999,
        "hero_image": "https://images.unsplash.com/photo-1642516864726-a243f416fc00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxnb2ElMjBiZWFjaCUyMGx1eHVyeXxlbnwwfHx8fDE3ODQyMjk0NDh8MA&ixlib=rb-4.1.0&q=85",
        "short_description": "Sunset cruises, pristine beaches, Portuguese charm and beachfront villas.",
        "highlights": ["Beachfront Villa", "Sunset Cruise", "Water Sports", "Old Goa Tour"],
        "featured": True,
    },
    {
        "name": "Backwaters of Kerala",
        "destination": "Kerala",
        "duration": "6 Days / 5 Nights",
        "price": 29999,
        "hero_image": "https://images.unsplash.com/photo-1609828913552-f9138ed9e42d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxrZXJhbGElMjBiYWNrd2F0ZXJzJTIwbHV4dXJ5JTIwYm9hdHxlbnwwfHx8fDE3ODQyMjk0Mzd8MA&ixlib=rb-4.1.0&q=85",
        "short_description": "Premium houseboat, Munnar hills, and Ayurvedic spa experiences.",
        "highlights": ["Premium Houseboat", "Munnar Tea Gardens", "Ayurveda Spa", "Cochin Heritage Tour"],
        "featured": True,
    },
    {
        "name": "Ooty Hill Escape",
        "destination": "Ooty",
        "duration": "4 Days / 3 Nights",
        "price": 17999,
        "hero_image": "https://images.unsplash.com/photo-1455157823797-3019317cbcf0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwxfHx0ZWElMjBnYXJkZW4lMjBtdW5uYXJ8ZW58MHx8fHwxNzg0MjI5NDU0fDA&ixlib=rb-4.1.0&q=85",
        "short_description": "Nilgiri toy train, botanical gardens, and colonial-era luxury resorts.",
        "highlights": ["Nilgiri Toy Train", "Botanical Gardens", "Doddabetta Peak", "Colonial Resort Stay"],
        "featured": False,
    },
    {
        "name": "Munnar Tea Trails",
        "destination": "Munnar",
        "duration": "4 Days / 3 Nights",
        "price": 19999,
        "hero_image": "https://images.unsplash.com/photo-1658051161493-1d311c4c7b4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwzfHx0ZWElMjBnYXJkZW4lMjBtdW5uYXJ8ZW58MHx8fHwxNzg0MjI5NDU0fDA&ixlib=rb-4.1.0&q=85",
        "short_description": "Rolling tea estates, misty valleys, and cardamom-scented luxury resorts.",
        "highlights": ["Tea Museum", "Eravikulam National Park", "Mattupetty Dam", "Estate Resort"],
        "featured": False,
    },
    {
        "name": "Andaman Island Bliss",
        "destination": "Andaman",
        "duration": "6 Days / 5 Nights",
        "price": 42999,
        "hero_image": "https://images.unsplash.com/photo-1722428667804-4cc2f260848b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHw0fHx0cm9waWNhbCUyMGJlYWNoJTIwcmVzb3J0fGVufDB8fHx8MTc4NDIyOTQ1NHww&ixlib=rb-4.1.0&q=85",
        "short_description": "Havelock Island, scuba diving, and pristine white-sand beaches.",
        "highlights": ["Radhanagar Beach", "Scuba Diving", "Havelock Island", "Cellular Jail Tour"],
        "featured": True,
    },
    {
        "name": "Leh Ladakh Expedition",
        "destination": "Leh Ladakh",
        "duration": "7 Days / 6 Nights",
        "price": 38999,
        "hero_image": "https://images.unsplash.com/photo-1633259422382-5ead30efb697?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxsZWglMjBsYWRha2glMjBsYW5kc2NhcGV8ZW58MHx8fHwxNzg0MjI5NDQ4fDA&ixlib=rb-4.1.0&q=85",
        "short_description": "Pangong Lake, Nubra Valley dunes, and monastery trails at 11,000 ft.",
        "highlights": ["Pangong Lake", "Nubra Valley", "Khardung La Pass", "Monastery Trail"],
        "featured": True,
    },
]

def _fill_defaults(p: dict) -> dict:
    p.setdefault("gallery", [p["hero_image"]])
    p.setdefault("itinerary", [
        {"day": 1, "title": "Arrival & Welcome", "description": f"Arrive at {p['destination']}. Welcome drink and check-in to your premium hotel. Evening at leisure."},
        {"day": 2, "title": "Local Sightseeing", "description": "Explore top attractions with a private guide. Enjoy authentic regional cuisine."},
        {"day": 3, "title": "Signature Experience", "description": f"Full-day curated experience unique to {p['destination']}."},
        {"day": 4, "title": "Departure", "description": "Breakfast and transfer to airport / station with memories that last a lifetime."},
    ])
    p.setdefault("inclusions", [
        "Premium hotel accommodation",
        "Daily breakfast & dinner",
        "Private A/C transportation",
        "Professional English-speaking guide",
        "All sightseeing as per itinerary",
        "Airport transfers",
    ])
    p.setdefault("exclusions", [
        "Airfare / train fare",
        "Personal expenses & tips",
        "Travel insurance",
        "Any meal or activity not mentioned",
    ])
    p.setdefault("hotel_details", "4-star / 5-star luxury hotels with premium amenities, mountain / beach view rooms wherever applicable.")
    p.setdefault("meals", "Daily breakfast and dinner included. Lunch at leisure to explore local cuisine.")
    p.setdefault("transportation", "Private air-conditioned vehicle throughout your journey with a professional chauffeur.")
    p.setdefault("faqs", [
        {"question": "Is this package customisable?", "answer": "Yes, every itinerary can be tailored to your preferences — dates, hotels, meals and experiences."},
        {"question": "What is the best time to visit?", "answer": f"{p['destination']} is a year-round destination; our travel experts will suggest the ideal season for you."},
        {"question": "What is the cancellation policy?", "answer": "Free cancellation up to 30 days before travel. Please refer to detailed terms shared with your itinerary."},
    ])
    return p


async def seed_admin():
    username = os.environ.get("ADMIN_USERNAME", "admin").strip().lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.admins.find_one({"username": username})
    if not existing:
        await db.admins.insert_one({
            "username": username,
            "password_hash": hash_password(password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin: {username}")
    elif not verify_password(password, existing["password_hash"]):
        await db.admins.update_one({"username": username}, {"$set": {"password_hash": hash_password(password)}})
        logger.info(f"Updated admin password for: {username}")


async def seed_packages():
    count = await db.packages.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    for p in DEFAULT_PACKAGES:
        doc = _fill_defaults(dict(p))
        doc["id"] = str(uuid.uuid4())
        doc["created_at"] = now
        doc["updated_at"] = now
        await db.packages.insert_one(doc)
    logger.info(f"Seeded {len(DEFAULT_PACKAGES)} default packages")


@app.on_event("startup")
async def on_startup():
    await seed_admin()
    await seed_packages()

@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# Register router & CORS
app.include_router(api)

_allowed = [o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
