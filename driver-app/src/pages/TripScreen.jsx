import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import socketService from '../services/socket.js';
import { completeTrip, updateDriverLocation } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import useLocationStore from '../store/useLocationStore.js';
import useDriverLocation from '../hooks/useDriverLocation.js';
import 'leaflet/dist/leaflet.css';

const TripScreen = () => {
    const navigate = useNavigate();
    const currentTrip = useTripStore((state) => state.currentTrip);
    const { driverLocation, patientLocation } = useLocationStore();
    const { location: currentLocation } = useDriverLocation();

    useEffect(() => {
        if (currentLocation) {
            updateDriverLocation(currentLocation);
            socketService.emitDriverLocation(currentTrip.id, currentLocation);
        }
    }, [currentLocation, currentTrip]);

    const handleComplete = async () => {
        try {
            await completeTrip(currentTrip.id);
            navigate('/history');
        } catch (error) {
            console.error('Complete failed', error);
        }
    };

    if (!currentTrip) {
        return <div>No active trip</div>;
    }

    return (
        <div className="min-h-screen">
            <div className="h-96">
                <MapContainer center={[currentLocation?.lat || 0, currentLocation?.lng || 0]} zoom={13} className="h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {driverLocation && (
                        <Marker position={[driverLocation.lat, driverLocation.lng]}>
                            <Popup>Driver</Popup>
                        </Marker>
                    )}
                    {patientLocation && (
                        <Marker position={[patientLocation.lat, patientLocation.lng]}>
                            <Popup>Patient</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
            <div className="p-4">
                <h2 className="text-xl">Trip in Progress</h2>
                <p>Patient: {currentTrip.patientName}</p>
                <p>Description: {currentTrip.emergencyDescription}</p>
                <button onClick={handleComplete} className="bg-blue-500 text-white p-2 mt-4">Complete Trip</button>
            </div>
        </div>
    );
};

export default TripScreen;