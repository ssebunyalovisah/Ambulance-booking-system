const db = require('../config/db');

exports.getAllPayments = async (req, res) => {
    try {
        const companyId = req.admin.company_id;
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
        const companyId = req.admin.company_id;
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
