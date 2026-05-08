import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10
            });

            this.socket.on('connect', () => {
                console.log('Driver socket connected:', this.socket.id);
            });

            this.socket.on('disconnect', () => {
                console.log('Driver socket disconnected');
            });
        }
        return this.socket;
    }

    joinBookingRoom(bookingId) {
        if (this.socket) {
            this.socket.emit('join_booking_room', bookingId);
        }
    }

    onNewBookingRequest(callback) {
        if (this.socket) {
            this.socket.on('new_booking_request', callback);
        }
    }

    onBookingUpdate(callback) {
        if (this.socket) {
            this.socket.on('booking_status_update', callback);
        }
    }

    emitDriverLocation(bookingId, location) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('update_driver_location', { booking_id: bookingId, location });
        }
    }

    emitAcceptBooking(bookingId) {
        if (this.socket) {
            this.socket.emit('accept_booking', { booking_id: bookingId });
        }
    }

    emitDenyBooking(bookingId) {
        if (this.socket) {
            this.socket.emit('deny_booking', { booking_id: bookingId });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;