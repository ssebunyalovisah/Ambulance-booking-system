const db = require('./src/config/db.js');

async function test() {
    try {
        const res = await db.query("SELECT sql FROM sqlite_master WHERE name='ambulances'");
        console.log("Ambulances Schema:", res.rows[0].sql);
    } catch(e) {
        console.error(e);
    }
}
test();
