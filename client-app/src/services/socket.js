import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
