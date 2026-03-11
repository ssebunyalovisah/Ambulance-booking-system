# Ambulance Emergency Booking System - Architecture Document

## 1. System Architecture & Data Flow
The system follows a modern client-server architecture with real-time bidirectional communication capabilities. 
It consists of three main components:
- **Patient Web App (PWA/Mobile-Optimized)**: A lightweight, fast-loading interface designed for urgent, anonymous use.
- **Admin Dashboard (SPA)**: A secure, map-centric interface for dispatchers and company managers.
- **Central API & Real-time Server**: A monolithic or microservices backend handling business logic, location updates, and dispatch algorithms.

**Data Flow Example (Booking Request)**:
1. User grants location access -> User App connects to Socket.io to stream lat/lng and requests nearby ambulances.
2. User submits Booking Form -> REST API `/api/bookings` creates record.
3. Backend determines closest available ambulance and emits `new_booking_request` event to the specific company's secure Socket room.
4. Admin confirms booking via Dashboard -> REST API `/api/bookings/:id/confirm`.
5. Backend updates UI via Socket `booking_confirmed` event back to the User App.
6. Ambulance driver continuously streams location via their device to Backend -> Backend broadcasts to User App for real-time tracking (Google Maps polyline updates).

## 2. Recommended Technology Stack
- **Frontend (User & Admin)**: React.js (with Vite), TailwindCSS for modern UI. User App should be a PWA (Progressive Web App) to act like a native app without installation.
- **Backend**: Node.js with Express.js (fast, non-blocking I/O perfect for real-time).
- **Database**: PostgreSQL with PostGIS extension for highly efficient spatial/location queries (e.g., finding nearby ambulances within a radius).
- **Real-Time Communication**: Socket.io (robust, supports auto-reconnection and rooms).
- **Mapping & Routing**: Google Maps API (Maps JavaScript API, Places API for address autocomplete, Directions API for ETA/Routing).
- **State Management**: Zustand or Redux Toolkit.
- **Payment Gateway**: Stripe (supports secure, quick temporary holds or direct charges).

## 3. UI / UX Page Structure
### Patient Application (Public)
1. **Landing / Home Page**: Centered around a large, interactive Google Map automatically centered on the user's GPS coordinates. Shows markers for nearby ambulances.
2. **Ambulance Selection Bottom Sheet**: Tapping a marker brings up a sleek, modern card showing the Ambulance Company name, estimated ETA, and a "Request" CTA button.
3. **Emergency Booking Form (Modal/Popup)**: 
   - Fields: Name, Phone (with country code validation), Emergency Description (Textarea), Payment Method selection.
4. **Active Tracking Screen**: Live map locking onto the ambulance coming to the user. Shows ETA countdown, Driver Name, and plate number.
5. **Post-Trip Feedback Page**: Simple 5-star rating UI and text comment box.

*Note on provided UI images*: As you share UI mockups, they should primarily guide the exact layout of the Home Map, the Booking Bottom Sheet, and the Active Tracking dashboard. Modern UI involves minimal clutter—map first, layered floating cards for inputs.

### Admin Dashboard (Secured)
1. **Login Page**: Standard secure login with JWT.
2. **Overview Dashboard**: Metrics like Active Ambulances, Ongoing Trips, Daily Revenue.
3. **Live Dispatch Map**: A large control room map showing all company ambulances and their live statuses (green = available, red = busy, gray = offline).
4. **Bookings Request Board**: A Kanban-style or real-time list of incoming requests. Clicking one shows patient details and location.
5. **Fleet Management**: CRUD table for adding/activating drivers and ambulances.
6. **Payments & Feedback**: Tables to review transactions and driver ratings.

## 4. Database Schema (PostgreSQL)

