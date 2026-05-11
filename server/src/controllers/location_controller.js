// server/src/controllers/location_controller.js
const { Ambulance, Driver, Company } = require('../models');

// In-memory store for latest locations
const driverLocations = new Map(); // driver_id -> { lat, lng, timestamp }

exports.getNearbyAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.findAll({
      where: { status: 'available' },
      include: [
        { model: Driver, as: 'CurrentDriver', attributes: ['id', 'full_name', 'driver_id', 'phone'] },
        { model: Company, attributes: ['name', 'logo', 'phone'] },
      ],
    });

    const nearby = ambulances.map(amb => {
      const loc = driverLocations.get(amb.driver_id);
      // Fallback to mock coords if no live data (for demo)
      const lat = loc?.lat || (0.3476 + (Math.random() - 0.5) * 0.05);
      const lng = loc?.lng || (32.5825 + (Math.random() - 0.5) * 0.05);

      return {
        id: amb.id,
        ambulance_number: amb.ambulance_number,
        company_id: amb.company_id,
        company_name: amb.Company?.name,
        company_logo: amb.Company?.logo,
        driver_id: amb.driver_id,
        driver_name: amb.CurrentDriver?.full_name,
        driver_uid: amb.CurrentDriver?.driver_id,
        lat,
        lng,
        is_live: !!loc,
        distance: (Math.random() * 5 + 1).toFixed(1), // Mock
        eta: Math.floor(Math.random() * 10 + 2), // Mock
      };
    });

    const allAmbs = await Ambulance.findAll();
    console.log(`Total ambulances in DB: ${allAmbs.length}`);
    allAmbs.forEach(a => console.log(`- Amb ${a.ambulance_number}: status=${a.status}`));

    console.log(`Found ${ambulances.length} available ambulances.`);
    res.json(nearby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePatientLocation = (req, res) => {
  const { booking_id, lat, lng } = req.body;
  const io = req.app.get('io');

  if (io && booking_id) {
    io.to(`room:booking_${booking_id}`).emit('patient_location_update', {
      bookingId: booking_id,
      lat,
      lng,
      timestamp: new Date()
    });
    // Also notify admin monitor
    io.to('admin_monitor').emit('patient_location_update', {
      bookingId: booking_id,
      lat,
      lng
    });
  }

  res.json({ success: true });
};

exports.updateDriverLocation = (req, res) => {
  const { lat, lng, booking_id } = req.body;
  const driverId = req.user.id;

  driverLocations.set(driverId, { lat, lng, timestamp: new Date() });

  const io = req.app.get('io');
  if (io) {
    const payload = { driverId, lat, lng, timestamp: new Date(), bookingId: booking_id };
    
    if (booking_id) {
      io.to(`room:booking_${booking_id}`).emit('ambulance_location_update', payload);
    }

    // Global emit for map tracking on admin/client
    io.to('admin_monitor').emit('ambulance_location_update', payload);
    io.emit('ambulance_location_update', payload);
  }

  res.json({ success: true });
};
