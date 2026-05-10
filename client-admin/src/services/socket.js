import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.DEV ? 'http://localhost:5001' : 'https://ambulance-booking-system-4ytj.onrender.com');

class AdminSocketService {
    constructor() {
        this.socket = null;
    }

    connect(data) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true
            });
            this.socket.on('connect', () => {
                console.log('Admin socket connected');
                if (data) this.socket.emit('join_dashboard', data);
            });
        } else if (data) {
            this.socket.emit('join_dashboard', data);
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
                'driver_denied',
                'booking_status_update',
                'driver_status_changed'
            ];
            
            events.forEach(evt => {
                this.socket.on(evt, callback);
            });
        }
    }

    onAmbulanceStatusUpdate(callback) {
        if (this.socket) {
            this.socket.on('ambulance_status_changed', callback);
        }
    }

    onDriverStatusUpdate(callback) {
        if (this.socket) {
            this.socket.on('driver_status_changed', callback);
        }
    }
    
    offBookingStatusUpdate(callback) {
        if (this.socket) {
            const events = [
                'booking_assigned',
                'booking_accepted',
                'ambulance_dispatched',
                'driver_arrived',
                'trip_completed',
                'booking_cancelled',
                'driver_denied',
                'booking_status_update',
                'driver_status_changed'
            ];
            events.forEach(evt => this.socket.off(evt, callback));
        }
    }

    offAmbulanceStatusUpdate(callback) {
        if (this.socket) {
            this.socket.off('ambulance_status_changed', callback);
        }
    }

    offDriverStatusUpdate(callback) {
        if (this.socket) {
            this.socket.off('driver_status_changed', callback);
        }
    }

    offNewBooking(callback) {
        if (this.socket) {
            this.socket.off('new_booking', callback);
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
