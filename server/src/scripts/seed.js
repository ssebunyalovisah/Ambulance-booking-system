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
            console.log('Converting SQLite schema to PostgreSQL...');
            schema = schema.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
            schema = schema.replace(/DATETIME/g, 'TIMESTAMP');
            schema = schema.replace(/DEFAULT CURRENT_TIMESTAMP/g, 'DEFAULT NOW()');
            schema = schema.replace(/REAL/g, 'DOUBLE PRECISION');
            schema = schema.replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT TRUE');
            schema = schema.replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT FALSE');
            
            // Split by semicolon and filter out empty lines/comments
            const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
            
            for (let statement of statements) {
                try {
                    await db.query(statement);
                } catch (e) {
                    // Ignore "already exists" errors if using CREATE TABLE IF NOT EXISTS
                    if (!e.message.includes('already exists')) {
                        console.warn(`Statement failed: ${statement.substring(0, 50)}... Error: ${e.message}`);
                    }
                }
            }
        } else {
            console.log('SQLite handles schema automatically in db.js');
        }

        // Ensure essential columns exist (Migration for existing tables)
        if (process.env.DB_TYPE === 'postgres' || process.env.DATABASE_URL) {
            console.log('Running migrations for existing tables...');
            try {
                // Companies table
                await db.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT');
                await db.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT');
                await db.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo TEXT');
                
                // CRITICAL: Check for rogue contact_email column on Render
                try {
                    await db.query('ALTER TABLE companies ALTER COLUMN contact_email DROP NOT NULL');
                } catch(e) {
                    // Column might not exist, which is fine
                }
                
                // Ensure unique constraints if they don't exist
                try { await db.query('ALTER TABLE companies ADD CONSTRAINT companies_email_key UNIQUE (email)'); } catch(e){}
                
                // Drivers table
                await db.query('ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'available\'');
                
                // Ambulances table
                await db.query('ALTER TABLE ambulances ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'available\'');
                
                // Bookings table
                await db.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_lat DOUBLE PRECISION');
                await db.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS patient_lng DOUBLE PRECISION');
                await db.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_address TEXT');
                
            } catch (e) {
                console.warn('Migration step warning:', e.message);
            }
        }

        // 0. Pre-seed Migration: Ensure Postgres is in sync with latest schema
        console.log('Running pre-seed migrations...');
        try {
            // Check if driver_id exists in ambulances table (common Render deploy issue)
            await db.query(`
                DO $$ 
                BEGIN 
                    -- 1. Ensure driver_id column exists
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambulances' AND column_name='driver_id') THEN
                        ALTER TABLE ambulances ADD COLUMN driver_id INTEGER;
                    END IF;

                    -- 2. Ensure legacy driver_name column is nullable if it exists (Render constraint fix)
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambulances' AND column_name='driver_name') THEN
                        ALTER TABLE ambulances ALTER COLUMN driver_name DROP NOT NULL;
                    END IF;
                END $$;
            `);
            console.log('Schema synchronized.');
        } catch (migErr) {
            console.warn('Migration warning (might be SQLite or permissions):', migErr.message);
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
