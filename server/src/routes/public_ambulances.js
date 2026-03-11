const express = require('express');
const router = express.Router();

// Get all nearby available ambulances
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;
  // TODO: PostGIS spatial query implementation
  res.json({ success: true, ambulances: [] });
});

module.exports = router;
