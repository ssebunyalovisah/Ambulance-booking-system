import { useState, useEffect } from 'react';
import useLocationStore from '../store/useLocationStore';

const useDriverLocation = () => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const setDriverLocation = useLocationStore((state) => state.setDriverLocation);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser.');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const loc = { lat: latitude, lng: longitude };
                setLocation(loc);
                setDriverLocation(loc);
                setError(null);
            },
            (err) => {
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [setDriverLocation]);

    return { location, error };
};

export default useDriverLocation;