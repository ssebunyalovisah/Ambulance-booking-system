// server/src/controllers/report_controller.js
const { Booking, Company, Driver, Ambulance, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getReportsData = async (req, res) => {
  const { company_id, role } = req.user;
  const { reportType, startDate, endDate } = req.query;

  try {
    const where = {};
    if (role !== 'super_admin') {
      where.company_id = company_id;
    }

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    let data = {};

    switch (reportType) {
      case 'BOOKING_SUMMARY': {
        const stats = await Booking.findAll({
          where,
          attributes: [
            'status', 
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('price')), 'total_price']
          ],
          group: ['status'],
        });
        data.stats = stats.map(entry => ({
          status: entry.status,
          count: Number(entry.get('count') || 0),
          total_price: Number(entry.get('total_price') || 0),
        }));

        const timelineRows = await Booking.findAll({
          where,
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        });
        data.timeline = timelineRows.map(entry => ({
          date: entry.get('date'),
          count: Number(entry.get('count') || 0),
        }));
        break;
      }

      case 'REVENUE': {
        const totalRevenue = await Booking.sum('price', {
          where: { ...where, payment_status: 'paid' },
        });
        data.total = Number(totalRevenue || 0);

        const timelineRows = await Booking.findAll({
          where: { ...where, payment_status: 'paid' },
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('SUM', sequelize.col('price')), 'amount'],
          ],
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        });
        data.timeline = timelineRows.map(entry => ({
          date: entry.get('date'),
          amount: Number(entry.get('amount') || 0),
        }));
        break;
      }

      case 'AMBULANCE_UTILIZATION': {
        const utilizationRows = await Ambulance.findAll({
          where: role !== 'super_admin' ? { company_id } : {},
          attributes: [
            'ambulance_number',
            [sequelize.fn('COUNT', sequelize.col('Bookings.id')), 'total_bookings'],
            [sequelize.fn('SUM', sequelize.col('Bookings.price')), 'total_revenue'],
          ],
          include: [{
            model: Booking,
            attributes: [],
            where: startDate && endDate ? {
                created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] }
            } : {},
            required: false,
          }],
          group: ['Ambulance.id', 'Ambulance.ambulance_number'],
        });
        data.utilization = utilizationRows.map(entry => ({
          ambulance_number: entry.ambulance_number,
          total_bookings: Number(entry.get('total_bookings') || 0),
          total_revenue: Number(entry.get('total_revenue') || 0),
        }));
        break;
      }

      case 'DRIVER_PERFORMANCE': {
        const performanceRows = await Driver.findAll({
          where: role !== 'super_admin' ? { company_id } : {},
          attributes: [
            ['full_name', 'driver_name'],
            [sequelize.fn('COUNT', sequelize.col('Bookings.id')), 'trips'],
            [sequelize.fn('AVG', sequelize.col('Bookings.rating')), 'avg_rating'],
            [sequelize.fn('SUM', sequelize.col('Bookings.price')), 'total_revenue'],
          ],
          include: [{
            model: Booking,
            attributes: [],
            where: startDate && endDate ? {
                created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] }
            } : {},
            required: false,
          }],
          group: ['Driver.id', 'Driver.full_name'],
        });
        data.performance = performanceRows.map(entry => ({
          driver_name: entry.get('driver_name'),
          trips: Number(entry.get('trips') || 0),
          avg_rating: Number(entry.get('avg_rating') || 0).toFixed(1),
          total_revenue: Number(entry.get('total_revenue') || 0),
        }));
        break;
      }

      case 'FEEDBACK': {
        const feedbackRows = await Booking.findAll({
          where: { ...where, rating: { [Op.ne]: null } },
          attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          group: ['rating'],
        });
        data.feedback = feedbackRows.map(entry => ({
          rating: entry.rating,
          count: Number(entry.get('count') || 0),
        }));

        const list = await Booking.findAll({
          where: { ...where, feedback: { [Op.ne]: null } },
          attributes: ['patient_name', 'rating', 'feedback', 'created_at'],
          limit: 50,
          order: [['created_at', 'DESC']],
        });
        data.list = list.map(entry => entry.toJSON());
        break;
      }

      case 'RESPONSE_TIME': {
        const responseRows = await Booking.findAll({
          where: { ...where, status: { [Op.in]: ['arrived', 'completed'] } },
          attributes: ['created_at', 'updated_at'],
        });

        const responseTimes = responseRows.map(entry => {
          const createdAt = new Date(entry.created_at);
          const updatedAt = new Date(entry.updated_at);
          return Math.max(0, Math.round((updatedAt - createdAt) / 60000));
        });

        const buckets = [
          { range: '0-10 min', count: 0 },
          { range: '11-20 min', count: 0 },
          { range: '21-30 min', count: 0 },
          { range: '31-60 min', count: 0 },
          { range: '60+ min', count: 0 },
        ];

        responseTimes.forEach(minutes => {
          if (minutes <= 10) buckets[0].count += 1;
          else if (minutes <= 20) buckets[1].count += 1;
          else if (minutes <= 30) buckets[2].count += 1;
          else if (minutes <= 60) buckets[3].count += 1;
          else buckets[4].count += 1;
        });

        const groupedByDate = responseRows.reduce((acc, entry, index) => {
          const date = new Date(entry.created_at).toISOString().split('T')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push(responseTimes[index]);
          return acc;
        }, {});

        data.response_times = buckets;
        data.timeline = Object.entries(groupedByDate)
          .map(([date, values]) => ({
            date,
            average_minutes: Math.round(values.reduce((sum, val) => sum + val, 0) / values.length),
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        data.total = responseTimes.length;
        break;
      }

      case 'DETAILED_BOOKINGS': {
        const bookings = await Booking.findAll({
          where,
          include: [
            { model: Driver, attributes: ['full_name', 'driver_id', 'phone'] },
            { model: Company, attributes: ['name'] },
            { model: Ambulance, attributes: ['ambulance_number'] }
          ],
          order: [['created_at', 'DESC']]
        });
        
        data.bookings = bookings.map(b => b.toJSON());
        
        // Also include summary stats for charts
        const stats = await Booking.findAll({
          where,
          attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          group: ['status'],
        });
        data.stats = stats.map(entry => ({
          status: entry.status,
          count: Number(entry.get('count') || 0),
        }));

        const timelineRows = await Booking.findAll({
          where,
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        });
        data.timeline = timelineRows.map(entry => ({
          date: entry.get('date'),
          count: Number(entry.get('count') || 0),
        }));
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json(data);
  } catch (err) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};
