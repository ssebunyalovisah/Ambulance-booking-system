const db = require('../config/db');

exports.registerAmbulance = async (req, res) => {
    const { ambulance_number, driver_name, driver_contact, lat, lng } = req.body;
    const { company_id } = req.admin;

    try {
        const result = await db.query(
            'INSERT INTO ambulances (company_id, ambulance_number, driver_name, driver_contact, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6)',
            [company_id, ambulance_number, driver_name, driver_contact, lat, lng]
        );
        
        // SQLite doesn't support RETURNING * in all versions/drivers easily via db.run
        // So we fetch the inserted row if needed, or just return success
        const newAmbulance = await db.query('SELECT * FROM ambulances WHERE id = $1', [result.lastID]);
        res.status(201).json(newAmbulance.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAmbulances = async (req, res) => {
    const { company_id } = req.admin;

    try {
        const result = await db.query(
            'SELECT id, ambulance_number, driver_name, driver_contact, status, latitude as lat, longitude as lng FROM ambulances WHERE company_id = $1',
            [company_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateAmbulanceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { company_id } = req.admin;

    try {
        const result = await db.query(
            'UPDATE ambulances SET status = $1 WHERE id = $2 AND company_id = $3',
            [status, id, company_id]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ambulance not found or unauthorized' });
        }

        const updated = await db.query('SELECT * FROM ambulances WHERE id = $1', [id]);
        
        // Notify admins about status change via socket
        const io = req.app.get('io');
        io.to('company_dashboard').emit('ambulance_status_changed', updated.rows[0]);

        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const { company_id } = req.admin;

    try {
        const result = await db.query(
            'UPDATE ambulances SET latitude = $1, longitude = $2 WHERE id = $3 AND company_id = $4',
            [lat, lng, id, company_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Ambulance not found or unauthorized' });
        }

        // Broadcast to relevant rooms
        const io = req.app.get('io');
        io.to('company_dashboard').emit('ambulance_live_location', {
            ambulanceId: id,
            lat,
            lng,
            timestamp: new Date()
        });

        res.json({ message: 'Location updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
