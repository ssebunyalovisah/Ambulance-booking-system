import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import RequestScreen from './pages/RequestScreen';
import TripScreen from './pages/TripScreen';
import History from './pages/History';
import Profile from './pages/Profile';
import DriverLayout from './components/DriverLayout';

function App() {
    return (
        <Router>
            <DriverLayout>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/requests" element={<RequestScreen />} />
                    <Route path="/trip" element={<TripScreen />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </DriverLayout>
        </Router>
    );
}

export default App;
