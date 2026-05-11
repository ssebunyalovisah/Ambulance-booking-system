// client-app/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
    // Clear existing listeners to avoid duplicates on re-render
    this.socket.off('booking_status_update');
    this.socket.off('booking_cancelled');
    this.socket.off('trip_completed');
    
    this.socket.on('booking_status_update', (data) => {
      console.log('[Socket] Status Update received:', data);
      callback(data);
    });
    this.socket.on('booking_cancelled', (data) => {
      console.log('[Socket] Cancellation received:', data);
      callback(data);
    });
    this.socket.on('trip_completed', (data) => {
      console.log('[Socket] Trip Completed received:', data);
      callback(data);
    });
  }

  onAmbulanceLocation(callback) {
    if (!this.socket) this.connect();
    this.socket.off('ambulance_location_update');
    this.socket.on('ambulance_location_update', (data) => {
      console.log('[Socket] Location Update received:', data);
      callback(data);
    });
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
