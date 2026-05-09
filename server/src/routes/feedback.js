const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/public/feedback - Submit new feedback
router.post('/', async (req, res) => {
    const { booking_id, rating, comments } = req.body;

    if (!booking_id || !rating) {
        return res.status(400).json({ message: 'Booking ID and rating are required' });
    }

    try {
        const existing = await db.query('SELECT id FROM feedback WHERE booking_id = $1', [booking_id]);
        if (existing.rowCount > 0) {
            return res.status(400).json({ message: 'Feedback already submitted for this booking' });
        }

        await db.query(
            'INSERT INTO feedback (booking_id, rating, comments) VALUES ($1, $2, $3)',
            [booking_id, rating, comments]
        );

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/feedback - Get all feedback (Admin)
const auth = require('../middlewares/auth');
router.get('/admin/all', auth, async (req, res) => {
    const { company_id } = req.user;
    try {
        const sql = `
            SELECT f.*, b.patient_name, a.ambulance_number, a.driver_name
            FROM feedback f
            JOIN bookings b ON f.booking_id = b.id
            LEFT JOIN ambulances a ON b.ambulance_id = a.id
            WHERE b.company_id = $1
            ORDER BY f.created_at DESC
        `;
        const result = await db.query(sql, [company_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
