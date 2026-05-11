module.exports = (io) => {
  // Import models for pending booking recovery
  const { Booking, Company, Driver, Ambulance } = require('../models');

  // Track active driver rooms for room verification
  const activeDriverRooms = new Map(); // driverId -> socketId[]

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Unified room for booking lifecycle
    socket.on('join_booking', (bookingId) => {
      const room = bookingId.startsWith('room:booking_') ? bookingId : `room:booking_${bookingId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on('join_room', (roomName) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('leave_booking', (bookingId) => {
      const room = bookingId.startsWith('room:booking_') ? bookingId : `room:booking_${bookingId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);
    });

    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left room: ${roomName}`);
    });

    // Also support company dashboards for overview
    socket.on('join_dashboard', (data) => {
      const companyId = typeof data === 'object' ? data.companyId : data;
      const isSuper = typeof data === 'object' ? data.isSuper : false;

      // Always join the canonical admin_monitor room (v3 spec)
      socket.join('admin_monitor');

      if (companyId) {
        socket.join(`company_dashboard_${companyId}`);
      }
      
      if (isSuper) {
        socket.join('super_dashboard');
      }
    });

    // Explicit admin_monitor join (alternative emit from client)
    socket.on('join_admin_monitor', () => {
      socket.join('admin_monitor');
      console.log(`Socket ${socket.id} joined admin_monitor`);
    });

    // CRITICAL: Driver room join with tracking and pending booking recovery
    socket.on('join_driver_room', async (data) => {
      const driverId = typeof data === 'object' ? data.driverId : data;
      if (driverId) {
        socket.join(`driver_room_${driverId}`);
        
        // Track active driver rooms
        if (!activeDriverRooms.has(driverId)) {
          activeDriverRooms.set(driverId, []);
        }
        activeDriverRooms.get(driverId).push(socket.id);
        
        console.log(`[DRIVER ROOM] Socket ${socket.id} joined driver_room_${driverId}. Active: ${activeDriverRooms.get(driverId).length}`);
        
        // FALLBACK: Fetch and re-emit pending bookings for this driver
        try {
          const pendingBooking = await Booking.findOne({
            where: {
              driver_id: driverId,
              status: 'pending'
            },
            include: [
              { model: Company, attributes: ['name', 'phone', 'logo'] },
              { model: Driver, attributes: ['full_name', 'driver_id', 'phone', 'photo'] },
              { model: Ambulance, attributes: ['ambulance_number'] },
            ],
            order: [['created_at', 'DESC']],
          });
          
          if (pendingBooking) {
            console.log(`[DRIVER ROOM] Recovering pending booking ${pendingBooking.id} for driver ${driverId}`);
            socket.emit('new_booking', pendingBooking);
          } else {
            console.log(`[DRIVER ROOM] No pending bookings for driver ${driverId}`);
          }
        } catch (err) {
          console.error(`[DRIVER ROOM] Error recovering pending bookings for ${driverId}:`, err);
        }
      }
    });

    // Real-time location updates
    socket.on('driver_location_update', (data) => {
      // data: { bookingId, companyId, lat, lng, ambulanceId, driverId }
      if (data.bookingId) {
        io.to(`room:booking_${data.bookingId}`).emit('ambulance_location_update', data);
      }
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('ambulance_location_update', data);
      }
      io.to('super_dashboard').emit('ambulance_location_update', data);
      // v3 spec: also emit to admin_monitor
      io.to('admin_monitor').emit('ambulance_location_update', data);
    });

    socket.on('patient_location_update', (data) => {
      // data: { bookingId, companyId, lat, lng }
      if (data.bookingId) {
        io.to(`room:booking_${data.bookingId}`).emit('patient_location_update', data);
      }
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('patient_location_update', data);
      }
      io.to('super_dashboard').emit('patient_location_update', data);
    });

    // Driver workflow events
    socket.on('driver_accepted', (data) => {
      // data: { bookingId, driverId, ambulanceId, companyId }
      if (data.bookingId) {
        io.to(`room:booking_${data.bookingId}`).emit('driver_accepted', data);
      }
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('driver_accepted', data);
      }
      io.to('super_dashboard').emit('driver_accepted', data);
    });

    socket.on('driver_denied', (data) => {
      // data: { bookingId, driverId, companyId, reason }
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('driver_denied', data);
      }
      io.to('super_dashboard').emit('driver_denied', data);
    });

    socket.on('trip_completed', (data) => {
      // data: { bookingId, driverId, companyId }
      if (data.bookingId) {
        io.to(`room:booking_${data.bookingId}`).emit('trip_completed', data);
      }
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('trip_completed', data);
      }
      io.to('super_dashboard').emit('trip_completed', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Clean up driver room tracking
      for (const [driverId, socketIds] of activeDriverRooms.entries()) {
        const idx = socketIds.indexOf(socket.id);
        if (idx !== -1) {
          socketIds.splice(idx, 1);
          console.log(`[DRIVER ROOM] Socket ${socket.id} left driver_room_${driverId}. Remaining: ${socketIds.length}`);
          if (socketIds.length === 0) {
            activeDriverRooms.delete(driverId);
          }
        }
      }
    });
  });

  // Expose helper for booking controller to verify room before emitting
  return { activeDriverRooms };
};

