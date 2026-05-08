import { useEffect } from 'react';
import socketService from '../services/socket.js';

const useSocket = () => {
    useEffect(() => {
        const socket = socketService.connect();
        return () => {
            socketService.disconnect();
        };
    }, []);

    return socketService;
};

export default useSocket;