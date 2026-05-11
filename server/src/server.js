require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { Server } = require('socket.io');
const { sequelize } = require('./models');

const app = express();
const server = http.createServer(app);

// 1. Production Security & Optimization
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://client-app-kiu.vercel.app',
    'https://client-admin-kiu.vercel.app',
    'https://driver-app-kiu.vercel.app'
  ];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true
}));

app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Make io accessible to routers
app.set('io', io);

// Import socket event handlers
require('./sockets/index')(io);

// Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const ambulanceRoutes = require('./routes/ambulances');
const driverRoutes = require('./routes/drivers');
const bookingRoutes = require('./routes/bookings');
const locationRoutes = require('./routes/location');
const paymentRoutes = require('./routes/payments');
const feedbackRoutes = require('./routes/feedback');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Ambulance System Backend (v3) is Running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sequelize: 'connected' });
});

// Database Synchronization and Server Start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // sync() is safe in production as long as force/alter are false (default)
    // It will only create missing tables, not drop existing data.
    await sequelize.sync();
    console.log('[Database] All models synchronized successfully.');

    server.listen(PORT, () => {
      console.log(`[Server] Ambulance System Backend (v3) is running on port ${PORT}`);
      console.log(`[Environment] ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Database] Sync failed:', err);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
