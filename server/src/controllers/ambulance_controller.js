const db = require('../config/db');

exports.registerAmbulance = async (req, res) => {
    const { ambulance_number, driver_id, gps_capable } = req.body;
    const { company_id } = req.user;

    try {
        const insertRes = await db.query(
            'INSERT INTO ambulances (company_id, ambulance_number, driver_id, gps_capable, status) VALUES ($1, $2, $3, $4, $5)',
            [company_id, ambulance_number, driver_id || null, gps_capable !== undefined ? gps_capable : true, 'available']
        );
        
        const newAmbulanceRes = await db.query('SELECT * FROM ambulances WHERE id = $1', [insertRes.lastID]);
        const newAmbulance = newAmbulanceRes.rows[0];
        
        // Update driver's ambulance_id if assigned
        if (driver_id) {
            await db.query('UPDATE drivers SET ambulance_id = $1 WHERE id = $2', [newAmbulance.id, driver_id]);
        }

        res.status(201).json(newAmbulance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAmbulances = async (req, res) => {
    const { company_id, role } = req.user;
    try {
        let queryStr;
        let params = [];

        if (role === 'super_admin') {
            queryStr = `
                SELECT a.*, d.full_name as driver_name, d.driver_id as driver_uid, c.name as company_name 
                FROM ambulances a 
                LEFT JOIN drivers d ON a.driver_id = d.id 
                LEFT JOIN companies c ON a.company_id = c.id`;
        } else {
            queryStr = `
                SELECT a.*, d.full_name as driver_name, d.driver_id as driver_uid, c.name as company_name 
                FROM ambulances a 
                LEFT JOIN drivers d ON a.driver_id = d.id 
                LEFT JOIN companies c ON a.company_id = c.id
                WHERE a.company_id = $1`;
            params = [company_id];
        }

        const result = await db.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateAmbulanceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { company_id } = req.user;

    try {
        await db.query(
            'UPDATE ambulances SET status = $1 WHERE id = $2 AND company_id = $3',
            [status, id, company_id]
        );
        
        const updatedRes = await db.query('SELECT * FROM ambulances WHERE id = $1', [id]);
        if (updatedRes.rowCount === 0) {
            return res.status(404).json({ error: 'Ambulance not found or unauthorized' });
        }

        const updated = updatedRes.rows[0];
        
        const io = req.app.get('io');
        if (io) {
            io.to(`company_dashboard_${company_id}`).emit('ambulance_status_changed', updated);
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
