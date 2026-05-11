// client-app/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  constructor() {
    this.socket = null;
    this.activeBookingId = null;
  }

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      if (this.activeBookingId) {
        this.joinBookingRoom(this.activeBookingId);
      }
    });

    return this.socket;
  }

  joinBookingRoom(bookingId) {
    this.activeBookingId = bookingId;
    if (this.socket) {
      this.socket.emit('join_booking', bookingId);
    }
  }

  onBookingUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('booking_status_update', callback);
    this.socket.on('booking_cancelled', callback);
    this.socket.on('trip_completed', callback);
  }

  onAmbulanceLocation(callback) {
    if (!this.socket) this.connect();
    this.socket.on('ambulance_location_update', callback);
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
