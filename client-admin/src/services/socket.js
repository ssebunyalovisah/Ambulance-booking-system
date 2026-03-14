import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class AdminSocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('Admin socket connected');
                this.socket.emit('join_dashboard');
            });
        }
        return this.socket;
    }

    onNewBooking(callback) {
        if (this.socket) {
            this.socket.on('new_booking_request', callback);
        }
    }

    onAmbulanceLocation(callback) {
        if (this.socket) {
            this.socket.on('ambulance_live_location', callback);
        }
    }

    onBookingStatusUpdate(callback) {
        if (this.socket) {
            this.socket.on('booking_status_changed', callback);
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const adminSocket = new AdminSocketService();
