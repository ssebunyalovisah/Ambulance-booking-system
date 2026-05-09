require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

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
