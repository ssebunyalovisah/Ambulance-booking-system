require('dotenv').config();
const axios = require('axios');

async function testAuth() {
    try {
        const response = await axios.post(`${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_SECRET_KEY
        });
        console.log("Response data:", response.data);
    } catch (e) {
        console.error("Auth error:", e.response ? e.response.data : e.message);
    }
}
testAuth();
