import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket.js';
import { acceptBooking, denyBooking } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';

const RequestScreen = () => {
    const [currentRequest, setCurrentRequest] = useState(null);
    const navigate = useNavigate();
    const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

    useEffect(() => {
        const socket = socketService.connect();
        socketService.onNewBookingRequest((data) => {
            setCurrentRequest(data);
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    const handleAccept = async () => {
        try {
            await acceptBooking(currentRequest.id);
            socketService.emitAcceptBooking(currentRequest.id);
            setCurrentTrip(currentRequest);
            navigate('/trip');
        } catch (error) {
            console.error('Accept failed', error);
        }
    };

    const handleDeny = async () => {
        try {
            await denyBooking(currentRequest.id);
            socketService.emitDenyBooking(currentRequest.id);
            setCurrentRequest(null);
        } catch (error) {
            console.error('Deny failed', error);
        }
    };

    if (!currentRequest) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>No incoming requests</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-red-100">
            <div className="bg-white p-6 rounded shadow-md max-w-md">
                <h2 className="text-2xl mb-4 text-red-600">🚑 Emergency Request</h2>
                <p><strong>Patient:</strong> {currentRequest.patientName}</p>
                <p><strong>Description:</strong> {currentRequest.emergencyDescription}</p>
                <p><strong>Distance:</strong> {currentRequest.distance} km</p>
                <div className="mt-4 flex space-x-4">
                    <button onClick={handleAccept} className="bg-green-500 text-white p-2 rounded flex-1">✅ Accept</button>
                    <button onClick={handleDeny} className="bg-red-500 text-white p-2 rounded flex-1">❌ Deny</button>
                </div>
            </div>
        </div>
    );
};

export default RequestScreen;