const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('c:/Solomon/Projects/Collegues/Ambulance-booking-system/server/database.sqlite');
db.all(`SELECT b.* FROM bookings b WHERE (b.driver_id = 5 OR (b.ambulance_id = 5 AND b.driver_id IS NULL)) AND b.status IN ('pending','accepted','dispatched','arrived') ORDER BY b.updated_at DESC LIMIT 1`, (err, rows) => {
    console.log(err || rows);
});
