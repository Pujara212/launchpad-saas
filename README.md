# 📚 BookEase — Full-Stack Setup Guide

## 🏗️ Project Structure

```
bookease/
├── server/                        ← Node.js + Express + MySQL Backend
│   ├── src/
│   │   ├── index.js               ← Entry point, Express app
│   │   ├── database/
│   │   │   ├── db.js              ← MySQL pool connection
│   │   │   ├── migrate.js         ← Run once: creates all tables
│   │   │   └── seed.js            ← Run once: seeds demo data
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js ← JWT authentication + role guard
│   │   │   └── validate.middleware.js ← express-validator error handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js     ← POST /api/auth/register, /login, /me
│   │   │   ├── service.routes.js  ← CRUD /api/services
│   │   │   ├── staff.routes.js    ← CRUD /api/staff
│   │   │   ├── availability.routes.js ← GET slots + CRUD windows
│   │   │   ├── booking.routes.js  ← Full booking lifecycle
│   │   │   ├── payment.routes.js  ← Razorpay create-order + verify
│   │   │   └── dashboard.routes.js ← Admin stats + analytics
│   │   ├── services/
│   │   │   ├── booking.service.js ← All 10 validation rules + slot gen
│   │   │   ├── email.service.js   ← Gmail SMTP (4 email templates)
│   │   │   └── razorpay.service.js ← Order creation + signature verify
│   │   └── utils/
│   │       ├── logger.js          ← Winston logger
│   │       └── response.js        ← Standardised HTTP response helpers
│   ├── .env.example               ← Copy to .env and fill in credentials
│   └── package.json
│
└── src/                           ← React + Vite Frontend
    ├── context/
    │   └── AuthContext.tsx        ← JWT auth state management
    ├── lib/
    │   ├── api.ts                 ← Axios instance with JWT interceptor
    │   ├── authService.ts         ← Login / register / me
    │   ├── serviceService.ts      ← Service CRUD API calls
    │   ├── staffService.ts        ← Staff API calls
    │   ├── availabilityService.ts ← Slots + availability windows
    │   ├── bookingService.ts      ← Booking lifecycle + payment
    │   ├── dashboardService.ts    ← Admin analytics
    │   ├── razorpay.ts            ← Razorpay checkout popup
    │   └── validation.ts          ← Frontend form validation
    └── pages/
        ├── AuthPage.tsx           ← Login + Register (single page)
        ├── BookingPage.tsx        ← 5-step booking wizard
        └── admin/
            ├── Dashboard.tsx      ← Live stats + charts
            ├── Bookings.tsx       ← Paginated table + status mgmt
            ├── Services.tsx       ← CRUD services
            ├── Staff.tsx          ← CRUD staff
            └── Availability.tsx   ← Manage working hours
```

---

## 🚀 Step-by-Step Setup

### Step 1 — MySQL Database (MySQL Workbench)

1. Open **MySQL Workbench** and connect to your local server.
2. You do **NOT** need to create the database manually — the migration script creates it.

### Step 2 — Backend Setup

```bash
cd server
cp .env.example .env         # Fill in your credentials
npm install

# Create all tables
node src/database/migrate.js

# Seed demo data (services, staff, availability, admin user)
node src/database/seed.js

# Start development server
npm run dev
# → API running at http://localhost:5000
```

### Step 3 — Environment Variables (`server/.env`)

| Variable | What to set |
|----------|-------------|
| `DB_PASSWORD` | Your MySQL root password |
| `JWT_SECRET` | Any long random string (32+ chars) |
| `MAIL_USER` | Your Gmail address |
| `MAIL_PASS` | Gmail **App Password** (not account password) — [Get it here](https://myaccount.google.com/apppasswords) |
| `ADMIN_EMAIL` | Email that receives new booking alerts |
| `RAZORPAY_KEY_ID` | From [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same place as above |

### Step 4 — Frontend Setup

Create `src/.env` (or `.env.local` at root):
```
VITE_API_URL=http://localhost:5000/api
```

The React frontend is already running in Lovable's preview.

---

## 🔑 Demo Credentials

After running the seed script:
- **Admin:** `admin@bookease.com` / `Admin@123`
- **Customer:** Register a new account via `/login`

---

## ✅ Validation Rules Implemented

| # | Rule | Where |
|---|------|-------|
| 1 | Cannot book in the past | Frontend + Backend |
| 2 | Booking date > current date & time | Frontend + Backend |
| 3 | Today: only future slots shown (30 min buffer) | Frontend + Backend |
| 4 | Slot within staff availability hours | Backend |
| 5 | No overlapping bookings for same staff | Backend |
| 6 | Slot duration matches service duration | Backend |
| 7 | Staff must provide the selected service | Backend |
| 8 | Duplicate booking by same user blocked | Backend |
| 9 | Cancelled slot becomes available again | Backend |
| 10 | Email format, phone format, required fields | Frontend + Backend |

---

## 📧 Email Notifications

Four email events are sent automatically:
1. **Booking Confirmation** → customer (after payment verified)
2. **Admin New Booking Alert** → admin email
3. **Booking Cancellation** → customer
4. **Status Update** → customer (completed, no_show, etc.)

---

## 💳 Razorpay Payment Flow

```
User clicks "Pay & Confirm"
  → POST /api/bookings          (creates pending booking)
  → POST /api/payment/create-order  (Razorpay order)
  → Razorpay popup opens
  → User pays
  → POST /api/payment/verify    (HMAC signature check)
  → Booking → CONFIRMED
  → Confirmation email sent
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/services` | — | List all services |
| POST | `/api/services` | Admin | Create service |
| PUT | `/api/services/:id` | Admin | Update service |
| DELETE | `/api/services/:id` | Admin | Deactivate service |
| GET | `/api/staff` | — | List staff (filter by serviceId) |
| GET | `/api/availability/slots` | — | Get available slots |
| POST | `/api/availability` | Admin | Add availability window |
| GET | `/api/bookings` | JWT | List bookings (admin=all, user=own) |
| POST | `/api/bookings` | JWT | Create booking |
| PATCH | `/api/bookings/:id/status` | Admin | Update booking status |
| DELETE | `/api/bookings/:id` | JWT | Cancel booking |
| POST | `/api/payment/create-order` | JWT | Create Razorpay order |
| POST | `/api/payment/verify` | JWT | Verify payment + confirm booking |
| GET | `/api/dashboard` | Admin | Analytics & stats |
