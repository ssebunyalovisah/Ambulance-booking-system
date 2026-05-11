const axios = require('axios');

async function testApi() {
    try {
        // 1. Login as admin
        // Need to find an admin. Let's just create one or query the DB for one.
        const db = require('./src/config/db.js');
        const adminUser = await db.query("SELECT * FROM users WHERE role='super_admin' OR role='admin' LIMIT 1");
        if (adminUser.rowCount === 0) {
            console.log("No admin found.");
            return;
        }
        
        // Let's create a token for them directly
        const jwt = require('jsonwebtoken');
        const user = adminUser.rows[0];
        const token = jwt.sign(
            { id: user.id, company_id: user.company_id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret', // Let's check process.env or dotenv
            { expiresIn: '1d' }
        );
        
        console.log("Created token for user:", user.email);
        
        // Need dotenv for JWT_SECRET
        require('dotenv').config();
        const realToken = jwt.sign(
            { id: user.id, company_id: user.company_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 2. Make request
        const res = await axios.post('http://localhost:5000/api/ambulances', {
            ambulance_number: 'TEST-PLATE-999',
            driver_id: null
        }, {
            headers: {
                Authorization: `Bearer ${realToken}`
            }
        });
        
        console.log("Success:", res.data);
    } catch(err) {
        console.error("API Error:", err.response ? err.response.data : err.message);
    }
}
testApi();
