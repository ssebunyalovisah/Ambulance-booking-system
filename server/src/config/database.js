// server/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
  console.log('[Database] Initializing in PRODUCTION mode...');
  if (process.env.DATABASE_URL) {
    console.log('[Database] Using DATABASE_URL connection string.');
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
    });
  } else {
    console.log('[Database] DATABASE_URL not found. Falling back to individual credentials.');
    sequelize = new Sequelize(
      process.env.DB_NAME || 'ambulance_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: false,
      }
    );
  }
} else {
  console.log('[Database] Initializing in DEVELOPMENT mode (SQLite)...');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  });
}

module.exports = sequelize;
