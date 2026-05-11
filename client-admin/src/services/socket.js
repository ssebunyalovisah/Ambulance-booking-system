// client-admin/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class AdminSocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('Admin Socket connected:', this.socket.id);
      this.socket.emit('join_admin_monitor');
    });

    return this.socket;
  }

  onNewBooking(callback) {
    if (!this.socket) this.connect();
    this.socket.on('new_booking', callback);
  }

  offNewBooking(callback) {
    if (this.socket) this.socket.off('new_booking', callback);
  }

  onBookingUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('booking_status_update', callback);
    this.socket.on('booking_cancelled', callback);
    this.socket.on('trip_completed', callback);
  }

  onBookingStatusUpdate(callback) {
    this.onBookingUpdate(callback);
  }

  offBookingStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('booking_status_update', callback);
      this.socket.off('booking_cancelled', callback);
      this.socket.off('trip_completed', callback);
    }
  }

  onDriverUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('driver_status_update', callback);
  }

  onDriverStatusUpdate(callback) {
    this.onDriverUpdate(callback);
  }

  offDriverStatusUpdate(callback) {
    if (this.socket) this.socket.off('driver_status_update', callback);
  }

  onAmbulanceStatusUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('ambulance_status_changed', callback);
  }

  offAmbulanceStatusUpdate(callback) {
    if (this.socket) this.socket.off('ambulance_status_changed', callback);
  }

  onAmbulanceLocation(callback) {
    if (!this.socket) this.connect();
    this.socket.on('ambulance_location_update', callback);
  }

  onDriverLocation(callback) {
    this.onAmbulanceLocation(callback);
  }

  offDriverLocation(callback) {
    if (this.socket) this.socket.off('ambulance_location_update', callback);
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

export const adminSocket = new AdminSocketService();
export default adminSocket;
