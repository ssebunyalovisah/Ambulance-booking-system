require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

// 1. Production Security & Optimization
app.use(helmet({
    contentSecurityPolicy: false, // Disable for easier socket.io/map integration
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://ambulance-booking-system-4ytj.onrender.com',
    'https://ambulance-admin.onrender.com',
    'https://ambulance-driver.onrender.com'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// Socket.io Setup with production CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

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

// Import socket event handlers
require('./sockets/index')(io);

const companyRoutes = require('./routes/companies');
const ambulanceRoutes = require('./routes/ambulances');
const driverRoutes = require('./routes/drivers');
const bookingRoutes = require('./routes/bookings');
const locationRoutes = require('./routes/location');
const paymentRoutes = require('./routes/payments');
const feedbackRoutes = require('./routes/feedback');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

// Make io accessible to our router
app.set('io', io);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/reports', reportRoutes);

// Root route for info
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ambulance System Backend is Running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login'
    },
    frontends: [
      { name: 'Patient App', default_port: 5173 },
      { name: 'Admin Dashboard', default_port: 5174 }
    ],
    usage: 'Please ensure you start the frontends using "npm run dev" from the root directory.'
  });
});

// Sample route structure
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ambulance backend running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
