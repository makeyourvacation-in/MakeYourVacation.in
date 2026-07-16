from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import io
import csv
import logging
import uuid
import smtplib
import asyncio
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ============ Setup ============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

CONTACT_PHONE = "+91 7569508416"
CONTACT_PHONE_INTL = "917569508416"
CONTACT_EMAIL = "makeyourvacation.in@gmail.com"

app = FastAPI(title="MakeYourVacation.in API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BOOKING_STATUSES = ["New", "Contacted", "Confirmed", "Cancelled", "Completed"]


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

class BookingStatusUpdate(BaseModel):
    status: Literal["New", "Contacted", "Confirmed", "Cancelled", "Completed"]


# ============ Email service ============
def _send_email_sync(to_addr: str, subject: str, html_body: str, reply_to: str = None):
    gmail_user = os.environ['GMAIL_USER']
    gmail_pass = os.environ['GMAIL_APP_PASSWORD'].replace(" ", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"MakeYourVacation.in <{gmail_user}>"
    msg["To"] = to_addr
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
        server.login(gmail_user, gmail_pass)
        server.sendmail(gmail_user, [to_addr], msg.as_string())


def _luxury_email_shell(inner_html: str, headline: str = "MakeYourVacation.in", subline: str = "") -> str:
    return f"""
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; background:#F7F7F7; padding: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#071E3D; border-radius:16px 16px 0 0;">
        <tr><td style="padding:36px 32px; text-align:center;">
          <div style="color:#D4AF37; font-family:'Playfair Display',Georgia,serif; font-size:30px; font-weight:600; letter-spacing:0.5px;">{headline}</div>
          <div style="color:#FFFFFF; font-size:13px; letter-spacing:3px; text-transform:uppercase; margin-top:8px;">{subline}</div>
        </td></tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:0 0 16px 16px;">
        <tr><td style="padding:32px; color:#333;">
          {inner_html}
        </td></tr>
      </table>
      <div style="text-align:center; padding:24px 12px; color:#888; font-size:12px;">
        <div>Need help? WhatsApp / Call <a href="https://wa.me/{CONTACT_PHONE_INTL}" style="color:#071E3D; text-decoration:none;"><b>{CONTACT_PHONE}</b></a> · <a href="mailto:{CONTACT_EMAIL}" style="color:#071E3D; text-decoration:none;">{CONTACT_EMAIL}</a></div>
        <div style="margin-top:8px;">© 2026 MakeYourVacation.in — Curated Luxury Journeys</div>
      </div>
    </div>
    """


def _admin_email_html(b: dict) -> str:
    inner = f"""
      <div style="display:inline-block; background:#D4AF37; color:#071E3D; font-weight:700; padding:6px 14px; border-radius:20px; letter-spacing:2px; font-size:11px; text-transform:uppercase;">Booking Reference · {b['reference']}</div>
      <h2 style="color:#071E3D; margin:18px 0 8px; font-family:'Playfair Display',Georgia,serif;">New Booking Inquiry</h2>
      <p style="color:#555; margin:0 0 24px;">A new customer has submitted a booking inquiry through the website.</p>

      <h3 style="color:#071E3D; border-bottom:2px solid #D4AF37; padding-bottom:6px;">Customer</h3>
      <p style="margin:4px 0;"><b>Name:</b> {b['full_name']}</p>
      <p style="margin:4px 0;"><b>Email:</b> <a href="mailto:{b['email']}" style="color:#071E3D;">{b['email']}</a></p>
      <p style="margin:4px 0;"><b>Mobile:</b> <a href="tel:{b['mobile']}" style="color:#071E3D;">{b['mobile']}</a></p>

      <h3 style="color:#071E3D; border-bottom:2px solid #D4AF37; padding-bottom:6px; margin-top:22px;">Trip</h3>
      <p style="margin:4px 0;"><b>Destination:</b> {b['destination']}</p>
      <p style="margin:4px 0;"><b>Package:</b> {b.get('package_name') or '—'}</p>
      <p style="margin:4px 0;"><b>Travel Date:</b> {b['travel_date']}</p>
      <p style="margin:4px 0;"><b>Travellers:</b> {b['adults']} adults · {b.get('children', 0)} children</p>

      <h3 style="color:#071E3D; border-bottom:2px solid #D4AF37; padding-bottom:6px; margin-top:22px;">Message</h3>
      <p style="white-space:pre-wrap; background:#F7F7F7; padding:14px; border-radius:8px; color:#333;">{b.get('message') or '—'}</p>

      <div style="margin-top:26px; padding:14px; background:#071E3D; border-radius:10px; color:#fff; text-align:center;">
        <div style="font-size:12px; color:#D4AF37; letter-spacing:2px; text-transform:uppercase;">Received</div>
        <div>{datetime.now(timezone.utc).strftime('%d %b %Y, %H:%M UTC')}</div>
      </div>
    """
    return _luxury_email_shell(inner, subline="New Booking Inquiry")


def _customer_email_html(b: dict) -> str:
    inner = f"""
      <p style="font-size:16px; color:#071E3D;">Dear <b>{b['full_name']}</b>,</p>
      <p style="color:#555; line-height:1.6;">Thank you for choosing <b>MakeYourVacation.in</b> for your upcoming journey. We've received your booking inquiry and one of our travel concierges will personally reach out to you within <b>24 hours</b> to craft your bespoke itinerary.</p>

      <div style="background:#F7F7F7; border-left:4px solid #D4AF37; padding:18px; border-radius:8px; margin:22px 0;">
        <div style="font-size:11px; color:#D4AF37; letter-spacing:2px; text-transform:uppercase; font-weight:700;">Your Booking Reference</div>
        <div style="font-size:22px; color:#071E3D; font-family:'Playfair Display',Georgia,serif; font-weight:600; margin-top:4px;">{b['reference']}</div>
      </div>

      <h3 style="color:#071E3D; border-bottom:2px solid #D4AF37; padding-bottom:6px;">Your Trip at a Glance</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;">
        <tr><td style="padding:6px 0; color:#888; width:35%;">Package</td><td style="padding:6px 0; color:#071E3D; font-weight:600;">{b.get('package_name') or b['destination']}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Destination</td><td style="padding:6px 0; color:#071E3D; font-weight:600;">{b['destination']}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Travel Date</td><td style="padding:6px 0; color:#071E3D; font-weight:600;">{b['travel_date']}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Travellers</td><td style="padding:6px 0; color:#071E3D; font-weight:600;">{b['adults']} adults · {b.get('children', 0)} children</td></tr>
      </table>

      <div style="text-align:center; margin:28px 0;">
        <a href="https://wa.me/{CONTACT_PHONE_INTL}?text=Hi%2C%20my%20booking%20reference%20is%20{b['reference']}" style="display:inline-block; background:#D4AF37; color:#071E3D; text-decoration:none; padding:14px 32px; border-radius:999px; font-weight:700; letter-spacing:1px;">Chat with us on WhatsApp</a>
      </div>

      <p style="color:#555; line-height:1.6;">Meanwhile, if you have any special requests — dietary preferences, celebration dates, room configurations — simply reply to this email or WhatsApp us at <a href="https://wa.me/{CONTACT_PHONE_INTL}" style="color:#071E3D; font-weight:600;">{CONTACT_PHONE}</a>. We're here to make your journey extraordinary.</p>

      <p style="color:#555; margin-top:26px;">Warm regards,<br/><b style="color:#071E3D; font-family:'Playfair Display',Georgia,serif;">The MakeYourVacation Team</b></p>

      <hr style="border:none; border-top:1px solid #eee; margin:26px 0;"/>
      <div style="color:#888; font-size:13px; text-align:center;">
        <div><b>MakeYourVacation.in</b></div>
        <div style="margin-top:4px;">📞 {CONTACT_PHONE} · ✉️ {CONTACT_EMAIL}</div>
      </div>
    """
    return _luxury_email_shell(inner, subline="Booking Confirmation")


async def send_booking_emails(booking: dict) -> dict:
    admin_to = os.environ.get('BOOKING_EMAIL_TO', CONTACT_EMAIL)
    admin_ok = False
    customer_ok = False
    try:
        await asyncio.to_thread(
            _send_email_sync,
            admin_to,
            f"New Booking · {booking['reference']} · {booking['destination']}",
            _admin_email_html(booking),
            reply_to=booking['email'],
        )
        admin_ok = True
    except Exception as e:
        logger.error(f"Admin email failed: {e}")
    try:
        await asyncio.to_thread(
            _send_email_sync,
            booking['email'],
            f"Your Booking Confirmation · {booking['reference']}",
            _customer_email_html(booking),
        )
        customer_ok = True
    except Exception as e:
        logger.error(f"Customer email failed: {e}")
    return {"admin_email_sent": admin_ok, "customer_email_sent": customer_ok}


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


async def _next_booking_reference() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    doc = await db.counters.find_one_and_update(
        {"_id": f"booking_{today}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    seq = doc["seq"] if doc else 1
    return f"MYV-{today}-{seq:04d}"


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
    doc["reference"] = await _next_booking_reference()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "New"
    doc["admin_email_sent"] = False
    doc["customer_email_sent"] = False

    await db.bookings.insert_one(doc)

    result = await send_booking_emails(doc)
    await db.bookings.update_one(
        {"id": doc["id"]},
        {"$set": {"admin_email_sent": result["admin_email_sent"], "customer_email_sent": result["customer_email_sent"]}}
    )

    doc.pop("_id", None)
    doc.update(result)
    return {
        "ok": True,
        "message": f"Thank you! Your booking inquiry has been received. Our team will contact you shortly. Your reference: {doc['reference']}",
        "booking_id": doc["id"],
        "reference": doc["reference"],
        "admin_email_sent": result["admin_email_sent"],
        "customer_email_sent": result["customer_email_sent"],
    }


@api.get("/admin/bookings")
async def list_bookings(
    admin=Depends(get_current_admin),
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    query = {}
    if status and status != "All":
        query["status"] = status
    if q:
        rx = {"$regex": q, "$options": "i"}
        query["$or"] = [
            {"full_name": rx}, {"email": rx}, {"mobile": rx},
            {"destination": rx}, {"reference": rx}, {"package_name": rx},
        ]
    if from_date or to_date:
        rng = {}
        if from_date: rng["$gte"] = from_date
        if to_date: rng["$lte"] = to_date + "T23:59:59"
        query["created_at"] = rng

    docs = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.patch("/admin/bookings/{booking_id}")
async def update_booking_status(booking_id: str, payload: BookingStatusUpdate, admin=Depends(get_current_admin)):
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated


@api.get("/admin/bookings/export.csv")
async def export_bookings_csv(admin=Depends(get_current_admin)):
    docs = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "Reference", "Status", "Created At", "Full Name", "Email", "Mobile",
        "Destination", "Package", "Travel Date", "Adults", "Children",
        "Message", "Admin Email Sent", "Customer Email Sent"
    ])
    for b in docs:
        writer.writerow([
            b.get("reference", ""), b.get("status", ""), b.get("created_at", ""),
            b.get("full_name", ""), b.get("email", ""), b.get("mobile", ""),
            b.get("destination", ""), b.get("package_name", ""), b.get("travel_date", ""),
            b.get("adults", ""), b.get("children", 0),
            (b.get("message", "") or "").replace("\n", " "),
            b.get("admin_email_sent", False), b.get("customer_email_sent", False),
        ])
    buf.seek(0)
    filename = f"bookings-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@api.get("/admin/bookings/stats")
async def bookings_stats(admin=Depends(get_current_admin)):
    total = await db.bookings.count_documents({})
    stats = {s: await db.bookings.count_documents({"status": s}) for s in BOOKING_STATUSES}
    return {"total": total, "by_status": stats}


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


async def backfill_bookings():
    """Add reference + status to any older bookings that lack them."""
    cursor = db.bookings.find({"$or": [{"reference": {"$exists": False}}, {"status": {"$exists": False}}]}, {"_id": 0, "id": 1})
    async for old in cursor:
        updates = {"status": "New"}
        if "reference" not in old:
            updates["reference"] = await _next_booking_reference()
        await db.bookings.update_one({"id": old["id"]}, {"$set": updates})


@app.on_event("startup")
async def on_startup():
    await seed_admin()
    await seed_packages()
    await backfill_bookings()

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
