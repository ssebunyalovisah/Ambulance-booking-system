import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getPaymentStatus } from '../services/api';
import { useBookingStore } from '../store/useBookingStore';

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setActiveBooking } = useBookingStore();
    const [status, setStatus] = useState('checking'); // 'checking', 'success', 'failed'
    
    useEffect(() => {
        const orderTrackingId = searchParams.get('OrderTrackingId');
        const bookingId = localStorage.getItem('pending_booking_id');

        if (!bookingId) {
            navigate('/', { replace: true });
            return;
        }

        let pollInterval;
        let attempts = 0;
        const maxAttempts = 12; // Poll for 1 minute (every 5 seconds)

        const checkStatus = async () => {
            try {
                attempts++;
                const result = await getPaymentStatus(bookingId);
                
                if (result.status === 'COMPLETED') {
                    clearInterval(pollInterval);
                    setStatus('success');
                    localStorage.removeItem('pending_booking_id');
                    
                    // Activate booking in store so the app shows TrackingPage
                    setTimeout(() => {
                        setActiveBooking(bookingId, 'PAID');
                        // Check if we are inside an iframe
                        if (window !== window.parent) {
                            window.parent.postMessage({ type: 'PESAPAL_PAYMENT_SUCCESS', bookingId }, '*');
                        } else {
                            navigate('/map', { replace: true });
                        }
                    }, 2000);
                } else if (result.status === 'FAILED') {
                    clearInterval(pollInterval);
                    setStatus('failed');
                    localStorage.removeItem('pending_booking_id');
                    
                    if (window !== window.parent) {
                        setTimeout(() => {
                            window.parent.postMessage({ type: 'PESAPAL_PAYMENT_FAILED' }, '*');
                        }, 3000);
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    setStatus('failed');
                    if (window !== window.parent) {
                        setTimeout(() => {
                            window.parent.postMessage({ type: 'PESAPAL_PAYMENT_FAILED' }, '*');
                        }, 3000);
                    }
                }
            } catch (err) {
                console.error("Status check failed", err);
            }
        };

        // Check immediately, then poll
        checkStatus();
        pollInterval = setInterval(checkStatus, 5000);

        return () => clearInterval(pollInterval);
    }, [navigate, searchParams, setActiveBooking]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
                {status === 'checking' && (
                    <>
                        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Payment...</h2>
                        <p className="text-slate-500">Please wait while we confirm your transaction with Pesapal.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
                        <p className="text-slate-500">Dispatching your ambulance now...</p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h2>
                        <p className="text-slate-500 mb-6">We could not verify your payment. Please try again or call emergency services directly.</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Return to Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusPage;
