// server/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.NODE_ENV === 'production'
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite', // matches current file name
      logging: false,
    });

module.exports = sequelize;
