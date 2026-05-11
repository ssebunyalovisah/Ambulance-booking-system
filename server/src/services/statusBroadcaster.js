// server/src/services/statusBroadcaster.js

/**
 * Universal Status Broadcaster
 * Ensures that any status change propagates to all surfaces simultaneously.
 */
const broadcastBookingStatus = (io, booking) => {
  if (!io || !booking) return;

  const payload = {
    bookingId: booking.id,
    status: booking.status,
    cancelledBy: booking.cancelled_by,
    cancelReason: booking.cancel_reason,
    updatedAt: booking.updated_at || new Date(),
  };

  // 1. Emit to shared booking room (Client + Admin tracking)
  io.to(`room:booking_${booking.id}`).emit('booking_status_update', payload);

  // 2. Emit to assigned driver's private room
  if (booking.driver_id) {
    io.to(`driver_room_${booking.driver_id}`).emit('booking_status_update', payload);
  }

  // 3. Emit to admin monitor room
  io.to('admin_monitor').emit('booking_status_update', payload);

  // Special cases for cancellation and completion
  if (booking.status === 'cancelled') {
    io.to(`room:booking_${booking.id}`).emit('booking_cancelled', payload);
    if (booking.driver_id) {
        io.to(`driver_room_${booking.driver_id}`).emit('booking_cancelled', payload);
    }
    io.to('admin_monitor').emit('booking_cancelled', payload);
  }

  if (booking.status === 'completed') {
    io.to(`room:booking_${booking.id}`).emit('trip_completed', payload);
    io.to('admin_monitor').emit('trip_completed', payload);
  }
};

const broadcastDriverStatus = (io, driver) => {
  if (!io || !driver) return;

  const payload = {
    driverId: driver.id,
    status: driver.status,
    ambulanceId: driver.ambulance_id,
    companyId: driver.company_id,
  };

  // Notify admin monitor for KPI counter updates and fleet map markers
  io.to('admin_monitor').emit('driver_status_update', payload);
};

module.exports = {
  broadcastBookingStatus,
  broadcastDriverStatus,
};
