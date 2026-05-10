const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('c:/Solomon/Projects/Collegues/Ambulance-booking-system/server/database.sqlite');
db.all(`SELECT * FROM bookings WHERE (driver_id = 5 OR (ambulance_id = 5 AND driver_id IS NULL)) AND status IN ('pending','accepted','dispatched','arrived') ORDER BY updated_at DESC LIMIT 1`, (err, rows) => {
    console.log(err || rows);
});
