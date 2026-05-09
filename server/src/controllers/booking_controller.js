const db = require('../config/db');
const crypto = require('crypto');

const broadcastBookingUpdate = (req, bookingId, eventName, payload = {}) => {
    const io = req.app.get('io');
    if (io) {
        // Emit to the specific booking room (for patient and driver)
        io.to(`room:booking_${bookingId}`).emit(eventName, payload);
        
        // Emit to the company dashboard (for admins)
        if (payload.company_id) {
            io.to(`company_dashboard_${payload.company_id}`).emit(eventName, payload);
        }
        
        // Emit to super admin dashboard
        io.to('super_dashboard').emit(eventName, payload);
        
        // Fallback: some updates might be global if company_id is missing
        if (!payload.company_id) {
            io.emit(eventName, payload);
        }
    }
};

exports.getBookings = async (req, res) => {
    const { company_id, role } = req.user;
    try {
        let queryStr = `
            SELECT b.*, c.name as company_name, d.full_name as driver_name, d.driver_id as driver_uid, a.ambulance_number 
            FROM bookings b
            LEFT JOIN companies c ON b.company_id = c.id
            LEFT JOIN drivers d ON b.driver_id = d.id
            LEFT JOIN ambulances a ON b.ambulance_id = a.id
            WHERE b.company_id = $1 ORDER BY b.created_at DESC
        `;
        let params = [company_id];

        if (role === 'super_admin') {
            queryStr = `
                SELECT b.*, c.name as company_name, d.full_name as driver_name, d.driver_id as driver_uid, a.ambulance_number 
                FROM bookings b
                LEFT JOIN companies c ON b.company_id = c.id
                LEFT JOIN drivers d ON b.driver_id = d.id
                LEFT JOIN ambulances a ON b.ambulance_id = a.id
                ORDER BY b.created_at DESC
            `;
            params = [];
        }

        const result = await db.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getBooking = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT b.*, c.name as company_name, d.full_name as driver_name, d.driver_id as driver_uid, a.ambulance_number 
             FROM bookings b
             LEFT JOIN companies c ON b.company_id = c.id
             LEFT JOIN drivers d ON b.driver_id = d.id
             LEFT JOIN ambulances a ON b.ambulance_id = a.id
             WHERE b.id = $1`, 
            [req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createBooking = async (req, res) => {
    const { patient_name, phone, emergency_description, payment_method, patient_lat, patient_lng, company_id, ambulance_id, driver_id } = req.body;
    const id = crypto.randomUUID();

    try {
        await db.query(
            `INSERT INTO bookings (id, patient_name, phone, emergency_description, payment_method, patient_lat, patient_lng, company_id, ambulance_id, driver_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
            [id, patient_name, phone, emergency_description, payment_method, patient_lat, patient_lng, company_id, ambulance_id || null, driver_id || null]
        );

        const bookingRes = await db.query(
            `SELECT b.*, c.name as company_name, d.full_name as driver_name, d.driver_id as driver_uid, a.ambulance_number 
             FROM bookings b
             LEFT JOIN companies c ON b.company_id = c.id
             LEFT JOIN drivers d ON b.driver_id = d.id
             LEFT JOIN ambulances a ON b.ambulance_id = a.id
             WHERE b.id = $1`, 
            [id]
        );
        const booking = bookingRes.rows[0];

        // Notify admins and drivers via Socket.io
        const io = req.app.get('io');
        if (io) {
            if (booking.company_id) {
                io.to(`company_dashboard_${booking.company_id}`).emit('new_booking', booking);
            }
            io.to('super_dashboard').emit('new_booking', booking);
            // Also global for driver app discovery
            io.emit('new_booking', booking);
        }

        res.status(201).json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const changeStatus = async (id, status, res, req, eventName) => {
    const { ambulance_id, driver_id } = req.body;
    try {
        let queryStr = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP';
        let params = [status];
        
        if (ambulance_id) {
            queryStr += `, ambulance_id = $${params.length + 1}`;
            params.push(ambulance_id);
        }
        if (driver_id) {
            queryStr += `, driver_id = $${params.length + 1}`;
            params.push(driver_id);
        }
        
        params.push(id);
        queryStr += ` WHERE id = $${params.length}`;
        
        await db.query(queryStr, params);
        
        const bookingRes = await db.query(
            `SELECT b.*, c.name as company_name, d.full_name as driver_name, d.driver_id as driver_uid, d.phone as driver_phone, a.ambulance_number 
             FROM bookings b
             LEFT JOIN companies c ON b.company_id = c.id
             LEFT JOIN drivers d ON b.driver_id = d.id
             LEFT JOIN ambulances a ON b.ambulance_id = a.id
             WHERE b.id = $1`, 
            [id]
        );
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
        
        const booking = bookingRes.rows[0];
        
        // Update driver and ambulance status appropriately
        if (status === 'dispatched' || status === 'accepted') {
            if (booking.ambulance_id) await db.query('UPDATE ambulances SET status = $1 WHERE id = $2', ['busy', booking.ambulance_id]);
            if (booking.driver_id) await db.query('UPDATE drivers SET status = $1 WHERE id = $2', ['on_trip', booking.driver_id]);
        } else if (status === 'completed' || status === 'cancelled') {
            if (booking.ambulance_id) await db.query('UPDATE ambulances SET status = $1 WHERE id = $2', ['available', booking.ambulance_id]);
            if (booking.driver_id) await db.query('UPDATE drivers SET status = $1 WHERE id = $2', ['available', booking.driver_id]);
        }

        if (eventName) {
            broadcastBookingUpdate(req, id, eventName, booking);
        }

        // Also broadcast globally if it's a new assignment so the driver app sees it
        if (status === 'accepted') {
            const io = req.app.get('io');
            if (io) {
                io.emit('new_booking', booking);
            }
        }

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.assignBooking = async (req, res) => {
    const { id } = req.params;
    const { ambulance_id, driver_id } = req.body;
    try {
        await db.query('UPDATE bookings SET ambulance_id = $1, driver_id = $2 WHERE id = $3', [ambulance_id, driver_id, id]);
        
        const bookingRes = await db.query(
            `SELECT b.*, c.name as company_name, d.full_name as driver_name, d.driver_id as driver_uid, a.ambulance_number 
             FROM bookings b
             LEFT JOIN companies c ON b.company_id = c.id
             LEFT JOIN drivers d ON b.driver_id = d.id
             LEFT JOIN ambulances a ON b.ambulance_id = a.id
             WHERE b.id = $1`, 
            [id]
        );
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
        
        const booking = bookingRes.rows[0];
        const io = req.app.get('io');
        if (io) io.emit('booking_assigned', booking);
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.acceptBooking = async (req, res) => changeStatus(req.params.id, 'accepted', res, req, 'booking_accepted');
exports.dispatchBooking = async (req, res) => changeStatus(req.params.id, 'dispatched', res, req, 'ambulance_dispatched');
exports.arriveBooking = async (req, res) => changeStatus(req.params.id, 'arrived', res, req, 'driver_arrived');
exports.completeBooking = async (req, res) => changeStatus(req.params.id, 'completed', res, req, 'trip_completed');
exports.cancelBooking = async (req, res) => changeStatus(req.params.id, 'cancelled', res, req, 'booking_cancelled');

exports.denyBooking = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('UPDATE bookings SET ambulance_id = NULL, driver_id = NULL WHERE id = $1', [id]);
        
        const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
        
        const booking = bookingRes.rows[0];
        broadcastBookingUpdate(req, id, 'driver_denied', booking);
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
