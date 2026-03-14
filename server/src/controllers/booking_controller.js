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
            io.to('company_dashboard').emit('booking_status_changed', booking);
        }
        
        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAdminBookings = async (req, res) => {
    const { company_id } = req.admin;
    try {
        const result = await db.query(
            'SELECT *, pickup_latitude as lat, pickup_longitude as lng FROM bookings WHERE company_id = $1 ORDER BY created_at DESC',
            [company_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
