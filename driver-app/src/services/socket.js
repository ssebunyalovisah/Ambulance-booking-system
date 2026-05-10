import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:5001' : 'https://ambulance-booking-system-4ytj.onrender.com');

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 10
            });

            this.socket.on('connect', () => {
                console.log('Driver socket connected:', this.socket.id);
                // Re-join rooms if we have data
                const companyId = localStorage.getItem('companyId');
                if (companyId) this.joinDashboard(companyId);
                
                const driverDbId = localStorage.getItem('driverDbId');
                if (driverDbId) this.joinDriverRoom(driverDbId);
            });

            this.socket.on('disconnect', () => {
                console.log('Driver socket disconnected');
            });
        } else if (this.socket.connected) {
            // Already connected, join rooms immediately
            const companyId = localStorage.getItem('companyId');
            if (companyId) this.joinDashboard(companyId);
            
            const driverDbId = localStorage.getItem('driverDbId');
            if (driverDbId) this.joinDriverRoom(driverDbId);
        }
        return this.socket;
    }

    joinBookingRoom(bookingId) {
        if (this.socket) {
            this.socket.emit('join_booking', bookingId);
        }
    }

    joinDashboard(companyId) {
        if (this.socket && companyId) {
            this.socket.emit('join_dashboard', { companyId });
        }
    }

    joinDriverRoom(driverId) {
        if (this.socket && driverId) {
            this.socket.emit('join_driver_room', { driverId });
        }
    }

    onNewBooking(callback) {
        if (this.socket) {
            this.socket.on('new_booking', callback);
        }
    }

    onBookingUpdate(callback) {
        if (this.socket) {
            this.socket.on('booking_status_update', callback);
        }
    }

    onPatientLocation(callback) {
        if (this.socket) {
            this.socket.on('patient_location_update', callback);
        }
    }

    emitDriverLocation(data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('driver_location_update', data);
        }
    }

    emitAcceptBooking(bookingId) {
        if (this.socket) {
            this.socket.emit('driver_accepted', { bookingId });
        }
    }

    emitDenyBooking(bookingId) {
        if (this.socket) {
            this.socket.emit('driver_denied', { bookingId });
        }
    }

    emitTripCompleted(bookingId) {
        if (this.socket) {
            this.socket.emit('trip_completed', { bookingId });
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