const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create a new booking
router.post('/', async (req, res) => {
  const { name, phone, description, address, lat, lng, payment, company_id: provided_company_id, ambulance_id } = req.body;
  
  try {
      let company_id = provided_company_id;
      
      // Better resolution: If we have an ambulance_id, use its company_id
      if (!company_id && ambulance_id) {
          const ambResult = await db.query('SELECT company_id FROM ambulances WHERE id = $1', [ambulance_id]);
          company_id = ambResult.rows[0]?.company_id;
      }

      // Final fallback if still no company_id (e.g. general request without specific ambulance)
      if (!company_id) {
          const companyResult = await db.query('SELECT id FROM companies LIMIT 1');
          company_id = companyResult.rows[0]?.id;
      }

      if (!company_id) {
          return res.status(400).json({ error: 'No ambulance companies registered in the system.' });
      }

      const result = await db.query(
          'INSERT INTO bookings (company_id, ambulance_id, patient_name, phone_number, emergency_description, pickup_address, pickup_latitude, pickup_longitude, payment_method, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [company_id, ambulance_id, name, phone, description, address, lat, lng, payment, 'PAID']
      );

      const booking_id = result.lastID || result.rows[0]?.id;
      
      const bookingData = {
        id: booking_id,
        patient_name: name,
        phone_number: phone,
        emergency_description: description,
        pickup_address: address,
        pickup_latitude: lat,
        pickup_longitude: lng,
        status: 'PENDING',
        payment_method: payment,
        payment_status: 'PAID',
        company_id: company_id,
        ambulance_id: ambulance_id,
        created_at: new Date().toISOString()
      };

      // Emit event to admins
      const io = req.app.get('io');
      if (io) {
          io.to(`company_dashboard_${company_id}`).emit('new_booking_request', bookingData);
          io.to('super_dashboard').emit('new_booking_request', bookingData);
      }

      res.json({ success: true, booking_id, status: 'PENDING' });
  } catch (err) {
      console.error('Error creating booking:', err);
      res.status(500).json({ error: 'Server error' });
  }
});

// Check booking status
router.get('/:id', async (req, res) => {
  res.json({ success: true, status: 'PENDING' });
});

module.exports = router;
