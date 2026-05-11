// driver-app/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.driverId = null;
    this.activeBookingId = null;
  }

  connect(driverId) {
    if (this.socket && this.socket.connected) return this.socket;
    this.driverId = driverId;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.log('Driver Socket connected:', this.socket.id);
      // CRITICAL: Always rejoin driver room on connect/reconnect
      if (this.driverId) {
        this.socket.emit('join_driver_room', { driverId: this.driverId });
        console.log(`Driver ${this.driverId} rejoined driver_room_${this.driverId}`);
      }
      if (this.activeBookingId) {
        this.socket.emit('join_booking', this.activeBookingId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Driver Socket disconnected');
    });

    return this.socket;
  }

  joinBookingRoom(bookingId) {
    this.activeBookingId = bookingId;
    if (this.socket) {
      this.socket.emit('join_booking', bookingId);
    }
  }

  onNewBooking(callback) {
    if (!this.socket) this.connect();
    this.socket.on('new_booking', callback);
  }

  onBookingUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('booking_status_update', callback);
    this.socket.on('booking_cancelled', callback);
  }

  onPatientLocation(callback) {
    if (!this.socket) this.connect();
    this.socket.on('patient_location_update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;