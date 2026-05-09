const db = require('../config/db');

exports.getDrivers = async (req, res) => {
    const { company_id, role } = req.user;
    try {
        let queryStr = 'SELECT d.*, a.ambulance_number FROM drivers d LEFT JOIN ambulances a ON d.ambulance_id = a.id WHERE d.company_id = $1';
        let params = [company_id];

        if (role === 'super_admin') {
            queryStr = 'SELECT d.*, a.ambulance_number, c.name as company_name FROM drivers d LEFT JOIN ambulances a ON d.ambulance_id = a.id LEFT JOIN companies c ON d.company_id = c.id';
            params = [];
        }

        const result = await db.query(queryStr, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createDriver = async (req, res) => {
    const { full_name, phone, ambulance_id } = req.body;
    const { company_id } = req.user;
    
    // Auto-generate Driver ID
    const driver_id = `DRV-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
        const insertRes = await db.query(
            'INSERT INTO drivers (company_id, full_name, driver_id, phone, ambulance_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [company_id, full_name, driver_id, phone, ambulance_id || null, 'available']
        );
        
        const newDriverId = insertRes.rows && insertRes.rows.length > 0 ? insertRes.rows[0].id : insertRes.lastID;
        const newDriverRes = await db.query('SELECT * FROM drivers WHERE id = $1', [newDriverId]);
        const newDriver = newDriverRes.rows[0];
        
        if (ambulance_id) {
            await db.query('UPDATE ambulances SET driver_id = $1 WHERE id = $2', [newDriver.id, ambulance_id]);
        }

        res.status(201).json(newDriver);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getDriver = async (req, res) => {
    try {
        const result = await db.query('SELECT d.*, a.ambulance_number FROM drivers d LEFT JOIN ambulances a ON d.ambulance_id = a.id WHERE d.id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Driver not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateDriver = async (req, res) => {
    const { id } = req.params;
    const { full_name, phone, ambulance_id, status } = req.body;
    const { company_id } = req.user;

    try {
        await db.query(
            `UPDATE drivers 
             SET full_name = COALESCE($1, full_name),
                 phone = COALESCE($2, phone),
                 ambulance_id = COALESCE($3, ambulance_id),
                 status = COALESCE($4, status)
             WHERE id = $5 AND company_id = $6`,
            [full_name, phone, ambulance_id, status, id, company_id]
        );

        const updatedRes = await db.query('SELECT * FROM drivers WHERE id = $1', [id]);
        if (updatedRes.rowCount === 0) {
            return res.status(404).json({ error: 'Driver not found or unauthorized' });
        }
        const updated = updatedRes.rows[0];

        // Update ambulance driver_id if ambulance changed
        if (ambulance_id !== undefined) {
             // remove driver from other ambulances
             await db.query('UPDATE ambulances SET driver_id = NULL WHERE driver_id = $1', [id]);
             if (ambulance_id !== null) {
                 await db.query('UPDATE ambulances SET driver_id = $1 WHERE id = $2', [id, ambulance_id]);
             }
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
