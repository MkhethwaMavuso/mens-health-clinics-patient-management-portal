import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: sessionDurationMs,
    path: '/'
  };
}

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('clinic_session', token, cookieOptions());
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 12 and 128 characters' });
    }
    const user = await User.create({ name, email, password, role: 'patient' });
    setSessionCookie(res, user);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(String(password || '')))) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    if (user.isTemporaryPassword) {
      return res.status(403).json({ message: 'Use your account setup link to activate your account' });
    }
    setSessionCookie(res, user);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie('clinic_session', { ...cookieOptions(), maxAge: undefined });
  return res.json({ message: 'Signed out' });
}

export function currentUser(req, res) {
  return res.json({ user: req.user });
}

export async function activateAccount(req, res, next) {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return res.status(400).json({ message: 'A valid setup link and a 12-128 character password are required' });
    }
    const user = await User.findOne({
      passwordSetupTokenHash: hashToken(token),
      passwordSetupExpiresAt: { $gt: new Date() },
      isTemporaryPassword: true
    }).select('+passwordSetupTokenHash +passwordSetupExpiresAt +password');
    if (!user) return res.status(400).json({ message: 'This setup link is invalid or expired' });

    user.password = password;
    user.isTemporaryPassword = false;
    user.passwordSetupTokenHash = undefined;
    user.passwordSetupExpiresAt = undefined;
    await user.save();
    setSessionCookie(res, user);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

export function createSetupToken() {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
}