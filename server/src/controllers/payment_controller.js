const db = require('../config/db');
const pesapalService = require('../services/pesapal');
const crypto = require('crypto');

const isPesapalConfigured = () => {
    return !!process.env.PESAPAL_BASE_URL && !!process.env.PESAPAL_CONSUMER_KEY && !!process.env.PESAPAL_SECRET_KEY;
};

exports.getAllPayments = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const result = await db.query(
            `SELECT p.*, b.patient_name, b.phone_number, b.pickup_address 
             FROM payments p 
             JOIN bookings b ON p.booking_id = b.id 
             WHERE b.company_id = $1 
             ORDER BY p.payment_date DESC`,
            [companyId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.initiatePayment = async (req, res) => {
    const { booking_id } = req.body;
    if (!booking_id) {
        return res.status(400).json({ error: 'booking_id is required' });
    }

    try {
        const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
        if (bookingResult.rowCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingResult.rows[0];
        const amount = booking.total_amount || booking.fare || 10000;
        const trackingId = crypto.randomBytes(10).toString('hex');

        const paymentResult = await db.query(
            `INSERT INTO payments (booking_id, pesapal_tracking_id, amount, status, payment_method)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [booking_id, trackingId, amount, 'pending', booking.payment_method]
        );

        const payment = paymentResult.rows[0];
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        let redirect_url = `${frontendUrl}/payment-status?OrderTrackingId=${trackingId}`;

        if (isPesapalConfigured()) {
            const token = await pesapalService.getOAuthToken();
            const pesapalResponse = await pesapalService.submitOrder(token, {
                internalPaymentId: payment.id,
                amount,
                description: `Payment for ambulance booking ${booking.id}`,
                email: booking.email || 'support@cityrescue.com',
                phone: booking.phone,
                name: booking.patient_name,
            });

            redirect_url = pesapalResponse.redirect_url || pesapalResponse.redirectUrl || pesapalResponse.url || redirect_url;
            const pesapalTrackingId = pesapalResponse.orderTrackingId || pesapalResponse.order_tracking_id || trackingId;
            await db.query('UPDATE payments SET pesapal_tracking_id = $1 WHERE id = $2', [pesapalTrackingId, payment.id]);
        } else {
            await db.query('UPDATE payments SET status = $1 WHERE id = $2', ['completed', payment.id]);
            await db.query('UPDATE bookings SET payment_status = $1 WHERE id = $2', ['PAID', booking.id]);
        }

        res.json({ redirect_url, payment });
    } catch (err) {
        console.error('Payment initiation failed:', err);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

exports.getPaymentStatus = async (req, res) => {
    const { booking_id } = req.params;

    try {
        const result = await db.query(
            `SELECT p.*, b.payment_status AS booking_payment_status, b.status AS booking_status
             FROM payments p
             JOIN bookings b ON p.booking_id = b.id
             WHERE p.booking_id = $1
             ORDER BY p.created_at DESC
             LIMIT 1`,
            [booking_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        const payment = result.rows[0];
        let status = payment.status;

        if (payment.booking_payment_status === 'paid' || payment.booking_payment_status === 'confirmed') {
            status = 'COMPLETED';
        } else if (status === 'completed') {
            status = 'COMPLETED';
        } else if (status === 'failed' || status === 'cancelled') {
            status = 'FAILED';
        } else {
            status = 'PENDING';
        }

        res.json({ status });
    } catch (err) {
        console.error('Payment status fetch failed:', err);
        res.status(500).json({ error: 'Failed to fetch payment status' });
    }
};

exports.handlePaymentWebhook = async (req, res) => {
    console.log('Pesapal webhook received:', req.body);
    res.json({ received: true });
};

exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED

    try {
        const result = await db.query(
            'UPDATE payments SET status = $1 WHERE id = $2',
            [status, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Also update booking payment status if approved
        if (status === 'APPROVED') {
            const payment = await db.query('SELECT booking_id FROM payments WHERE id = $1', [id]);
            if (payment.rows[0]) {
                await db.query(
                    'UPDATE bookings SET payment_status = $1 WHERE id = $2',
                    ['PAID', payment.rows[0].booking_id]
                );
            }
        }

        res.json({ message: `Payment status updated to ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getTransactionRecords = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const result = await db.query(
            `SELECT p.*, b.total_amount, b.patient_name 
             FROM payments p 
             JOIN bookings b ON p.booking_id = b.id 
             WHERE b.company_id = $1 AND p.status = 'APPROVED'
             ORDER BY p.payment_date DESC`,
            [companyId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
