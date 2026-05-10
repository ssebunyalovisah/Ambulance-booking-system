const db = require('../config/db');

exports.registerAmbulance = async (req, res) => {
    const { ambulance_number, driver_id, gps_capable } = req.body;
    const { company_id } = req.user;

    try {
        const insertRes = await db.query(
            'INSERT INTO ambulances (company_id, ambulance_number, driver_id, gps_capable, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [company_id, ambulance_number, driver_id || null, gps_capable !== undefined ? gps_capable : true, 'available']
        );
        
        const newId = insertRes.rows && insertRes.rows.length > 0 ? insertRes.rows[0].id : insertRes.lastID;
        const newAmbulanceRes = await db.query('SELECT * FROM ambulances WHERE id = $1', [newId]);
        const newAmbulance = newAmbulanceRes.rows[0];
        
        if (driver_id) {
            await db.query('UPDATE drivers SET ambulance_id = $1 WHERE id = $2', [newAmbulance.id, driver_id]);
        }

        const updatedRes = await db.query('SELECT * FROM ambulances WHERE id = $1', [newId]);
        res.status(201).json(updatedRes.rows[0]);
    } catch (err) {
        console.error('[DATABASE ERROR] registerAmbulance failed:', {
            message: err.message,
            query: 'INSERT INTO ambulances...',
            stack: err.stack
        });
        res.status(500).json({ error: 'Database error creating ambulance', details: err.message });
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
        console.error('[DATABASE ERROR] getAmbulances failed:', {
            message: err.message,
            query: queryStr,
            params: params,
            stack: err.stack
        });
        res.status(500).json({ error: 'Database error fetching ambulances', details: err.message });
    }
};

exports.updateAmbulance = async (req, res) => {
    const { id } = req.params;
    const { ambulance_number, driver_id, gps_capable } = req.body;
    const { company_id } = req.user;

    try {
        await db.query(
            `UPDATE ambulances 
             SET ambulance_number = COALESCE($1, ambulance_number),
                 driver_id = COALESCE($2, driver_id),
                 gps_capable = COALESCE($3, gps_capable)
             WHERE id = $4 AND company_id = $5`,
            [ambulance_number, driver_id, gps_capable, id, company_id]
        );

        // Update driver's ambulance_id if changed
        if (driver_id !== undefined) {
             // remove previous driver from this ambulance link
             await db.query('UPDATE drivers SET ambulance_id = NULL WHERE ambulance_id = $1', [id]);
             if (driver_id !== null) {
                 await db.query('UPDATE drivers SET ambulance_id = $1 WHERE id = $2', [id, driver_id]);
             }
        }

        const updatedRes = await db.query('SELECT * FROM ambulances WHERE id = $1', [id]);
        res.json(updatedRes.rows[0]);
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
            io.to('super_dashboard').emit('ambulance_status_changed', updated);
            // Also emit globally so patient apps can refresh nearby list
            io.emit('ambulance_status_changed', updated);
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteAmbulance = async (req, res) => {
    const { id } = req.params;
    const { company_id } = req.user;
    try {
        await db.query('DELETE FROM ambulances WHERE id = $1 AND company_id = $2', [id, company_id]);
        res.json({ message: 'Ambulance deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
