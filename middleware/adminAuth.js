import jwt from 'jsonwebtoken';
import { getAdminTokenFromRequest } from '../config/adminSessionCookie.js';

export function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Admin auth is not configured.' });
  }
  const token = getAdminTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, secret);
    req.adminEmail = typeof payload.sub === 'string' ? payload.sub : null;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}
