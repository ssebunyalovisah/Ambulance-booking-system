// server/src/controllers/driver_controller.js
const { Driver, Ambulance, Company, sequelize } = require('../models');
const { broadcastDriverStatus } = require('../services/statusBroadcaster');

// 1. Get List
exports.getDrivers = async (req, res) => {
  const { company_id, role } = req.user;
  try {
    const where = {};
    if (role !== 'super_admin') {
      where.company_id = company_id;
    }

    const drivers = await Driver.findAll({
      where,
      include: [
        { model: Ambulance, attributes: ['ambulance_number'] },
        { model: Company, attributes: ['name'] },
      ],
      order: [['full_name', 'ASC']],
    });

    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error fetching drivers' });
  }
};

// 2. Create (Admin only)
exports.createDriver = async (req, res) => {
  const { full_name, phone, ambulance_id } = req.body;
  const { company_id } = req.user;

  // Auto-generate Driver ID: DRV-XXXXX
  const driver_id = `DRV-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    const driver = await Driver.create({
      company_id,
      full_name,
      driver_id,
      phone,
      ambulance_id: ambulance_id || null,
      status: 'available',
    });

    if (ambulance_id) {
      await Ambulance.update({ driver_id: driver.id }, { where: { id: ambulance_id } });
    }

    res.status(201).json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating driver' });
  }
};

// 3. Get One
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id, {
      include: [{ model: Ambulance, attributes: ['ambulance_number'] }],
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Update (Admin only)
exports.updateDriver = async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, ambulance_id, status } = req.body;
  const { company_id } = req.user;

  try {
    const driver = await Driver.findOne({ where: { id, company_id } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Handle ambulance change
    if (ambulance_id !== undefined && ambulance_id !== driver.ambulance_id) {
        // Clear driver from old ambulance
        await Ambulance.update({ driver_id: null }, { where: { driver_id: id } });
        // Set to new ambulance
        if (ambulance_id) {
            await Ambulance.update({ driver_id: id }, { where: { id: ambulance_id } });
        }
    }

    await driver.update({
      full_name: full_name || driver.full_name,
      phone: phone || driver.phone,
      ambulance_id: ambulance_id === undefined ? driver.ambulance_id : ambulance_id,
      status: status || driver.status,
    });

    // Broadcast status update if changed
    if (status) {
        broadcastDriverStatus(req.app.get('io'), driver);
    }

    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating driver' });
  }
};

// 5. Update Self Status (Driver only)
exports.updateSelfStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.user;

  try {
    const driver = await Driver.findByPk(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    await driver.update({ status });

    // Sync related ambulance status
    if (driver.ambulance_id) {
        const ambStatus = status === 'available' ? 'available' : (status === 'on_trip' ? 'busy' : 'inactive');
        await Ambulance.update({ status: ambStatus }, { where: { id: driver.ambulance_id } });
    }

    // Broadcast update to dashboards
    broadcastDriverStatus(req.app.get('io'), driver);

    res.json({ success: true, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating status' });
  }
};

// 6. Verify Driver ID (for smart login)
exports.verifyDriverId = async (req, res) => {
  const { driver_id } = req.params;
  try {
    const driver = await Driver.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('driver_id'))),
        sequelize.fn('LOWER', sequelize.fn('TRIM', driver_id))
      ),
      attributes: ['full_name'],
    });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error verifying driver' });
  }
};
