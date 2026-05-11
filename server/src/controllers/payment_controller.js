// server/src/controllers/payment_controller.js
const { Payment, Booking } = require('../models');

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

exports.updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // APPROVED, REJECTED

  try {
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await payment.update({ status });

    // Sync booking payment status
    if (status === 'APPROVED') {
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
      where: { status: 'APPROVED' },
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

exports.getPaymentStatusByBookingId = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const payment = await Payment.findOne({
      where: { booking_id },
      order: [['created_at', 'DESC']]
    });
    
    if (!payment) return res.json({ status: 'PENDING' });
    
    // Map internal status to frontend expected status (COMPLETED, FAILED)
    const statusMap = {
      'APPROVED': 'COMPLETED',
      'COMPLETED': 'COMPLETED',
      'REJECTED': 'FAILED',
      'FAILED': 'FAILED'
    };
    
    res.json({ 
      status: statusMap[payment.status] || 'PENDING',
      amount: payment.amount,
      transaction_id: payment.transaction_id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
