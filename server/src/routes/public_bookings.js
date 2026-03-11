const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Create a new booking
router.post('/', async (req, res) => {
  const { patient_name, phone_number, description, lat, lng, payment } = req.body;
  
  // Create a mock UUID for demo
  const booking_id = 'booking-' + Math.random().toString(36).substr(2, 9);
  
  const bookingData = {
    id: booking_id,
    patientName: patient_name,
    phone: phone_number,
    description,
    lat,
    lng,
    status: 'PENDING',
    paymentMethod: payment
  };

  // TODO: Insert into bookings DB

  // Emit event to admins
  const io = req.app.get('io');
  if (io) {
      io.to('company_dashboard').emit('new_booking_request', bookingData);
  }

  res.json({ success: true, booking_id, status: 'PENDING' });
});

// Check booking status
router.get('/:id', async (req, res) => {
  res.json({ success: true, status: 'PENDING' });
});

module.exports = router;