```sql
-- Users (Track sessions even without login)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  session_token VARCHAR UNIQUE,
  created_at TIMESTAMP
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR,
  contact_email VARCHAR,
  password_hash VARCHAR
);

-- Ambulances
CREATE TABLE ambulances (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  plate_number VARCHAR,
  status VARCHAR DEFAULT 'OFFLINE', -- OFFLINE, AVAILABLE, BUSY
  current_location GEOMETRY(Point, 4326), -- PostGIS point for Lat/Lng
  driver_name VARCHAR,
  driver_phone VARCHAR
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  user_session_id UUID REFERENCES users(id),
  ambulance_id UUID REFERENCES ambulances(id),
  patient_name VARCHAR,
  phone_number VARCHAR,
  description TEXT,
  pickup_location GEOMETRY(Point, 4326),
  status VARCHAR, -- PENDING, ACCEPTED, EN_ROUTE, COMPLETED, CANCELLED
  payment_method VARCHAR,
  payment_status VARCHAR,
  created_at TIMESTAMP
);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT
);
```

## 5. API Structure (REST endpoints)

**Public (Patient) API**:
- `GET /api/public/ambulances/nearby?lat={lat}&lng={lng}&radius=5` (Returns list of available ambulances)
- `POST /api/public/bookings` (Creates a booking request)
- `GET /api/public/bookings/:id` (Poll booking status if Socket reconnects)
- `POST /api/public/bookings/:id/feedback` (Submit rating)

**Admin API (Protected by JWT)**:
- `POST /api/admin/auth/login`
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/ambulances`
- `POST /api/admin/ambulances` (Register new)
- `PUT /api/admin/ambulances/:id/status` (Manual override)
- `GET /api/admin/bookings`
- `PUT /api/admin/bookings/:id/status` (Accept/Reject Request)

## 6. Real-Time Tracking Approach (Socket.io)

**Connection & Rooms:**
1. **Patient tracking**: When a booking is assigned, the patient joins a Socket room: `room_booking_{booking_id}`.
2. **Ambulance location broadcast**: The ambulance driver app/GPS device constantly emits `update_location` to the server.
3. **Server routing**: The server listens to `update_location` and broadcasts it to `room_booking_{booking_id}` and to the Admin's `company_dashboard` room.
4. **Events Flow**:
   - `patient_request` -> Server -> Admins (`new_booking_alert`).
   - `admin_accepts` -> Server -> Patient (`booking_accepted` + ETA).
   - `ambulance_moves` -> Server -> Patient & Admin (`location_synced`).

## 7. Recommended Folder Structure

```text
/ambulance-company-monorepo
│
├── /client-app                 # Patient Facing App (React)
│   ├── /public
│   ├── /src
│   │   ├── /assets
│   │   ├── /components         # Map, BookingForm, DriverCard
│   │   ├── /hooks              # useSocket, useGeolocation
│   │   ├── /pages              # Home, Tracking, Feedback
│   │   ├── /services           # api.js, socket.js
│   │   └── App.jsx
│   └── package.json
│
├── /client-admin               # Admin Dashboard (React)
│   ├── /src
│   │   ├── /components         # Sidebar, StatCards, MapTracker
│   │   ├── /pages              # Login, Dashboard, Fleet, Bookings
│   │   └── /context            # AuthContext
│   └── package.json
│
└── /server                     # Node.js + Express Backend
    ├── /src
    │   ├── /config             # DB, Socket, Environment config
    │   ├── /controllers        # BookingController, MapController
    │   ├── /middlewares        # AuthMiddleware, ErrorHandler
    │   ├── /models             # DB Schema Definitions
    │   ├── /routes             # API endpoints definitions
    │   ├── /sockets            # Socket event listeners/emitters
    │   ├── /utils              # GeoCalc, Distance matrix utils
    │   └── server.js           # Entry point
    └── package.json
```

## 8. Development & Scalability Tips
- **Scalability**: Since real-time location streaming is dense, use **Redis** as an adapter for Socket.io. This allows multiple Node.js server instances to share socket rooms if traffic surges during large scale emergencies.
- **Security**: Though patients don't log in, use localized session tokens (localStorage/cookies) tied to a server-side UUID (`users` table) to prevent spam booking requests. Rate-limit the `POST /api/public/bookings` endpoint by IP.
- **Performance**: Debounce location updates to once every 3-5 seconds to save bandwidth and server processing, and interpolate (smooth out) the marker movement on the frontend React app using framer-motion or Google Maps interpolation algorithms.
