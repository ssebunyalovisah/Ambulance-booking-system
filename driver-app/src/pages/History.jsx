import { useState, useEffect } from 'react';
import { getDriverBookings } from '../services/api.js';

const History = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const bookings = await getDriverBookings();
                setHistory(bookings.filter(b => b.status === 'completed'));
            } catch (error) {
                console.error('Fetch history failed', error);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-2xl mb-4">Trip History</h2>
            <ul>
                {history.map((trip) => (
                    <li key={trip.id} className="border p-2 mb-2">
                        <p>Patient: {trip.patientName}</p>
                        <p>Status: {trip.status}</p>
                        <p>Earnings: {trip.earnings || 'N/A'}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default History;