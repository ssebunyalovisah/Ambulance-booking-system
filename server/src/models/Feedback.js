// server/src/models/Feedback.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comments: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'feedback',
  underscored: true,
});

module.exports = Feedback;
