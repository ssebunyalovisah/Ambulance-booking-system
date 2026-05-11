const db = require('../config/db');
const crypto = require('crypto');

// Reusable rich SELECT — includes driver_phone and company_phone everywhere
const BOOKING_SELECT = `
    SELECT b.*,
           c.name  AS company_name,
           c.phone AS company_phone,
           d.full_name AS driver_name,
           d.driver_id AS driver_uid,
           d.phone     AS driver_phone,
           a.ambulance_number
    FROM bookings b
    LEFT JOIN companies  c ON b.company_id  = c.id
    LEFT JOIN drivers    d ON b.driver_id   = d.id
    LEFT JOIN ambulances a ON b.ambulance_id = a.id
`;

const broadcastBookingUpdate = (req, bookingId, eventName, payload = {}) => {
    const io = req.app.get('io');
    if (io) {
        console.log(`[Socket Broadcast] Emitting "${eventName}" for booking ${bookingId}`);
        
        // 1. Shared booking room (Client + Driver + Admin)
        const bookingRoom = `room:booking_${bookingId}`;
        io.to(bookingRoom).emit(eventName, payload);
        io.to(bookingRoom).emit('booking_status_update', payload);

        // 2. Company specific monitor
        if (payload.company_id) {
            io.to(`company_dashboard_${payload.company_id}`).emit(eventName, payload);
            io.to(`company_dashboard_${payload.company_id}`).emit('booking_status_update', payload);
        }

        // 3. Super Admin monitor
        io.to('super_dashboard').emit(eventName, payload);
        io.to('super_dashboard').emit('booking_status_update', payload);

        // 4. Canonical admin_monitor room (v3 spec)
        io.to('admin_monitor').emit(eventName, payload);
        io.to('admin_monitor').emit('booking_status_update', payload);

        // 5. Driver's private room
        if (payload.driver_id) {
            io.to(`driver_room_${payload.driver_id}`).emit(eventName, payload);
            io.to(`driver_room_${payload.driver_id}`).emit('booking_status_update', payload);
        }
    } else {
        console.warn('[Socket Broadcast] FAILED: io object not found on req.app');
    }
};

// ─── GET LIST ────────────────────────────────────────────────────────────────
exports.getBookings = async (req, res) => {
    const { company_id, role } = req.user;
    try {
        let queryStr = BOOKING_SELECT + ' WHERE b.company_id = $1 ORDER BY b.created_at DESC';
        let params = [company_id];

        if (role === 'super_admin' || role === 'SUPER_ADMIN') {
            queryStr = BOOKING_SELECT + ' ORDER BY b.created_at DESC';
            params = [];
        }

        const result = await db.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[DATABASE ERROR] getBookings failed:', {
            message: err.message,
            query: queryStr,
            params: params,
            stack: err.stack
        });
        res.status(500).json({ error: 'Database error fetching bookings', details: err.message });
    }
};

