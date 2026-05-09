require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const path = require('path');

const seed = async () => {
    try {
        console.log('Seeding database...');
        
        // 0. Run schema.sql to ensure tables exist
        const schemaPath = path.resolve(__dirname, '../config/schema.sql');
        console.log(`Checking schema at path: ${schemaPath}`);
        
        let schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('Executing schema...');
        
        // If postgres, we must convert SQLite syntax to Postgres syntax
        if (process.env.DB_TYPE === 'postgres' || process.env.DATABASE_URL) {
            schema = schema.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
            schema = schema.replace(/DATETIME/g, 'TIMESTAMP');
            
            await db.query(schema);
        } else {
            // SQLite executes in the background, but let's assume SQLite handled it in db.js
            console.log('SQLite handles schema automatically in db.js');
        }

        // 1. Create a default company
        await db.query(
            'INSERT INTO companies (name, email, phone) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $1',
            ['City Rescue Force', 'contact@cityrescue.com', '+256 800 123456']
        );
        
        const companyResult = await db.query('SELECT id FROM companies WHERE email = $1', ['contact@cityrescue.com']);
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
            'INSERT INTO users (company_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = $4, full_name = $2',
            [companyId, 'Main Admin', 'admin@cityrescue.com', passwordHash, 'super_admin']
        );

        console.log('Default admin created successfully.');
        
        // 3. Create default drivers
        console.log('Registering default drivers...');
        const drivers = [
            { full_name: 'Ssendawula John', driver_id: 'DRV-001', phone: '+256 700 111111' },
            { full_name: 'Musoke Moses', driver_id: 'DRV-002', phone: '+256 700 222222' },
            { full_name: 'Nakato Sarah', driver_id: 'DRV-003', phone: '+256 700 333333' }
        ];

        for (const drv of drivers) {
            await db.query(
                "INSERT INTO drivers (company_id, full_name, driver_id, phone, status) VALUES ($1, $2, $3, $4, 'available') ON CONFLICT (driver_id) DO NOTHING",
                [companyId, drv.full_name, drv.driver_id, drv.phone]
            );
        }
        console.log('Default drivers created.');

        // 4. Create default ambulances
        console.log('Registering default ambulances...');
        const ambulances = [
            { number: 'UAS 123G', driver_id: 'DRV-001' },
            { number: 'UBH 456X', driver_id: 'DRV-002' },
            { number: 'UBA 789M', driver_id: 'DRV-003' }
        ];

        for (const amb of ambulances) {
            // Find driver's real auto-increment ID
            const driverResult = await db.query('SELECT id FROM drivers WHERE driver_id = $1', [amb.driver_id]);
            const driverDbId = driverResult.rows[0]?.id;

            await db.query(
                "INSERT INTO ambulances (company_id, ambulance_number, driver_id, status) VALUES ($1, $2, $3, 'available') ON CONFLICT (ambulance_number) DO NOTHING",
                [companyId, amb.number, driverDbId]
            );
            
            // Assign ambulance ID to driver
            const ambResult = await db.query('SELECT id FROM ambulances WHERE ambulance_number = $1', [amb.number]);
            const ambDbId = ambResult.rows[0]?.id;
            
            await db.query('UPDATE drivers SET ambulance_id = $1 WHERE id = $2', [ambDbId, driverDbId]);
        }
        console.log('Default available ambulances created.');
        
        console.log('-----------------------------------');
        console.log('Credentials:');
        console.log('Admin Email: admin@cityrescue.com');
        console.log('Admin Password: adminpassword123');
        console.log('-----------------------------------');
        console.log('Driver Login:');
        console.log('Name: Ssendawula John');
        console.log('ID: DRV-001');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
