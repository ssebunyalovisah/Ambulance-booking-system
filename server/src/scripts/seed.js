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
        
        // 3. Create default ambulances
        console.log('Registering default ambulances...');
        const ambulances = [
            { number: 'UAS 123G', driver: 'Ssendawula John', contact: '+256 700 111111', lat: 0.3476, lng: 32.5825 },
            { number: 'UBH 456X', driver: 'Musoke Moses', contact: '+256 700 222222', lat: 0.3550, lng: 32.5780 },
            { number: 'UBA 789M', driver: 'Nakato Sarah', contact: '+256 700 333333', lat: 0.3400, lng: 32.5900 }
        ];

        for (const amb of ambulances) {
            await db.query(
                "INSERT INTO ambulances (company_id, ambulance_number, driver_name, driver_contact, status, latitude, longitude) VALUES ($1, $2, $3, $4, 'AVAILABLE', $5, $6) ON CONFLICT (ambulance_number) DO NOTHING",
                [companyId, amb.number, amb.driver, amb.contact, amb.lat, amb.lng]
            );
        }
        console.log('Default available ambulances created.');
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
