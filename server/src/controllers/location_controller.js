const db = require('../config/db');

// In-memory store for latest locations (since we removed lat/lng from DB schema to favor real-time)
// In production, use Redis for this.
const driverLocations = new Map(); // driver_id -> { lat, lng, timestamp }

exports.getNearbyAmbulances = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.id as ambulance_id, a.ambulance_number, a.company_id, a.status,
                   c.name as company_name, c.logo as company_logo, c.phone as company_phone,
                   d.id as driver_id, d.full_name as driver_name, d.driver_id as driver_uid, d.phone as driver_phone
            FROM ambulances a
            JOIN companies c ON a.company_id = c.id
            LEFT JOIN drivers d ON a.driver_id = d.id
            WHERE a.status = 'available'
        `);

        // Inject live locations and calculate distance/ETA
        const availableWithLocation = result.rows.map(amb => {
            const loc = driverLocations.get(amb.driver_id);
            const lat = loc?.lat || (0.3476 + (Math.random() - 0.5) * 0.05);
            const lng = loc?.lng || (32.5825 + (Math.random() - 0.5) * 0.05);
            
            // Mock distance/ETA for demonstration if not live
            return {
                ...amb,
                lat,
                lng,
                last_updated: loc?.timestamp || null,
                is_live: !!loc,
                distance: (Math.random() * 5 + 1).toFixed(1), // Mock 1-6km
                eta: Math.floor(Math.random() * 10 + 2), // Mock 2-12 min
                rating: (4.5 + Math.random() * 0.5).toFixed(1)
            };
        });

        res.json(availableWithLocation);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updatePatientLocation = (req, res) => {
    const { booking_id, lat, lng } = req.body;
    
    const io = req.app.get('io');
    if (io && booking_id) {
        io.to(`room:booking_${booking_id}`).emit('patient_location_update', {
            booking_id, lat, lng, timestamp: new Date()
        });
    }
    
    res.json({ success: true });
};

exports.updateDriverLocation = (req, res) => {
    const { lat, lng, booking_id } = req.body;
    const driverId = req.user.id;

    // Update in-memory store
    driverLocations.set(driverId, { lat, lng, timestamp: new Date() });

    const io = req.app.get('io');
    if (io) {
        // Emit specifically for the active booking if provided
        if (booking_id) {
            io.to(`room:booking_${booking_id}`).emit('driver_location_update', {
                driver_id: driverId, lat, lng, timestamp: new Date()
            });
        }

        // Also emit general update for map tracking of available ambulances
        io.emit('ambulance_location_update', {
            driver_id: driverId, lat, lng, timestamp: new Date()
        });
    }

    res.json({ success: true });
};
