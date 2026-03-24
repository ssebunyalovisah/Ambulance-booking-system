-- Database Schema for Ambulance Emergency Booking System (SQLite Compatible)

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_email TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'ADMIN', -- ADMIN, SUPERADMIN
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ambulances Table
CREATE TABLE IF NOT EXISTS ambulances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    ambulance_number TEXT UNIQUE NOT NULL,
    driver_name TEXT NOT NULL,
    driver_contact TEXT NOT NULL,
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, OFFLINE
    latitude REAL,
    longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    emergency_description TEXT,
    pickup_address TEXT NOT NULL,
    pickup_latitude REAL NOT NULL,
    pickup_longitude REAL NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, DISPATCHED, COMPLETED, CANCELLED
    payment_method TEXT, -- CASH, CARD, INSURANCE
    payment_status TEXT DEFAULT 'UNPAID', -- UNPAID, PAID, PENDING_APPROVAL
    total_amount DECIMAL(10, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
