const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all nearby available ambulances
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query; // radius in km
  
  try {
      // For now, return all available ambulances regardless of radius
      // In a real app, we'd use Haversine or simple bounding box check
      const result = await db.query(
          "SELECT a.id, a.ambulance_number, a.driver_name, a.status, a.latitude as lat, a.longitude as lng, c.name as company_name FROM ambulances a JOIN companies c ON a.company_id = c.id WHERE a.status = 'AVAILABLE'"
      );

      res.json({ success: true, ambulances: result.rows });
  } catch (err) {
      console.error('Error fetching nearby ambulances:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
