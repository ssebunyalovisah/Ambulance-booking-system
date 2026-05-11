// server/src/models/Driver.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  ambulance_id: {
    type: DataTypes.UUID,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  driver_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  photo: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('available', 'on_trip', 'offline'),
    defaultValue: 'available',
  },
}, {
  tableName: 'drivers',
  underscored: true,
});

module.exports = Driver;
