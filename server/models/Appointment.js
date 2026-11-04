import mongoose from 'mongoose';

const clinicalNotesSchema = new mongoose.Schema({
  symptoms: { type: String, trim: true, maxlength: 5000, default: '' },
  diagnosis: { type: String, trim: true, maxlength: 5000, default: '' },
  treatment: { type: String, trim: true, maxlength: 5000, default: '' },
  medication: { type: String, trim: true, maxlength: 5000, default: '' }
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  status: { type: String, enum: ['Booked', 'Arrived', 'Complete'], default: 'Booked', index: true },
  appointmentDate: { type: Date, required: true, index: true },
  clinicalNotes: { type: clinicalNotesSchema, default: () => ({}) }
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });

export default mongoose.model('Appointment', appointmentSchema);