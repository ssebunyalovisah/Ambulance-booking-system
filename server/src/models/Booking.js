// server/src/models/Booking.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patient_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  emergency_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'mobile_money', 'card'),
    defaultValue: 'cash',
  },
  patient_lat: {
    type: DataTypes.FLOAT,
  },
  patient_lng: {
    type: DataTypes.FLOAT,
  },
  company_id: {
    type: DataTypes.UUID,
  },
  ambulance_id: {
    type: DataTypes.UUID,
  },
  driver_id: {
    type: DataTypes.UUID,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'dispatched', 'arrived', 'completed', 'cancelled', 'denied', 'timed_out'),
    defaultValue: 'pending',
  },
  cancelled_by: {
    type: DataTypes.ENUM('driver', 'client', 'admin'),
  },
  cancel_reason: {
    type: DataTypes.TEXT,
  },
  cancelled_at: {
    type: DataTypes.DATE,
  },
  payment_status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'confirmed'),
    defaultValue: 'unpaid',
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
  },
  feedback: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
  },
}, {
  tableName: 'bookings',
  underscored: true,
});

module.exports = Booking;
