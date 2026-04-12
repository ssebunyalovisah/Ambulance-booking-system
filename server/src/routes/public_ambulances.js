const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all nearby available ambulances
router.get('/nearby', async (req, res) => {
  try {
      const sql = `
          SELECT 
            a.id, 
            a.company_id,
            a.ambulance_number as plateNumber, 
            a.driver_name, 
            a.status, 
            a.latitude as lat, 
            a.longitude as lng, 
            c.name as companyName,
            AVG(f.rating) as rating,
            COUNT(f.id) as reviews
          FROM ambulances a 
          JOIN companies c ON a.company_id = c.id 
          LEFT JOIN bookings b ON a.id = b.ambulance_id
          LEFT JOIN feedback f ON b.id = f.booking_id
          WHERE a.status = 'AVAILABLE'
          GROUP BY a.id
      `;

      db.query(sql).then(result => {
          // Format ratings to 1 decimal place and handle nulls
          const formattedRows = result.rows.map(row => ({
              ...row,
              rating: row.rating ? parseFloat(row.rating.toFixed(1)) : 4.8,
              reviews: row.reviews || 0,
              distance: (Math.random() * 2 + 0.5).toFixed(1), // Mock distance
              eta: Math.floor(Math.random() * 10 + 2) // Mock ETA
          }));
          res.json({ success: true, ambulances: formattedRows });
      }).catch(err => {
          console.error('Error fetching ambulances:', err);
          res.status(500).json({ error: 'Database error' });
      });
  } catch (err) {
      console.error('Error in nearby route:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
