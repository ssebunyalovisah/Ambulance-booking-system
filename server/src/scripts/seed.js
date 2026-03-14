require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('Seeding database...');

        // 1. Create a default company
        await db.query(
            'INSERT INTO companies (name, contact_email) VALUES ($1, $2) ON CONFLICT (contact_email) DO UPDATE SET name = $1',
            ['City Rescue Force', 'contact@cityrescue.com']
        );
        
        const companyResult = await db.query('SELECT id FROM companies WHERE contact_email = $1', ['contact@cityrescue.com']);
        console.log('Company lookup result:', companyResult);
        const companyId = companyResult.rows[0]?.id;
        console.log('Using companyId:', companyId);
        
        if (!companyId) throw new Error('Company ID not found after insert');

        console.log('Default company created/verified.');

        // 2. Create a default admin
        const password = 'adminpassword123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO admins (company_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = $4, name = $2',
            [companyId, 'Main Admin', 'admin@cityrescue.com', passwordHash, 'ADMIN']
        );

        console.log('Default admin created successfully.');
        console.log('-----------------------------------');
        console.log('Credentials:');
        console.log('Email: admin@cityrescue.com');
        console.log('Password: adminpassword123');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
