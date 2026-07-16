# MakeYourVacation.in — Product Requirements Document

## Original Problem Statement
Build a modern, premium, luxury travel agency website for MakeYourVacation.in that gives visitors the feeling of booking with a high-end travel company. Customers can browse travel packages, view details, and submit booking requests (emailed to `makeyourvacation.in@gmail.com`). Include a secure Admin Dashboard for adding/editing/removing packages.

## Design System
- **Palette**: Deep Navy #071E3D · Royal Gold #D4AF37 · White #FFFFFF · Soft Gray #F7F7F7
- **Type**: Playfair Display (headings), Poppins (body), Montserrat (buttons/eyebrows)
- **Effects**: Glassmorphism, gold underline links, image zoom-on-hover, luxury shadows, staggered fade-up entrance animations, sticky transparent→solid nav, luxury loader

## Architecture
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + sonner
- **Backend**: FastAPI + Motor (async MongoDB) + JWT (PyJWT) + bcrypt + Gmail SMTP (smtplib)
- **Auth**: httpOnly cookie (samesite=none, secure) + Bearer token fallback

## User Personas
1. **Traveller (Priya, 28–55)** — Discerning Indian traveller seeking curated, premium holidays. Browses packages, reads itineraries, submits booking inquiries.
2. **Admin (Mahesh)** — Business owner of MakeYourVacation.in. Manages package catalog, monitors inbound bookings from a private dashboard.

## Core Requirements (static)
- Public pages: Home, Packages, Package Details, Destinations, About, Contact
- Package data model: name, destination, duration, price, hero image, gallery, highlights, itinerary (days), inclusions, exclusions, hotel, meals, transport, FAQs, featured flag
- Booking form → validated → stored in DB → email sent to `makeyourvacation.in@gmail.com` via Gmail SMTP
- Admin: JWT login (username `admin`, password `Mahesh@6976`, seeded on startup), CRUD packages, view bookings, mark featured
- Floating WhatsApp (+91 7569805416), back-to-top, sticky nav, elegant loader

## What's Been Implemented — 2026-02-16
- Backend `/app/backend/server.py`: 8 seeded packages, admin seeding, JWT auth (login/logout/me), package CRUD (public list/get, admin create/update/delete), booking POST with live Gmail SMTP send + DB persistence, admin bookings list.
- Frontend fully built: Navbar (transparent→solid), Home (hero + featured packages + why-us + gallery lightbox + testimonials + CTA), Packages (search + destination filter), PackageDetails (hero + overview + tabs [itinerary, inclusions, hotel & meals, FAQ] + booking sidebar), Destinations (grouped by location), About (stats + values), Contact (booking form + map + contact info), AdminLogin, AdminDashboard (packages grid + bookings table + edit modal with itinerary/FAQ editors + featured toggle + preview).
- Floating WhatsApp + back-to-top + luxury loader.
- Design tokens configured in tailwind.config.js (navy, gold, softgray, playfair/poppins/montserrat).
- Testing subagent: **100% pass** on both backend (17 pytest tests) and frontend (all E2E flows). Real bookings send real emails.

## Prioritised Backlog
### P1 (next up)
- Replace native `<input type=date>` on Contact page with shadcn Calendar/DatePicker for full luxury consistency.
- Admin image upload flow (currently image URL input) — integrate object storage.
- Email confirmation to the customer (currently only admin gets the email).

### P2
- Blog / travel journal section for SEO.
- Multi-currency pricing display.
- WhatsApp deep-link with pre-filled package context.
- Package availability calendar & date-based pricing.
- Reviews collection and moderation from the admin panel.
- Google Analytics integration.
