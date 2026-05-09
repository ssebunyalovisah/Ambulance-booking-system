import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.DEV ? 'http://localhost:5001' : 'https://ambulance-booking-system-4ytj.onrender.com');

class AdminSocketService {
    constructor() {
        this.socket = null;
    }

    connect(data) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);
            this.socket.on('connect', () => {
                console.log('Admin socket connected');
                this.socket.emit('join_dashboard', data);
            });
        }
        return this.socket;
    }

    onNewBooking(callback) {
        if (this.socket) {
            this.socket.on('new_booking', callback);
        }
    }

    onDriverLocation(callback) {
        if (this.socket) {
            this.socket.on('driver_location_update', callback);
        }
    }

    onPatientLocation(callback) {
        if (this.socket) {
            this.socket.on('patient_location_update', callback);
        }
    }

    onBookingStatusUpdate(callback) {
        if (this.socket) {
            // These are all the events that indicate a booking status change in the spec
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
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const adminSocket = new AdminSocketService();
