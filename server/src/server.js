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

const publicAmbulanceRoutes = require('./routes/public_ambulances');
const publicBookingRoutes = require('./routes/public_bookings');
const authRoutes = require('./routes/auth');
const ambulanceRoutes = require('./routes/ambulances');
const adminBookingRoutes = require('./routes/admin_bookings');
const feedbackRoutes = require('./routes/feedback');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const companyRoutes = require('./routes/companies');

// Make io accessible to our router
app.set('io', io);

// Register routes
app.use('/api/public/ambulances', publicAmbulanceRoutes);
app.use('/api/public/bookings', publicBookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/ambulances', ambulanceRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments', require('./routes/payment_routes'));
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/companies', companyRoutes);

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
