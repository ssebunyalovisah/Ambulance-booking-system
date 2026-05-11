const db = require('./src/config/db.js');

async function test() {
    try {
        const res = await db.query(
            'INSERT INTO ambulances (company_id, ambulance_number, driver_id, gps_capable, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [1, 'TEST-AMB-123', null, true, 'available']
        );
        console.log("Success:", res);
    } catch(e) {
        console.error("Database error details:");
        console.error(e.message);
        console.error(e.stack);
    }
}
test();
