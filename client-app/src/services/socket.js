import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.DEV ? 'http://localhost:5001' : 'https://ambulance-booking-system-4ytj.onrender.com');

class SocketService {
    constructor() {
        this.socket = null;
        this._activeBookingId = null; // Tracks active booking room for reconnect rejoin
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
                console.log('[Client Socket] Connected:', this.socket.id);
                // v3 spec: Re-join booking room on every reconnect so no updates are missed
                if (this._activeBookingId) {
                    this.socket.emit('join_booking', this._activeBookingId);
                    console.log('[Client Socket] Rejoined booking room:', this._activeBookingId);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('[Client Socket] Disconnected');
            });
        }
        return this.socket;
    }

    joinBookingRoom(bookingId) {
        // Keep track so we can rejoin on reconnect
        this._activeBookingId = bookingId;
        if (this.socket) {
            this.socket.emit('join_booking', bookingId);
        }
    }

    leaveBookingRoom() {
        this._activeBookingId = null;
    }

    onDriverLocation(callback) {
        if (this.socket) {
            this.socket.on('driver_location_update', callback);
        }
    }

    offDriverLocation(callback) {
        if (this.socket) {
            this.socket.off('driver_location_update', callback);
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
                'driver_denied',
                'booking_status_update'
            ];
            events.forEach(evt => this.socket.on(evt, callback));
        }
    }

    offBookingUpdate(callback) {
        if (this.socket) {
            const events = [
                'booking_assigned',
                'booking_accepted',
                'ambulance_dispatched',
                'driver_arrived',
                'trip_completed',
                'booking_cancelled',
                'driver_denied',
                'booking_status_update'
            ];
            events.forEach(evt => this.socket.off(evt, callback));
        }
    }

    onAmbulanceUpdate(callback) {
        if (this.socket) {
            this.socket.on('ambulance_status_changed', callback);
        }
    }

    offAmbulanceUpdate(callback) {
        if (this.socket) {
            this.socket.off('ambulance_status_changed', callback);
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
