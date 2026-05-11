// server/src/models/Payment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  transaction_id: {
    type: DataTypes.STRING,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  payment_method: {
    type: DataTypes.STRING,
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'payments',
  underscored: true,
});

module.exports = Payment;
