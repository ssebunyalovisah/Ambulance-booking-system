import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://ambulance-booking-system-4ytj.onrender.com/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { token: refreshToken });
                    const { accessToken, refreshToken: newRefreshToken } = res.data;
                    localStorage.setItem('adminToken', accessToken);
                    localStorage.setItem('adminRefreshToken', newRefreshToken);
                    api.defaults.headers.Authorization = `Bearer ${accessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    console.error('Refresh token expired', refreshError);
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRefreshToken');
                    window.location.href = '/login';
                }
            } else {
                localStorage.removeItem('adminToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const verifyDriverId = async (driver_id) => {
    try {
        const response = await api.get(`/drivers/verify/${driver_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default api;
