import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ambulance-booking-system-4ytj.onrender.com';

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
            this.socket.emit('join_booking', bookingId);
        }
    }

    onDriverLocation(callback) {
        if (this.socket) {
            this.socket.on('driver_location_update', callback);
        }
    }

    onBookingUpdate(callback) {
        if (this.socket) {
            const events = [
                'booking_assigned',
                'booking_accepted',
                'ambulance_dispatched',
                'driver_arrived',
                'trip_completed',
                'booking_cancelled',
                'driver_denied'
            ];
            
            events.forEach(evt => {
                this.socket.on(evt, callback);
            });
        }
    }

    emitPatientLocation(bookingId, location) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('patient_location_update', { 
                bookingId, 
                lat: location.lat, 
                lng: location.lng 
            });
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
