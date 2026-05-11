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
      case 'BOOKING_SUMMARY':
        data.stats = await Booking.findAll({
          where,
          attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          group: ['status'],
        });
        
        data.timeline = await Booking.findAll({
          where,
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        });
        break;

      case 'REVENUE':
        data.total = await Booking.sum('price', {
          where: { ...where, payment_status: 'paid' },
        }) || 0;

        data.timeline = await Booking.findAll({
          where: { ...where, payment_status: 'paid' },
          attributes: [
            [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
            [sequelize.fn('SUM', sequelize.col('price')), 'amount'],
          ],
          group: [sequelize.fn('DATE', sequelize.col('created_at'))],
          order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
        });
        break;

      case 'AMBULANCE_UTILIZATION':
        data.utilization = await Ambulance.findAll({
          where: role !== 'super_admin' ? { company_id } : {},
          attributes: [
            'ambulance_number',
            [sequelize.fn('COUNT', sequelize.col('Bookings.id')), 'total_bookings'],
          ],
          include: [{
            model: Booking,
            attributes: [],
            where: startDate && endDate ? {
                created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] }
            } : {},
            required: false
          }],
          group: ['Ambulance.id', 'Ambulance.ambulance_number'],
        });
        break;

      case 'DRIVER_PERFORMANCE':
        data.performance = await Driver.findAll({
          where: role !== 'super_admin' ? { company_id } : {},
          attributes: [
            'full_name',
            [sequelize.fn('COUNT', sequelize.col('Bookings.id')), 'trips'],
            [sequelize.fn('AVG', sequelize.col('Bookings.rating')), 'avg_rating'],
          ],
          include: [{
            model: Booking,
            attributes: [],
            where: startDate && endDate ? {
                created_at: { [Op.between]: [new Date(startDate), new Date(endDate)] }
            } : {},
            required: false
          }],
          group: ['Driver.id', 'Driver.full_name'],
        });
        break;

      case 'FEEDBACK':
        data.ratings = await Booking.findAll({
          where: { ...where, rating: { [Op.ne]: null } },
          attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
          group: ['rating'],
        });

        data.list = await Booking.findAll({
          where: { ...where, feedback: { [Op.ne]: null } },
          attributes: ['patient_name', 'rating', 'feedback', 'created_at'],
          limit: 50,
          order: [['created_at', 'DESC']],
        });
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
