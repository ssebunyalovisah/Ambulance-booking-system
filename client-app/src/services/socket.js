import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001';

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
                console.log('Socket connected:', this.socket.id);
            });
        }
        return this.socket;
    }

    joinBookingRoom(bookingId) {
        if (this.socket) {
            this.socket.emit('join_booking_room', bookingId);
        }
    }

    onLocationSync(callback) {
        if (this.socket) {
            this.socket.on('location_synced', callback);
        }
    }

    onBookingUpdate(callback) {
        if (this.socket) {
            this.socket.on('booking_status_update', callback);
        }
    }

    emitPatientLocation(bookingId, location) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('update_patient_location', { booking_id: bookingId, location });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
