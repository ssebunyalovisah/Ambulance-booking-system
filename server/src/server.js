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

// Make io accessible to our router
app.set('io', io);

// Register routes
app.use('/api/public/ambulances', publicAmbulanceRoutes);
app.use('/api/public/bookings', publicBookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/ambulances', ambulanceRoutes);
app.use('/api/admin/bookings', adminBookingRoutes);

// Sample route structure
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ambulance backend running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
