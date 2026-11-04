import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    index: true
  },
  password: { type: String, required: true, minlength: 12, select: false },
  role: { type: String, enum: ['patient', 'admin', 'doctor'], default: 'patient', required: true },
  isActive: { type: Boolean, default: true },
  isTemporaryPassword: { type: Boolean, default: false },
  passwordSetupTokenHash: { type: String, select: false },
  passwordSetupExpiresAt: { type: Date, select: false }
}, { timestamps: true });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', {
  transform(_document, returned) {
    delete returned.password;
    delete returned.passwordSetupTokenHash;
    delete returned.passwordSetupExpiresAt;
    delete returned.__v;
    return returned;
  }
});

export default mongoose.model('User', userSchema);