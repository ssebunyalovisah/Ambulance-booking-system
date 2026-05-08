import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ambulance-booking-system-4ytj.onrender.com';

class AdminSocketService {
    constructor() {
        this.socket = null;
    }

    connect(companyId) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);
            this.companyId = companyId;

            this.socket.on('connect', () => {
                console.log('Admin socket connected');
                this.socket.emit('join_dashboard', this.companyId);
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
