-- Database Schema for Ambulance Emergency Booking System (SQLite Compatible)

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    logo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin', -- admin, super_admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    driver_id TEXT UNIQUE NOT NULL, -- e.g. DRV-00123
    phone TEXT NOT NULL,
    photo TEXT,
    status TEXT DEFAULT 'available', -- available, on_trip, offline
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ambulances Table
CREATE TABLE IF NOT EXISTS ambulances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    ambulance_number TEXT UNIQUE NOT NULL,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    gps_capable BOOLEAN DEFAULT 1,
    status TEXT DEFAULT 'available', -- available, busy, inactive
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY, -- UUID
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_description TEXT NOT NULL,
    payment_method TEXT, -- cash, mobile_money, card
    patient_lat REAL,
    patient_lng REAL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, dispatched, arrived, completed, cancelled
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, confirmed
    rating INTEGER,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
    pesapal_tracking_id TEXT UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, failed, cancelled
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens Table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
