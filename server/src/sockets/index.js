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
      
      // Also broadcast to super dashboard
      io.to('super_dashboard').emit('ambulance_live_location', data);
      
      // Also broadcast to the specific company dashboard if companyId is provided
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('ambulance_live_location', data);
      }
    });

    // Patient updates location for the booking
    socket.on('update_patient_location', (data) => {
      // Broadcast to super dashboard
      io.to('super_dashboard').emit('patient_live_location', data);

      // Broadcast to the specific company dashboard
      if (data.companyId) {
        io.to(`company_dashboard_${data.companyId}`).emit('patient_live_location', data);
      }
    });
    
    // Admin joins main dashboard (company specific or super)
    socket.on('join_dashboard', (data) => {
      // data can be companyId or { companyId, isSuper }
      const companyId = typeof data === 'object' ? data.companyId : data;
      const isSuper = typeof data === 'object' ? data.isSuper : false;

      if (companyId) {
        socket.join(`company_dashboard_${companyId}`);
        console.log(`Admin socket ${socket.id} joined company_dashboard_${companyId}`);
      }
      
      if (isSuper) {
        socket.join('super_dashboard');
        console.log(`Admin socket ${socket.id} joined super_dashboard`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
