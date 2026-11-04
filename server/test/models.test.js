import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

test('User requires credentials and restricts roles', () => {
  const missingFields = new User();
  const missingError = missingFields.validateSync();
  assert.ok(missingError.errors.name);
  assert.ok(missingError.errors.email);
  assert.ok(missingError.errors.password);

  const invalidRole = new User({
    name: 'Clinic User',
    email: 'user@example.com',
    password: 'a-long-enough-password',
    role: 'owner'
  });
  assert.ok(invalidRole.validateSync().errors.role);
  assert.equal(User.schema.path('password').options.select, false);
});

test('Appointment requires a patient and date and restricts status values', () => {
  const missingFields = new Appointment();
  const missingError = missingFields.validateSync();
  assert.ok(missingError.errors.patient);
  assert.ok(missingError.errors.appointmentDate);

  const invalidStatus = new Appointment({
    patient: new mongoose.Types.ObjectId(),
    appointmentDate: new Date(),
    status: 'Cancelled'
  });
  assert.ok(invalidStatus.validateSync().errors.status);

  const appointment = new Appointment({
    patient: new mongoose.Types.ObjectId(),
    appointmentDate: new Date()
  });
  assert.equal(appointment.status, 'Booked');
  assert.deepEqual(Object.keys(appointment.clinicalNotes.toObject()).sort(), [
    'diagnosis', 'medication', 'symptoms', 'treatment'
  ]);
});