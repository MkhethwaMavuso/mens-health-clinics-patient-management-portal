import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  const token = req.cookies?.clinic_session;
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email role isActive isTemporaryPassword');
    if (!user || !user.isActive || user.isTemporaryPassword) {
      return res.status(401).json({ message: 'Please activate your account to continue' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Authentication required' });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    return next();
  };
}