const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('c:/Solomon/Projects/Collegues/Ambulance-booking-system/server/database.sqlite');
db.all(`SELECT id, status, updated_at FROM bookings WHERE id = 'd009ca38-f303-4213-a410-557bf5ad1c05'`, (err, rows) => {
    console.log(err || rows);
});
