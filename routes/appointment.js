const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const parseDate = (dateStr) => {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

router.post('/book', async (req, res) => {
  try {
    const { patient, doctor, date } = req.body;

    if (!isValidObjectId(patient)) {
      return res.status(400).json({ error: 'Invalid patient ID' });
    }
    if (!isValidObjectId(doctor)) {
      return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      return res.status(400).json({ error: 'Invalid date format. Use ISO format like YYYY-MM-DDTHH:mm' });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      date: parsedDate,
      status: 'booked',
    });

    res.status(201).json(appointment);
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});


router.post('/cancel/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});


router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient doctor');
    res.json(appointments);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;
