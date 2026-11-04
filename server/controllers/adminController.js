import { randomBytes } from 'node:crypto';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { createSetupToken } from './authController.js';
import { sendWalkInActivation } from '../utils/email.js';

export async function listPatients(_req, res, next) {
  try {
    const patients = await User.find({ role: 'patient', isActive: true }).select('name email createdAt').sort({ name: 1 });
    return res.json({ patients });
  } catch (error) {
    return next(error);
  }
}

export async function updatePatient(req, res, next) {
  try {
    const { name, email } = req.body;
    const patient = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'patient' },
      { name, email },
      { new: true, runValidators: true }
    ).select('name email createdAt');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    return res.json({ patient });
  } catch (error) {
    return next(error);
  }
}

export async function deletePatient(req, res, next) {
  try {
    const patient = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'patient', isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    return res.json({ message: 'Patient account deactivated; appointment history retained' });
  } catch (error) {
    return next(error);
  }
}

export async function registerWalkIn(req, res, next) {
  try {
    const { name, email, appointmentDate, doctorId } = req.body;
    const date = new Date(appointmentDate);
    if (!name || !email || Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Name, email, and a valid appointment time are required' });
    }
    let doctor;
    if (doctorId) {
      doctor = await User.findOne({ _id: doctorId, role: 'doctor', isTemporaryPassword: false });
      if (!doctor) return res.status(400).json({ message: 'Choose a valid doctor' });
    }

    const setup = createSetupToken();
    const patient = await User.create({
      name,
      email,
      password: randomBytes(32).toString('hex'),
      role: 'patient',
      isTemporaryPassword: true,
      passwordSetupTokenHash: setup.tokenHash,
      passwordSetupExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    let appointment;
    try {
      appointment = await Appointment.create({
        patient: patient.id,
        doctor: doctor?.id || null,
        appointmentDate: date,
        status: 'Arrived'
      });
    } catch (error) {
      await patient.deleteOne();
      throw error;
    }
    await appointment.populate(['patient', 'doctor']);
    try {
      await sendWalkInActivation(patient, appointment, setup.token);
    } catch (error) {
      console.error('Walk-in account email failed:', error.message);
    }
    return res.status(201).json({ patient: { id: patient.id, name: patient.name, email: patient.email }, appointment });
  } catch (error) {
    return next(error);
  }
}

export async function listDoctors(_req, res, next) {
  try {
    const doctors = await User.find({ role: 'doctor', isTemporaryPassword: false }).select('name email').sort({ name: 1 });
    return res.json({ doctors });
  } catch (error) {
    return next(error);
  }
}

export async function createDoctor(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 12 and 128 characters' });
    }
    const doctor = await User.create({ name, email, password, role: 'doctor' });
    return res.status(201).json({ doctor: { id: doctor.id, name: doctor.name, email: doctor.email } });
  } catch (error) {
    return next(error);
  }
}

export async function listAdmins(_req, res, next) {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email createdAt').sort({ name: 1 });
    return res.json({ admins });
  } catch (error) {
    return next(error);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 12 and 128 characters' });
    }
    const admin = await User.create({ name, email, password, role: 'admin' });
    return res.status(201).json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    return next(error);
  }
}

export async function updateAdmin(req, res, next) {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Administrator not found' });
    if (typeof req.body.name === 'string') admin.name = req.body.name;
    if (typeof req.body.email === 'string') admin.email = req.body.email;
    if (req.body.password !== undefined) {
      if (typeof req.body.password !== 'string' || req.body.password.length < 12 || req.body.password.length > 128) {
        return res.status(400).json({ message: 'Password must be between 12 and 128 characters' });
      }
      admin.password = req.body.password;
    }
    await admin.save();
    return res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot remove your own administrator account' });
    }
    const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Administrator not found' });
    return res.json({ message: 'Administrator removed' });
  } catch (error) {
    return next(error);
  }
}