// server/src/controllers/booking_controller.js
const { Booking, Company, Driver, Ambulance } = require('../models');
const { broadcastBookingStatus, broadcastDriverStatus } = require('../services/statusBroadcaster');

// Helper to get booking with full associations for broadcasting
const getRichBooking = async (id) => {
  return await Booking.findByPk(id, {
    include: [
      { model: Company, attributes: ['name', 'phone', 'logo'] },
      { model: Driver, attributes: ['full_name', 'driver_id', 'phone', 'photo'] },
      { model: Ambulance, attributes: ['ambulance_number'] },
    ],
  });
};

// 1. Get List (Admin Monitor / Driver History)
exports.getBookings = async (req, res) => {
  const { company_id, role, id: userId } = req.user;
  const { driverId } = req.query;
  try {
    const where = {};
    if (role !== 'super_admin') {
      where.company_id = company_id;
    }
    if (role === 'driver') {
      where.driver_id = userId;
    } else if (driverId) {
      where.driver_id = driverId;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Company, attributes: ['name', 'phone'] },
        { model: Driver, attributes: ['full_name', 'driver_id', 'phone'] },
        { model: Ambulance, attributes: ['ambulance_number'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching bookings' });
  }
};

// 2. Get One
exports.getBooking = async (req, res) => {
  try {
    const booking = await getRichBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Get Active Booking for Driver (reconnect reconciliation)
exports.getActiveBookingForDriver = async (req, res) => {
  const { driverId } = req.query;
  if (!driverId) return res.status(400).json({ error: 'driverId query param required' });

  try {
    const booking = await Booking.findOne({
      where: {
        driver_id: driverId,
        status: ['pending', 'accepted', 'dispatched', 'arrived'],
      },
      include: [
        { model: Company, attributes: ['name', 'phone'] },
        { model: Driver, attributes: ['full_name', 'driver_id', 'phone'] },
        { model: Ambulance, attributes: ['ambulance_number'] },
      ],
      order: [['updated_at', 'DESC']],
    });

    res.json(booking || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Create (public)
exports.createBooking = async (req, res) => {
  const {
    patient_name, phone, emergency_description, payment_method,
    patient_lat, patient_lng, company_id, ambulance_id, driver_id
  } = req.body;

  try {
    // Determine driver if only ambulance_id provided
    let resolvedDriverId = driver_id || null;
    if (ambulance_id && !resolvedDriverId) {
      const amb = await Ambulance.findByPk(ambulance_id);
      if (amb) resolvedDriverId = amb.driver_id;
    }

    // Check driver availability
    if (resolvedDriverId) {
      const driver = await Driver.findByPk(resolvedDriverId);
      if (driver && driver.status !== 'available') {
        return res.status(400).json({ 
          error: 'Driver is currently busy or offline',
          status: 'denied'
        });
      }
    }

    const booking = await Booking.create({
      patient_name, phone, emergency_description, payment_method,
      patient_lat, patient_lng, company_id, ambulance_id, 
      driver_id: resolvedDriverId,
      status: 'pending'
    });

    const richBooking = await getRichBooking(booking.id);
    const io = req.app.get('io');
    
    // Broadcast "new_booking" directly to driver and admin monitor
    if (io) {
      if (resolvedDriverId) {
        const driverRoomName = `driver_room_${resolvedDriverId}`;
        console.log(`[NEW_BOOKING] Emitting to ${driverRoomName} for driver ${resolvedDriverId}`);
        io.to(driverRoomName).emit('new_booking', richBooking);
        console.log(`[NEW_BOOKING] Emitted booking ${booking.id} to ${driverRoomName}`);
      }
      console.log(`[NEW_BOOKING] Emitting to admin_monitor for booking ${booking.id}`);
      io.to('admin_monitor').emit('new_booking', richBooking);
    } else {
      console.error('[NEW_BOOKING] ERROR: Socket.io instance not available!');
    }

    res.status(201).json(richBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5. Generic Status Mutation Logic
const updateStatus = async (req, res, id, nextStatus) => {
  const { cancel_reason, cancelled_by } = req.body;
  const io = req.app.get('io');

  try {
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Update booking status
    const updateData = { status: nextStatus };
    if (nextStatus === 'cancelled') {
      updateData.cancelled_by = cancelled_by || (req.user?.role === 'driver' ? 'driver' : 'admin');
      updateData.cancel_reason = cancel_reason || 'No reason provided';
      updateData.cancelled_at = new Date();
    }
    
    await booking.update(updateData);

    // Sync Driver and Ambulance Status
    if (['accepted', 'dispatched', 'arrived'].includes(nextStatus)) {
      if (booking.driver_id) await Driver.update({ status: 'on_trip' }, { where: { id: booking.driver_id } });
      if (booking.ambulance_id) await Ambulance.update({ status: 'busy' }, { where: { id: booking.ambulance_id } });
    } else if (['completed', 'cancelled', 'denied', 'timed_out'].includes(nextStatus)) {
      if (booking.driver_id) await Driver.update({ status: 'available' }, { where: { id: booking.driver_id } });
      if (booking.ambulance_id) await Ambulance.update({ status: 'available' }, { where: { id: booking.ambulance_id } });
    }

    // Broadcast Status Update to all surfaces
    const richBooking = await getRichBooking(id);
    broadcastBookingStatus(io, richBooking);

    // If driver/ambulance status changed, notify admin
    if (booking.driver_id) {
        const driver = await Driver.findByPk(booking.driver_id);
        broadcastDriverStatus(io, driver);
    }

    res.json(richBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating status' });
  }
};

// Status Shortcuts
exports.acceptBooking  = (req, res) => updateStatus(req, res, req.params.id, 'accepted');
exports.dispatchBooking = (req, res) => updateStatus(req, res, req.params.id, 'dispatched');
exports.arriveBooking  = (req, res) => updateStatus(req, res, req.params.id, 'arrived');
exports.completeBooking = (req, res) => updateStatus(req, res, req.params.id, 'completed');
exports.cancelBooking  = (req, res) => updateStatus(req, res, req.params.id, 'cancelled');

// Special Statuses
exports.denyBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findByPk(id);
    await booking.update({ status: 'denied' });
    
    const richBooking = await getRichBooking(id);
    broadcastBookingStatus(req.app.get('io'), richBooking);
    
    res.json(richBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.timeoutBooking = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await Booking.findByPk(id);
    await booking.update({ status: 'timed_out' });
    
    const richBooking = await getRichBooking(id);
    broadcastBookingStatus(req.app.get('io'), richBooking);
    
    res.json(richBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Manual Dispatch / Assign / Reassign
exports.assignBooking = async (req, res) => {
  const { id } = req.params;
  const { ambulance_id, driver_id } = req.body;
  try {
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Determine driver if only ambulance_id provided
    let resolvedDriverId = driver_id;
    if (ambulance_id && !resolvedDriverId) {
      const amb = await Ambulance.findByPk(ambulance_id);
      if (amb) resolvedDriverId = amb.driver_id;
    }

    await booking.update({
      ambulance_id,
      driver_id: resolvedDriverId,
      status: 'pending' // Reset to pending so driver gets the overlay
    });

    const richBooking = await getRichBooking(id);
    const io = req.app.get('io');
    
    if (io && resolvedDriverId) {
      io.to(`driver_room_${resolvedDriverId}`).emit('new_booking', richBooking);
    }
    broadcastBookingStatus(io, richBooking);

    res.json(richBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error assigning booking' });
  }
};

exports.reassignBooking = exports.assignBooking;
