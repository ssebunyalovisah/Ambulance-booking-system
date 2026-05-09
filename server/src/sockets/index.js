module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Unified room for booking lifecycle
    socket.on('join_booking', (bookingId) => {
      socket.join(`room:booking_${bookingId}`);
      console.log(`Socket ${socket.id} joined room:booking_${bookingId}`);
    });

    socket.on('leave_booking', (bookingId) => {
      socket.leave(`room:booking_${bookingId}`);
      console.log(`Socket ${socket.id} left room:booking_${bookingId}`);
    });

    // Also support company dashboards for overview
    socket.on('join_dashboard', (data) => {
      const companyId = typeof data === 'object' ? data.companyId : data;
      const isSuper = typeof data === 'object' ? data.isSuper : false;

      if (companyId) {
        socket.join(`company_dashboard_${companyId}`);
      }
      
      if (isSuper) {
        socket.join('super_dashboard');
      }
    });

    // Real-time location updates
    socket.on('driver_location_update', (data) => {
      // data: { bookingId, companyId, lat, lng, ambulanceId, driverId }
      if (data.bookingId) {
        io.to(`room:booking_${data.bookingId}`).emit('driver_location_update', data);
      }
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('driver_location_update', data);
      }
      io.to('super_dashboard').emit('driver_location_update', data);
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
    });
  });
};
