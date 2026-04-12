const db = require('../config/db');

exports.getAllCompanies = async (req, res) => {
    const { role } = req.admin;
    if (role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    try {
        const result = await db.query('SELECT * FROM companies ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteCompany = async (req, res) => {
    const { id } = req.params;
    const { role } = req.admin;
    
    if (role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }

    try {
        // Prevention: don't delete the company the super admin belongs to if they are signed in
        if (id == req.admin.company_id) {
             return res.status(400).json({ error: 'Cannot delete the company you are currently assigned to.' });
        }

        // Delete associated records first (cascade manual cleanup)
        // In a real DB with foreign keys + ON DELETE CASCADE, this might be automatic.
        // We'll do it manually to be safe.
        await db.query('DELETE FROM bookings WHERE company_id = $1', [id]);
        await db.query('DELETE FROM ambulances WHERE company_id = $1', [id]);
        await db.query('DELETE FROM admins WHERE company_id = $1', [id]);
        await db.query('DELETE FROM companies WHERE id = $1', [id]);

        res.json({ message: 'Company and all associated records deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
