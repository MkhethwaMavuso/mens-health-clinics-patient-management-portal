import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { sendBookingConfirmation } from '../utils/email.js';

function validFutureDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

export async function listAppointments(req, res, next) {
  try {
    const filter = req.user.role === 'patient'
      ? { patient: req.user.id }
      : req.user.role === 'doctor'
        ? { doctor: req.user.id }
        : {};
    const query = Appointment.find(filter);
    if (req.user.role === 'admin') query.select('-clinicalNotes');
    const appointments = await query
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ appointmentDate: -1 });
    return res.json({ appointments });
  } catch (error) {
    return next(error);
  }
}

export async function bookAppointment(req, res, next) {
  try {
    const { appointmentDate } = req.body;
    if (!validFutureDate(appointmentDate)) {
      return res.status(400).json({ message: 'Choose a valid future appointment date and time' });
    }
    const appointment = await Appointment.create({ patient: req.user.id, appointmentDate });
    await appointment.populate('patient', 'name email');
    try {
      await sendBookingConfirmation(appointment.patient, appointment);
    } catch (error) {
      console.error('Appointment confirmation email failed:', error.message);
    }
    return res.status(201).json({ appointment });
  } catch (error) {
    return next(error);
  }
}

export async function markArrived(req, res, next) {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'Booked') {
      return res.status(409).json({ message: 'Only booked appointments can be marked arrived' });
    }
    appointment.status = 'Arrived';
    await appointment.save();
    await appointment.populate(['patient', 'doctor']);
    return res.json({ appointment });
  } catch (error) {
    return next(error);
  }
}

export async function assignDoctor(req, res, next) {
  try {
    const { doctorId } = req.body;
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isTemporaryPassword: false });
    if (!doctor) return res.status(400).json({ message: 'Choose a valid doctor' });
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status === 'Complete') {
      return res.status(409).json({ message: 'Completed appointments cannot be reassigned' });
    }
    appointment.doctor = doctor.id;
    await appointment.save();
    await appointment.populate(['patient', 'doctor']);
    return res.json({ appointment });
  } catch (error) {
    return next(error);
  }
}

export async function completeAppointment(req, res, next) {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user.id });
    if (!appointment) return res.status(404).json({ message: 'Assigned appointment not found' });
    if (appointment.status !== 'Arrived') {
      return res.status(409).json({ message: 'Only arrived appointments can be completed' });
    }
    const fields = ['symptoms', 'diagnosis', 'treatment', 'medication'];
    for (const field of fields) {
      if (typeof req.body.clinicalNotes?.[field] !== 'string') {
        return res.status(400).json({ message: `Clinical note field "${field}" is required` });
      }
    }
    appointment.clinicalNotes = Object.fromEntries(fields.map((field) => [field, req.body.clinicalNotes[field]]));
    appointment.status = 'Complete';
    await appointment.save();
    await appointment.populate(['patient', 'doctor']);
    return res.json({ appointment });
  } catch (error) {
    return next(error);
  }
}