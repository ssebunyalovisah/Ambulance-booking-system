// server/src/controllers/feedback_controller.js
const { Feedback, Booking, Driver, Ambulance } = require('../models');

exports.submitFeedback = async (req, res) => {
  const { booking_id, rating, comments } = req.body;

  if (!booking_id || !rating) {
    return res.status(400).json({ error: 'booking_id and rating are required' });
  }

  try {
    const booking = await Booking.findByPk(booking_id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const feedback = await Feedback.create({
      booking_id,
      rating,
      comments,
    });

    // Sync rating to booking
    await booking.update({ rating });

    res.status(201).json(feedback);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Feedback already submitted for this booking' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllFeedback = async (req, res) => {
  const { company_id } = req.user;
  try {
    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: Booking,
          where: { company_id },
          attributes: ['patient_name'],
          include: [
            { model: Driver, attributes: ['full_name'] },
            { model: Ambulance, attributes: ['ambulance_number'] },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
