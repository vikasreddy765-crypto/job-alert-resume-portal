import jwt from 'jsonwebtoken';
import { User } from './models.js';

export const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge,
  path: '/',
});

export const issueSession = (user, res) => {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('pathway_session', token, cookieOptions(7 * 24 * 60 * 60 * 1000));
};

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.pathway_session;
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    req.user = user;
    next();
  } catch {
    res.clearCookie('pathway_session', cookieOptions(0));
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access is required.' });
  next();
};

export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  headline: user.headline,
  location: user.location,
  skills: user.skills,
  about: user.about,
  resume: user.resume?.name ? { name: user.resume.name, uploadedAt: user.resume.uploadedAt } : null,
  savedJobs: (user.savedJobs || []).map((job) => String(job?._id || job)),
});
