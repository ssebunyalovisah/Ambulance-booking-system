// server/src/models/index.js
const sequelize = require('../config/database');
const Company = require('./Company');
const Ambulance = require('./Ambulance');
const Driver = require('./Driver');
const Booking = require('./Booking');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Payment = require('./Payment');
const Feedback = require('./Feedback');

// Associations

// Booking 1:1 Feedback
Booking.hasOne(Feedback, { foreignKey: 'booking_id' });
Feedback.belongsTo(Booking, { foreignKey: 'booking_id' });

// Booking 1:N Payment
Booking.hasMany(Payment, { foreignKey: 'booking_id' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });

// User 1:N RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// Company 1:N Ambulance
Company.hasMany(Ambulance, { foreignKey: 'company_id' });
Ambulance.belongsTo(Company, { foreignKey: 'company_id' });

// Company 1:N Driver
Company.hasMany(Driver, { foreignKey: 'company_id' });
Driver.belongsTo(Company, { foreignKey: 'company_id' });

// Company 1:N User (Admins)
Company.hasMany(User, { foreignKey: 'company_id' });
User.belongsTo(Company, { foreignKey: 'company_id' });

// Ambulance 1:1 Driver (Current assignment)
Ambulance.belongsTo(Driver, { foreignKey: 'driver_id', as: 'CurrentDriver' });
Driver.hasOne(Ambulance, { foreignKey: 'driver_id' });

// Booking Associations
Booking.belongsTo(Company, { foreignKey: 'company_id' });
Booking.belongsTo(Ambulance, { foreignKey: 'ambulance_id' });
Booking.belongsTo(Driver, { foreignKey: 'driver_id' });

module.exports = {
  sequelize,
  Company,
  Ambulance,
  Driver,
  Booking,
  User,
};
