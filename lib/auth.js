import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export function getUserFromRequest(req) {
  const { token } = req.cookies || {};
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function requireAuth(handler, allowedRoles = []) {
  return async (req, res) => {
    const user = getUserFromRequest(req);
    if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    return handler(req, res);
  };
}