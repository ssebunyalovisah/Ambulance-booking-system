// server/src/controllers/payment_controller.js
const { Payment, Booking } = require('../models');
const pesapalService = require('../services/pesapal');
const crypto = require('crypto');

const isPesapalConfigured = () => {
    return !!process.env.PESAPAL_BASE_URL && !!process.env.PESAPAL_CONSUMER_KEY && !!process.env.PESAPAL_SECRET_KEY;
};

exports.getAllPayments = async (req, res) => {
  const { company_id } = req.user;
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Booking,
          where: { company_id },
          attributes: ['patient_name', 'phone'],
        },
      ],
      order: [['payment_date', 'DESC']],
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching payments' });
  }
};

exports.initiatePayment = async (req, res) => {
    const { booking_id } = req.body;
    if (!booking_id) {
        return res.status(400).json({ error: 'booking_id is required' });
    }

    try {
        const booking = await Booking.findByPk(booking_id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const amount = booking.total_amount || 10000;
        const trackingId = crypto.randomBytes(10).toString('hex');

        const payment = await Payment.create({
            booking_id,
            pesapal_tracking_id: trackingId,
            amount,
            status: 'PENDING',
            payment_method: booking.payment_method || 'pesapal'
        });

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        let redirect_url = `${frontendUrl}/payment-status?OrderTrackingId=${trackingId}`;

        if (isPesapalConfigured()) {
            try {
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
                await payment.update({ pesapal_tracking_id: pesapalTrackingId });
            } catch (pError) {
                console.error('Pesapal service failed, falling back to manual redirect:', pError);
            }
        } else {
            // Mock completion for development if Pesapal not configured
            await payment.update({ status: 'APPROVED' });
            await booking.update({ payment_status: 'paid' });
        }

        res.json({ redirect_url, payment });
    } catch (err) {
        console.error('Payment initiation failed:', err);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

exports.getPaymentStatusByBookingId = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const payment = await Payment.findOne({
      where: { booking_id },
      order: [['created_at', 'DESC']]
    });
    
    if (!payment) return res.json({ status: 'PENDING' });
    
    const statusMap = {
      'APPROVED': 'COMPLETED',
      'COMPLETED': 'COMPLETED',
      'REJECTED': 'FAILED',
      'FAILED': 'FAILED'
    };
    
    res.json({ 
      status: statusMap[payment.status] || 'PENDING',
      amount: payment.amount,
      transaction_id: payment.pesapal_tracking_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.handlePaymentWebhook = async (req, res) => {
    console.log('Pesapal webhook received:', req.body);
    res.json({ received: true });
};

exports.updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await payment.update({ status });

    if (status === 'APPROVED' || status === 'COMPLETED') {
      await Booking.update(
        { payment_status: 'paid' },
        { where: { id: payment.booking_id } }
      );
    }

    res.json({ message: `Payment status updated to ${status}`, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTransactionRecords = async (req, res) => {
  const { company_id } = req.user;
  try {
    const payments = await Payment.findAll({
      where: { status: ['APPROVED', 'COMPLETED'] },
      include: [
        {
          model: Booking,
          where: { company_id },
          attributes: ['patient_name'],
        },
      ],
      order: [['payment_date', 'DESC']],
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
