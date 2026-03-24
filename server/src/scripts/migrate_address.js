const db = require('../config/db');

const migrate = async () => {
    try {
        console.log('Running migration: Add pickup_address to bookings...');
        // Check if column exists (SQLite doesn't have an easy way, so we just try to add it)
        await db.query('ALTER TABLE bookings ADD COLUMN pickup_address TEXT');
        console.log('Migration successful.');
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column pickup_address already exists.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        process.exit(0);
    }
};

migrate();
