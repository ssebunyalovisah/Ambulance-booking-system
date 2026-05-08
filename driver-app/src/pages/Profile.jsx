import { useState } from 'react';

const Profile = () => {
    const [status, setStatus] = useState('available');

    return (
        <div className="p-4">
            <h2 className="text-2xl mb-4">Driver Profile</h2>
            <p>Name: John Doe</p>
            <p>ID: 12345</p>
            <p>Ambulance: Unit 001</p>
            <div className="mt-4">
                <label>Status:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2">
                    <option value="available">Available</option>
                    <option value="offline">Offline</option>
                </select>
            </div>
        </div>
    );
};

export default Profile;