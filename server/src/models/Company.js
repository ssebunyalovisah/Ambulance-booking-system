// server/src/models/Company.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true },
  },
  logo: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'companies',
  underscored: true,
});

module.exports = Company;
