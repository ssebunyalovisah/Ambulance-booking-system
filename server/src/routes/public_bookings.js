const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create a new booking
router.post('/', async (req, res) => {
  const { name, phone, description, address, lat, lng, payment } = req.body;
  const patient_name = name;
  const phone_number = phone;
  const pickup_address = address;
  
  try {
      // For demo purposes, we'll assign the first company found if none is provided
      const companyResult = await db.query('SELECT id FROM companies LIMIT 1');
      const company_id = companyResult.rows[0]?.id;

      if (!company_id) {
          return res.status(400).json({ error: 'No ambulance companies registered in the system.' });
      }

      const result = await db.query(
          'INSERT INTO bookings (company_id, patient_name, phone_number, emergency_description, pickup_address, pickup_latitude, pickup_longitude, payment_method, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [company_id, patient_name, phone_number, description, pickup_address, lat, lng, payment, 'PAID']
      );

      const booking_id = result.lastID || result.rows[0]?.id;
      
      const bookingData = {
        id: booking_id,
        patientName: patient_name,
        phone: phone_number,
        description,
        address: pickup_address,
        lat,
        lng,
        status: 'PENDING',
        paymentMethod: payment,
        paymentStatus: 'PAID'
      };

      // Emit event to admins
      const io = req.app.get('io');
      if (io) {
          io.to('company_dashboard').emit('new_booking_request', bookingData);
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
