import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://ambulance-booking-system-4ytj.onrender.com';

class AdminSocketService {
    constructor() {
        this.socket = null;
    }

    connect(data) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10,
            });
            this.socket.on('connect', () => {
                console.log('Admin socket connected');
                // Re-join all rooms on connect/reconnect (v3 spec)
                if (data) this.socket.emit('join_dashboard', data);
                this.socket.emit('join_admin_monitor');
            });
        } else {
            if (data) this.socket.emit('join_dashboard', data);
            this.socket.emit('join_admin_monitor');
        }
        return this.socket;
    }

    joinAdminMonitor() {
        if (this.socket) this.socket.emit('join_admin_monitor');
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
            // Listen to both event names for compatibility
            this.socket.on('driver_status_changed', callback);
            this.socket.on('driver_status_update', callback);  // v3 canonical event
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
            this.socket.off('driver_status_update', callback);
        }
    }

    offNewBooking(callback) {
        if (this.socket) {
            this.socket.off('new_booking', callback);
        }
    }

    offDriverLocation(callback) {
        if (this.socket) {
            this.socket.off('driver_location_update', callback);
        }
    }

    offPatientLocation(callback) {
        if (this.socket) {
            this.socket.off('patient_location_update', callback);
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
