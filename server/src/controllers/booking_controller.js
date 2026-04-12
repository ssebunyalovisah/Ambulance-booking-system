const db = require('../config/db');

exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status, ambulance_id } = req.body;
    
    try {
        let queryStr = 'UPDATE bookings SET status = $1 WHERE id = $2';
        let params = [status, id];
        
        if (ambulance_id) {
            queryStr = 'UPDATE bookings SET status = $1, ambulance_id = $3 WHERE id = $2';
            params.push(ambulance_id);
        }
        
        const result = await db.query(queryStr, params);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Handle ambulance status changes
        if (status === 'ACCEPTED' || status === 'DISPATCHED') {
            const bookingResult = await db.query('SELECT ambulance_id FROM bookings WHERE id = $1', [id]);
            const ambId = bookingResult.rows[0].ambulance_id;
            if (ambId) {
                await db.query('UPDATE ambulances SET status = $1 WHERE id = $2', ['BUSY', ambId]);
            }
        } else if (status === 'COMPLETED' || status === 'CANCELLED') {
            const bookingResult = await db.query('SELECT ambulance_id FROM bookings WHERE id = $1', [id]);
            const ambId = bookingResult.rows[0].ambulance_id;
            if (ambId) {
                await db.query('UPDATE ambulances SET status = $1 WHERE id = $2', ['AVAILABLE', ambId]);
            }
        }
        
        // Fetch full booking data for emitting
        const updated = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
        const booking = updated.rows[0];
        
        const io = req.app.get('io');
        // Notify patient in their specific room
        if (io) {
            io.to(`room_booking_${id}`).emit('booking_status_update', {
                status: booking.status,
                ambulance_id: booking.ambulance_id
            });
            
            // Also notify dashboard to update the lists
            io.to(`company_dashboard_${booking.company_id}`).emit('booking_status_changed', booking);
            io.to('super_dashboard').emit('booking_status_changed', booking);
            
            // If ambulance status changed, notify dashboard
            const ambId = booking.ambulance_id;
            if (ambId) {
                const ambResult = await db.query('SELECT * FROM ambulances WHERE id = $1', [ambId]);
                io.to(`company_dashboard_${booking.company_id}`).emit('ambulance_status_changed', ambResult.rows[0]);
                io.to('super_dashboard').emit('ambulance_status_changed', ambResult.rows[0]);
            }
        }
        
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAdminBookings = async (req, res) => {
    const { company_id, role } = req.admin;
    try {
        let queryStr = 'SELECT *, pickup_latitude as lat, pickup_longitude as lng FROM bookings WHERE company_id = $1 ORDER BY created_at DESC';
        let params = [company_id];

        if (role === 'SUPER_ADMIN') {
            queryStr = 'SELECT *, pickup_latitude as lat, pickup_longitude as lng FROM bookings ORDER BY created_at DESC';
            params = [];
        }

        const result = await db.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
