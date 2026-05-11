const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApi() {
    try {
        const db = require('./src/config/db.js');
        const adminUser = await db.query("SELECT * FROM users WHERE role='super_admin' OR role='admin' LIMIT 1");
        if (adminUser.rowCount === 0) {
            console.log("No admin found.");
            return;
        }
        
        const user = adminUser.rows[0];
        const token = jwt.sign(
            { id: user.id, company_id: user.company_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        const res = await fetch('http://localhost:5000/api/ambulances', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ambulance_number: 'TEST-PLATE-999',
                driver_id: null
            })
        });
        
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch(err) {
        console.error("Fetch Error:", err);
    }
}
testApi();
