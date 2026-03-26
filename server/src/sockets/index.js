module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room for a specific booking
    socket.on('join_booking_room', (bookingId) => {
      socket.join(`room_booking_${bookingId}`);
      console.log(`Socket ${socket.id} joined room_booking_${bookingId}`);
    });

    // Ambulance driver updates location
    socket.on('ambulance_location_update', (data) => {
      // Broadcast this back to the booking room
      io.to(`room_booking_${data.bookingId}`).emit('location_synced', {
        lat: data.lat,
        lng: data.lng,
        timestamp: new Date()
      });
      
      // Also broadcast to the main dashboard
      io.to('company_dashboard').emit('ambulance_live_location', data);
    });

    // Patient updates location for the booking
    socket.on('update_patient_location', (data) => {
      // Broadcast to the company dashboard
      io.to('company_dashboard').emit('patient_live_location', data);
    });
    
    // Admin joins main dashboard
    socket.on('join_dashboard', () => {
      socket.join('company_dashboard');
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
