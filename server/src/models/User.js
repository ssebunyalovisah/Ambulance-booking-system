// server/src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: true, // Super admin might not belong to a specific company
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin'),
    defaultValue: 'admin',
  },
}, {
  tableName: 'users',
  underscored: true,
});

User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