// ─── GET ONE ─────────────────────────────────────────────────────────────────
exports.getBooking = async (req, res) => {
    try {
        const result = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── GET ACTIVE BOOKING FOR DRIVER (reconnect reconciliation) ─────────────────
// Used by Driver App on socket reconnect to restore trip state
exports.getActiveBookingForDriver = async (req, res) => {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: 'driverId query param required' });
    try {
        const driverRes = await db.query('SELECT ambulance_id FROM drivers WHERE id = $1', [driverId]);
        const ambulanceId = driverRes.rowCount > 0 ? driverRes.rows[0].ambulance_id : null;

        const result = await db.query(
            BOOKING_SELECT + ` WHERE (b.driver_id = $1 OR (b.ambulance_id = $2 AND b.driver_id IS NULL))
              AND b.status IN ('pending','accepted','dispatched','arrived')
              ORDER BY b.updated_at DESC LIMIT 1`,
            [driverId, ambulanceId]
        );
        if (result.rowCount === 0) return res.json(null); // No active trip — driver is free
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── CREATE (public) ─────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
    const {
        patient_name, phone, emergency_description, payment_method,
        patient_lat, patient_lng, company_id, ambulance_id, driver_id
    } = req.body;
    const id = crypto.randomUUID();

    try {
        // Fallback: if client sends ambulance_id but no driver_id, resolve it
        let resolvedDriverId = driver_id || null;
        if (ambulance_id && !resolvedDriverId) {
            const ambResult = await db.query('SELECT driver_id FROM ambulances WHERE id = $1', [ambulance_id]);
            if (ambResult.rowCount > 0) {
                resolvedDriverId = ambResult.rows[0].driver_id || null;
            }
        }

        // Smart Dispatch: Ensure driver is actually available
        if (resolvedDriverId) {
            const driverStatusRes = await db.query('SELECT status FROM drivers WHERE id = $1', [resolvedDriverId]);
            if (driverStatusRes.rowCount > 0) {
                const dStatus = driverStatusRes.rows[0].status;
                if (dStatus !== 'available') {
                    // Instantly notify client that driver is busy instead of keeping them hanging
                    return res.status(400).json({ 
                        error: 'Driver is currently busy or offline', 
                        status: 'denied',
                        reason: `Driver is ${dStatus === 'on_trip' ? 'on another trip' : 'offline'}`
                    });
                }
            }
        }

        // Auto-cancel any old hanging 'pending' requests for this driver to prevent queue blockage
        if (resolvedDriverId) {
            await db.query(
                `UPDATE bookings SET status = 'cancelled', cancel_reason = 'Superseded by newer request', cancelled_by = 'admin', updated_at = CURRENT_TIMESTAMP
                 WHERE driver_id = $1 AND status = 'pending'`,
                [resolvedDriverId]
            );
        }

        const id = crypto.randomUUID();
        await db.query(
            `INSERT INTO bookings
               (id, patient_name, phone, emergency_description, payment_method,
                patient_lat, patient_lng, company_id, ambulance_id, driver_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
            [id, patient_name, phone, emergency_description, payment_method,
             patient_lat, patient_lng, company_id, ambulance_id || null, resolvedDriverId]
        );

        // Fetch the rich booking with all JOINs for the dashboards
        const richBookingRes = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [id]);
        const booking = richBookingRes.rows[0];

        broadcastBookingUpdate(req, id, 'new_booking', booking);
        res.status(201).json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── GENERIC STATUS CHANGE ───────────────────────────────────────────────────
const changeStatus = async (id, status, res, req, eventName) => {
    const { ambulance_id, driver_id, reason, cancelled_by } = req.body;
    try {
        let queryStr = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP';
        let params = [status];

        if (status === 'cancelled' || status === 'denied') {
            queryStr += `, cancelled_at = CURRENT_TIMESTAMP`;
            
            // If explicit cancelled_by provided in body (Admin), use it.
            // Otherwise, if user is driver, use 'driver'.
            let by = cancelled_by;
            if (!by && req.user && req.user.role === 'driver') by = 'driver';
            
            if (by) {
                queryStr += `, cancelled_by = $${params.length + 1}`;
                params.push(by);
            }
        }

        if (ambulance_id) {
            queryStr += `, ambulance_id = $${params.length + 1}`;
            params.push(ambulance_id);

            // Auto-link the driver assigned to this ambulance if none provided in body
            const drvRes = await db.query('SELECT id FROM drivers WHERE ambulance_id = $1', [ambulance_id]);
            if (drvRes.rowCount > 0 && !driver_id) {
                queryStr += `, driver_id = $${params.length + 1}`;
                params.push(drvRes.rows[0].id);
            }
        }
        
        // v3 fix: If a driver is performing this action (e.g. deny/accept), auto-stamp their ID
        // so the Admin Dashboard knows who touched the request.
        let finalDriverId = driver_id;
        if (!finalDriverId && req.user && req.user.role === 'driver') {
            finalDriverId = req.user.id;
        }

        if (finalDriverId) {
            queryStr += `, driver_id = $${params.length + 1}`;
            params.push(finalDriverId);
        }

        if (reason) {
            queryStr += `, cancel_reason = $${params.length + 1}`;
            params.push(reason);
        }

        params.push(id);
        queryStr += ` WHERE id = $${params.length}`;

        await db.query(queryStr, params);

        const bookingRes = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [id]);
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = bookingRes.rows[0];

        // Sync ambulance and driver status
        const io = req.app.get('io');
        if (status === 'dispatched' || status === 'accepted') {
            if (booking.ambulance_id) await db.query('UPDATE ambulances SET status = $1 WHERE id = $2', ['busy', booking.ambulance_id]);
            if (booking.driver_id) {
                await db.query('UPDATE drivers SET status = $1 WHERE id = $2', ['on_trip', booking.driver_id]);
                if (io) {
                    const drvStatus = { driver_id: booking.driver_id, status: 'on_trip', ambulance_id: booking.ambulance_id, company_id: booking.company_id };
                    io.to(`company_dashboard_${booking.company_id}`).emit('driver_status_update', drvStatus);
                    io.to('super_dashboard').emit('driver_status_update', drvStatus);
                }
            }
        } else if (status === 'completed' || status === 'cancelled') {
            if (booking.ambulance_id) await db.query('UPDATE ambulances SET status = $1 WHERE id = $2', ['available', booking.ambulance_id]);
            if (booking.driver_id) {
                await db.query('UPDATE drivers SET status = $1 WHERE id = $2', ['available', booking.driver_id]);
                if (io) {
                    const drvStatus = { driver_id: booking.driver_id, status: 'available', ambulance_id: booking.ambulance_id, company_id: booking.company_id };
                    io.to(`company_dashboard_${booking.company_id}`).emit('driver_status_update', drvStatus);
                    io.to('super_dashboard').emit('driver_status_update', drvStatus);
                }
            }
        }

        if (eventName) broadcastBookingUpdate(req, id, eventName, booking);

        // When driver accepts/dispatches, push confirmed booking to driver room explicitly
        if (status === 'accepted' || status === 'dispatched') {
            const io = req.app.get('io');
            if (io && booking.driver_id) {
                io.to(`driver_room_${booking.driver_id}`).emit('booking_status_update', booking);
            }
        }

        // On cancellation: emit booking_cancelled with full context to ALL rooms including driver
        if (status === 'cancelled') {
            const io = req.app.get('io');
            if (io) {
                const cancelPayload = {
                    ...booking,
                    cancelled_by: cancelled_by || booking.cancelled_by,
                    cancel_reason: reason || booking.cancel_reason,
                };
                io.to(`room:booking_${id}`).emit('booking_cancelled', cancelPayload);
                if (booking.driver_id) {
                    io.to(`driver_room_${booking.driver_id}`).emit('booking_cancelled', cancelPayload);
                }
                io.to('admin_monitor').emit('booking_cancelled', cancelPayload);
                if (booking.company_id) {
                    io.to(`company_dashboard_${booking.company_id}`).emit('booking_cancelled', cancelPayload);
                }
                io.to('super_dashboard').emit('booking_cancelled', cancelPayload);
            }
        }

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── INITIAL ASSIGN (driver linked before accept) ────────────────────────────
exports.assignBooking = async (req, res) => {
    const { id } = req.params;
    const { ambulance_id, driver_id } = req.body;
    try {
        await db.query(
            'UPDATE bookings SET ambulance_id = $1, driver_id = $2 WHERE id = $3',
            [ambulance_id, driver_id, id]
        );

        const bookingRes = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [id]);
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = bookingRes.rows[0];
        const io = req.app.get('io');
        if (io && booking.driver_id) {
            io.to(`driver_room_${booking.driver_id}`).emit('new_booking', booking);
        }
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── ADMIN FALLBACK REASSIGN ──────────────────────────────────────────────────
// Used ONLY when driver denied or timed out — spec says admin can step in as fallback
exports.reassignBooking = async (req, res) => {
    const { id } = req.params;
    const { ambulance_id, driver_id } = req.body;
    try {
        await db.query(
            `UPDATE bookings
             SET ambulance_id = $1, driver_id = $2, status = 'pending', updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [ambulance_id, driver_id, id]
        );

        const bookingRes = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [id]);
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = bookingRes.rows[0];
        const io = req.app.get('io');
        if (io) {
            // Push to the newly assigned driver's private room
            if (booking.driver_id) io.to(`driver_room_${booking.driver_id}`).emit('new_booking', booking);
            // Notify admin rooms
            if (booking.company_id) io.to(`company_dashboard_${booking.company_id}`).emit('booking_status_update', booking);
            io.to('super_dashboard').emit('booking_status_update', booking);
        }
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── DRIVER DENY ──────────────────────────────────────────────────────────────
exports.denyBooking = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE bookings
             SET status = 'denied', ambulance_id = NULL, driver_id = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );

        const bookingRes = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [id]);
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = bookingRes.rows[0];
        // Notify admin (monitoring / fallback reassignment)
        broadcastBookingUpdate(req, id, 'driver_denied', booking);
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── DRIVER TIMEOUT (30s countdown expired on driver app) ────────────────────
exports.timeoutBooking = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            `UPDATE bookings
             SET status = 'timed_out', ambulance_id = NULL, driver_id = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );

        const bookingRes = await db.query(BOOKING_SELECT + ' WHERE b.id = $1', [id]);
        if (bookingRes.rowCount === 0) return res.status(404).json({ error: 'Booking not found' });

        const booking = bookingRes.rows[0];
        // Alert admin — they may manually reassign as fallback
        broadcastBookingUpdate(req, id, 'booking_timed_out', booking);
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── STATUS SHORTCUTS ─────────────────────────────────────────────────────────
exports.acceptBooking  = (req, res) => changeStatus(req.params.id, 'accepted',  res, req, 'driver_accepted');
exports.dispatchBooking = (req, res) => changeStatus(req.params.id, 'dispatched', res, req, 'ambulance_dispatched');
exports.arriveBooking  = (req, res) => changeStatus(req.params.id, 'arrived',   res, req, 'driver_arrived');
exports.completeBooking = (req, res) => changeStatus(req.params.id, 'completed', res, req, 'trip_completed');
exports.cancelBooking  = (req, res) => changeStatus(req.params.id, 'cancelled', res, req, 'booking_cancelled');
