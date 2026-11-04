import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(MONGO_URI);
    if (await User.exists({ role: 'admin' })) {
      throw new Error('An administrator already exists; use the authenticated admin-management API.');
    }
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.info(`Created initial administrator ${admin.email}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}