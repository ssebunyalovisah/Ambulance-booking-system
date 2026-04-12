const db = require('../config/db');

exports.getReportsData = async (req, res) => {
    const { company_id } = req.admin;
    const { 
        reportType, 
        startDate, 
        endDate, 
        ambulanceId, 
        driverId, 
        status, 
        paymentStatus 
    } = req.query;

    try {
        let dateFilter = '';
        const params = [company_id];
        let paramIndex = 2;

        if (startDate && endDate) {
            dateFilter = ` AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(new Date(startDate).toISOString(), new Date(endDate).toISOString());
            paramIndex += 2;
        }

        let data = {};

        switch (reportType) {
            case 'BOOKING_SUMMARY':
                const bookingStats = await db.query(
                    `SELECT status, COUNT(*) as count FROM bookings WHERE company_id = $1 ${dateFilter} GROUP BY status`,
                    params
                );
                const timeline = await db.query(
                    `SELECT DATE(created_at) as date, COUNT(*) as count FROM bookings WHERE company_id = $1 ${dateFilter} GROUP BY DATE(created_at) ORDER BY date`,
                    params
                );
                data = { stats: bookingStats.rows, timeline: timeline.rows };
                break;

            case 'REVENUE':
                const revenueTimeline = await db.query(
                    `SELECT DATE(created_at) as date, SUM(total_amount) as amount FROM bookings WHERE company_id = $1 AND payment_status = 'PAID' ${dateFilter} GROUP BY DATE(created_at) ORDER BY date`,
                    params
                );
                const totalRevenue = await db.query(
                    `SELECT SUM(total_amount) as total FROM bookings WHERE company_id = $1 AND payment_status = 'PAID' ${dateFilter}`,
                    params
                );
                data = { timeline: revenueTimeline.rows, total: totalRevenue.rows[0]?.total || 0 };
                break;

            case 'AMBULANCE_UTILIZATION':
                const utilization = await db.query(
                    `SELECT a.ambulance_number, COUNT(b.id) as total_bookings, 
                    SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings
                    FROM ambulances a
                    LEFT JOIN bookings b ON a.id = b.ambulance_id
                    WHERE a.company_id = $1 ${dateFilter.replace('created_at', 'b.created_at')}
                    GROUP BY a.id`,
                    params
                );
                data = { utilization: utilization.rows };
                break;

            case 'DRIVER_PERFORMANCE':
                const performance = await db.query(
                    `SELECT a.driver_name, COUNT(b.id) as trips, 
                    AVG(f.rating) as avg_rating
                    FROM ambulances a
                    LEFT JOIN bookings b ON a.id = b.ambulance_id
                    LEFT JOIN feedback f ON b.id = f.booking_id
                    WHERE a.company_id = $1 ${dateFilter.replace('created_at', 'b.created_at')}
                    GROUP BY a.id`,
                    params
                );
                data = { performance: performance.rows };
                break;

            case 'FEEDBACK':
                const ratings = await db.query(
                    `SELECT rating, COUNT(*) as count FROM feedback f
                    JOIN bookings b ON f.booking_id = b.id
                    WHERE b.company_id = $1 ${dateFilter.replace('created_at', 'f.created_at')}
                    GROUP BY rating`,
                    params
                );
                const recentFeedback = await db.query(
                    `SELECT f.*, b.patient_name FROM feedback f
                    JOIN bookings b ON f.booking_id = b.id
                    WHERE b.company_id = $1 ${dateFilter.replace('created_at', 'f.created_at')}
                    ORDER BY f.created_at DESC LIMIT 50`,
                    params
                );
                data = { ratings: ratings.rows, list: recentFeedback.rows };
                break;

            case 'RESPONSE_TIME':
                // Simplified response time calculation: difference between creation and acceptance
                // (Note: This assumes we have timestamps for status changes, which we don't explicitly have in the schema 
                // but we can estimate or suggest adding a status_history table in production)
                // For now, we'll return a placeholder or average if created_at and updated_at were present.
                // Since we only have created_at, we'll return a mock trend or empty for now.
                data = { message: "Detailed response time tracking requires status transition logs." };
                break;

            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(data);
    } catch (err) {
        console.error('Report generation error:', err);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};
