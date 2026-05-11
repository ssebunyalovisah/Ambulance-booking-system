// server/src/scripts/seed_v3.js
const { sequelize, Company, User, Driver, Ambulance } = require('../models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('Seeding Database (v3)...');
    
    // Sync without force to avoid wiping existing production data if run accidentally
    await sequelize.sync();
    console.log('Database schema synced.');

    // 1. Create Company
    const company = await Company.create({
      name: 'City Emergency Services',
      email: 'dispatch@cityrescue.com',
      phone: '+256 800 123456',
      logo: 'https://cdn-icons-png.flaticon.com/512/883/883407.png'
    });
    console.log('Default company created.');

    // 2. Create Super Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await User.create({
      company_id: company.id,
      full_name: 'System Administrator',
      email: 'admin@cityrescue.com',
      password_hash: passwordHash,
      role: 'super_admin'
    });
    console.log('Super-admin created (admin@cityrescue.com / admin123).');

    // 3. Create Drivers
    const drivers = await Driver.bulkCreate([
      { company_id: company.id, full_name: 'John Ssendawula', driver_id: 'DRV-001', phone: '+256 700 111222', status: 'available' },
      { company_id: company.id, full_name: 'Moses Musoke', driver_id: 'DRV-002', phone: '+256 700 333444', status: 'available' },
      { company_id: company.id, full_name: 'Sarah Nakato', driver_id: 'DRV-003', phone: '+256 700 555666', status: 'available' }
    ]);
    console.log('Initial drivers registered.');

    // 4. Create Ambulances & Link to Drivers
    await Ambulance.bulkCreate([
      { company_id: company.id, ambulance_number: 'UAS 123G', driver_id: drivers[0].id, status: 'available' },
      { company_id: company.id, ambulance_number: 'UBH 456X', driver_id: drivers[1].id, status: 'available' },
      { company_id: company.id, ambulance_number: 'UBA 789M', driver_id: drivers[2].id, status: 'available' }
    ]);
    
    // Update Drivers with Ambulance Links
    const ambulances = await Ambulance.findAll();
    for (let i = 0; i < drivers.length; i++) {
        await drivers[i].update({ ambulance_id: ambulances[i].id });
    }
    console.log('Ambulances registered and linked to drivers.');

    console.log('-----------------------------------');
    console.log('Seeding Complete!');
    console.log('Admin Email: admin@cityrescue.com');
    console.log('Admin Pass: admin123');
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
