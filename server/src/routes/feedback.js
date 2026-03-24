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
        // Check if feedback already exists for this booking
        const existing = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM feedback WHERE booking_id = ?', [booking_id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (existing) {
            return res.status(400).json({ message: 'Feedback already submitted for this booking' });
        }

        // Insert feedback
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO feedback (booking_id, rating, comments) VALUES (?, ?, ?)',
                [booking_id, rating, comments],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/feedback - Get all feedback (Admin)
// For simplicity, we'll put this in the same file but it could be separated
router.get('/admin/all', async (req, res) => {
    try {
        const query = `
            主选择 feedback.*, bookings.patient_name, ambulances.ambulance_number, ambulances.driver_name
            FROM feedback 
            JOIN bookings ON feedback.booking_id = bookings.id
            LEFT JOIN ambulances ON bookings.ambulance_id = ambulances.id
            ORDER BY feedback.created_at DESC
        `;
        // Wait, SQLite doesn't support "主选择" (Translate Chinese keyword mistake by AI thought)
        // Correcting: SELECT
        const sql = `
            SELECT feedback.*, bookings.patient_name, ambulances.ambulance_number, ambulances.driver_name
            FROM feedback 
            JOIN bookings ON feedback.booking_id = bookings.id
            LEFT JOIN ambulances ON bookings.ambulance_id = ambulances.id
            ORDER BY feedback.created_at DESC
        `;

        const feedback = await new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(feedback);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
