// server/src/controllers/ambulance_controller.js
const { Ambulance, Driver, Company } = require('../models');

// 1. Get List
exports.getAmbulances = async (req, res) => {
  const { company_id, role } = req.user;
  try {
    const where = {};
    if (role !== 'super_admin') {
      where.company_id = company_id;
    }

    const ambulances = await Ambulance.findAll({
      where,
      include: [
        { model: Driver, as: 'CurrentDriver', attributes: ['full_name', 'driver_id'] },
        { model: Company, attributes: ['name'] },
      ],
      order: [['ambulance_number', 'ASC']],
    });

    res.json(ambulances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching ambulances' });
  }
};

// 2. Register Ambulance (Admin only)
exports.registerAmbulance = async (req, res) => {
  const { ambulance_number, driver_id, gps_capable } = req.body;
  const { company_id } = req.user;

  try {
    const ambulance = await Ambulance.create({
      company_id,
      ambulance_number,
      driver_id: driver_id || null,
      gps_capable: gps_capable !== undefined ? gps_capable : true,
      status: 'available',
    });

    if (driver_id) {
      await Driver.update({ ambulance_id: ambulance.id }, { where: { id: driver_id } });
    }

    const richAmbulance = await Ambulance.findByPk(ambulance.id, {
        include: [{ model: Driver, as: 'CurrentDriver', attributes: ['full_name'] }]
    });

    res.status(201).json(richAmbulance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating ambulance' });
  }
};

// 3. Update Ambulance
exports.updateAmbulance = async (req, res) => {
  const { id } = req.params;
  const { ambulance_number, driver_id, gps_capable, status } = req.body;
  const { company_id } = req.user;

  try {
    const ambulance = await Ambulance.findOne({ where: { id, company_id } });
    if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });

    // Handle driver change
    if (driver_id !== undefined && driver_id !== ambulance.driver_id) {
        // Clear old driver's ambulance link
        await Driver.update({ ambulance_id: null }, { where: { ambulance_id: id } });
        // Set new driver's link
        if (driver_id) {
            await Driver.update({ ambulance_id: id }, { where: { id: driver_id } });
        }
    }

    await ambulance.update({
      ambulance_number: ambulance_number || ambulance.ambulance_number,
      driver_id: driver_id === undefined ? ambulance.driver_id : driver_id,
      gps_capable: gps_capable === undefined ? ambulance.gps_capable : gps_capable,
      status: status || ambulance.status,
    });

    const richAmbulance = await Ambulance.findByPk(id, {
        include: [{ model: Driver, as: 'CurrentDriver', attributes: ['full_name'] }]
    });

    // Broadcast update if status changed
    if (status) {
        const io = req.app.get('io');
        if (io) {
            io.to(`company_dashboard_${company_id}`).emit('ambulance_status_changed', richAmbulance);
            io.emit('ambulance_status_changed', richAmbulance);
        }
    }

    res.json(richAmbulance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating ambulance' });
  }
};

// 4. Update Status (Shortcut)
exports.updateAmbulanceStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { company_id } = req.user;

    try {
        const ambulance = await Ambulance.findOne({ where: { id, company_id } });
        if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });

        await ambulance.update({ status });

        const richAmbulance = await Ambulance.findByPk(id, {
            include: [{ model: Driver, as: 'CurrentDriver', attributes: ['full_name'] }]
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`company_dashboard_${company_id}`).emit('ambulance_status_changed', richAmbulance);
            io.emit('ambulance_status_changed', richAmbulance);
        }

        res.json(richAmbulance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// 5. Delete
exports.deleteAmbulance = async (req, res) => {
  const { id } = req.params;
  const { company_id } = req.user;
  try {
    const ambulance = await Ambulance.findOne({ where: { id, company_id } });
    if (!ambulance) return res.status(404).json({ error: 'Ambulance not found' });

    await Driver.update({ ambulance_id: null }, { where: { ambulance_id: id } });
    await ambulance.destroy();

    res.json({ message: 'Ambulance deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
