// server/src/models/Ambulance.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ambulance = sequelize.define('Ambulance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  ambulance_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  driver_id: {
    type: DataTypes.UUID,
  },
  gps_capable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  status: {
    type: DataTypes.ENUM('available', 'busy', 'inactive'),
    defaultValue: 'available',
  },
}, {
  tableName: 'ambulances',
  underscored: true,
});

module.exports = Ambulance;
