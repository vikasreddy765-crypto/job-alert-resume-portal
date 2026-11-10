import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Alert, Application, Job, User } from './models.js';
import { cookieOptions, issueSession, publicUser, requireAdmin, requireAuth } from './auth.js';

const app = express();
const port = Number(process.env.PORT) || 4000;
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many attempts. Please wait a few minutes and try again.' } });
const cleanText = (value, max = 120) => String(value ?? '').trim().slice(0, max);
const safeEmail = (value) => cleanText(value, 254).toLowerCase();
const publicJob = (job) => ({
  id: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  type: job.type,
  category: job.category,
  experience: job.experience,
  salary: job.salary,
  description: job.description,
  skills: job.skills,
  featured: job.featured,
  companyColor: job.companyColor,
  createdAt: job.createdAt,
});
const parseSkills = (value) => Array.isArray(value)
  ? value.map((v) => cleanText(v, 36)).filter(Boolean).slice(0, 20)
  : String(value || '').split(',').map((v) => cleanText(v, 36)).filter(Boolean).slice(0, 20);

const jobSamples = [
  { title: 'Frontend Developer', company: 'Northstar Labs', location: 'Bengaluru, India', type: 'Full-time', category: 'Engineering', experience: 'Entry level', salary: '₹6–9 LPA', description: 'Build intuitive product experiences with a collaborative team. You will work with design and engineering to ship accessible, high quality interfaces, improve page performance, and turn customer feedback into thoughtful features.', skills: ['React', 'JavaScript', 'CSS'], featured: true, companyColor: '#364fc7' },
  { title: 'Product Design Intern', company: 'Morrow Studio', location: 'Remote · India', type: 'Internship', category: 'Design', experience: 'Internship', salary: '₹20–30k / month', description: 'Help shape the next generation of digital products. Partner with designers and researchers on wireframes, prototypes, and real user feedback while building a strong portfolio with a supportive studio.', skills: ['Figma', 'Prototyping', 'Research'], featured: true, companyColor: '#d9485f' },
  { title: 'Junior Data Analyst', company: 'Cedar Finance', location: 'Mumbai, India', type: 'Full-time', category: 'Data & Analytics', experience: 'Entry level', salary: '₹5–7 LPA', description: 'Turn business questions into clear analysis. You will work with product and operations teams to build dashboards, validate data quality, and tell the story behind the numbers.', skills: ['SQL', 'Excel', 'Python'], featured: false, companyColor: '#087f5b' },
  { title: 'Software Engineering Intern', company: 'Orbit Systems', location: 'Hyderabad, India', type: 'Internship', category: 'Engineering', experience: 'Internship', salary: '₹25k / month', description: 'Learn by shipping useful features alongside experienced engineers. This internship offers mentoring, well-scoped projects, and exposure to modern web application development.', skills: ['Node.js', 'APIs', 'Git'], featured: true, companyColor: '#7048e8' },
  { title: 'Marketing Associate', company: 'Goodkind Collective', location: 'Pune, India', type: 'Full-time', category: 'Marketing', experience: '0–2 years', salary: '₹4–6 LPA', description: 'Help a growing team reach its audience through thoughtful campaigns, social content, and clear reporting. You will have room to test ideas and learn across channels.', skills: ['Content', 'Analytics', 'Communication'], featured: false, companyColor: '#e67700' },
  { title: 'Business Operations Intern', company: 'Fieldnote', location: 'Remote · India', type: 'Internship', category: 'Business', experience: 'Internship', salary: '₹18–25k / month', description: 'Support a fast-moving operations team with research, process improvements, and data-backed recommendations. A great first role for a curious problem solver.', skills: ['Research', 'Spreadsheets', 'Writing'], featured: false, companyColor: '#0b7285' },
  { title: 'UI Developer', company: 'Brightpath Health', location: 'Chennai, India', type: 'Full-time', category: 'Engineering', experience: '0–2 years', salary: '₹5–8 LPA', description: 'Create clean and accessible interfaces for products that make everyday healthcare easier. Work closely with engineers and product partners in a kind, feedback-rich environment.', skills: ['HTML', 'React', 'Accessibility'], featured: false, companyColor: '#c2255c' },
  { title: 'Community & Events Intern', company: 'Common Ground', location: 'Delhi, India', type: 'Part-time', category: 'People & Community', experience: 'Internship', salary: '₹15–20k / month', description: 'Help bring a student community together through engaging events and useful resources. You will own projects from the first idea to the post-event recap.', skills: ['Events', 'Communication', 'Social media'], featured: false, companyColor: '#5c940d' },
];

app.get('/api/health', (_req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const name = cleanText(req.body?.name, 80);
  const email = safeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  if (name.length < 2) return res.status(400).json({ message: 'Enter your full name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 100) return res.status(400).json({ message: 'Use a password with at least 8 characters.' });
  try {
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    issueSession(user, res);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    throw error;
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const email = safeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  issueSession(user, res);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('pathway_session', cookieOptions(0));
  res.json({ ok: true });
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

app.get('/api/jobs', async (req, res) => {
  const q = cleanText(req.query.q, 100);
  const location = cleanText(req.query.location, 100);
  const category = cleanText(req.query.category, 60);
  const type = cleanText(req.query.type, 40);
  const clauses = [];
  if (q) clauses.push({ $or: ['title', 'company', 'location', 'description', 'skills'].map((key) => ({ [key]: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })) });
  if (location) clauses.push({ location: { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
  if (category) clauses.push({ category: { $regex: category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
  if (type) clauses.push({ type });
  const filter = clauses.length ? { $and: clauses } : {};
  const jobs = await Job.find(filter).sort({ featured: -1, createdAt: -1 }).limit(100).lean();
  res.json({ jobs: jobs.map((job) => ({ ...job, id: String(job._id) })) });
});

app.get('/api/jobs/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This job could not be found.' });
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'This job could not be found.' });
  res.json({ job: publicJob(job) });
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  const name = cleanText(req.body?.name, 80);
  if (name.length < 2) return res.status(400).json({ message: 'Enter your full name.' });
  req.user.name = name;
  req.user.headline = cleanText(req.body?.headline, 120);
  req.user.location = cleanText(req.body?.location, 100);
  req.user.about = cleanText(req.body?.about, 1000);
  req.user.skills = parseSkills(req.body?.skills);
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
app.post('/api/profile/resume', requireAuth, (req, res, next) => upload.single('resume')(req, res, (error) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Your resume must be 5 MB or smaller.' });
  if (error) return res.status(400).json({ message: 'The resume could not be uploaded. Please try again.' });
  next();
}), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose a resume file to upload.' });
  if (!allowedTypes.has(req.file.mimetype)) return res.status(400).json({ message: 'Upload a PDF, DOC, or DOCX resume.' });
  const signature = req.file.buffer.subarray(0, 4).toString('hex');
  const looksLikePdf = req.file.mimetype === 'application/pdf' && signature.startsWith('25504446');
  const looksLikeDocx = req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && req.file.buffer.includes(Buffer.from('word/'));
  const looksLikeDoc = req.file.mimetype === 'application/msword' && signature === 'd0cf11e0';
  if (!(looksLikePdf || looksLikeDocx || looksLikeDoc)) return res.status(400).json({ message: 'The selected file does not appear to be a valid PDF or Word document.' });
  req.user.resume = { name: path.basename(req.file.originalname).replace(/[\r\n"\\]/g, '_').slice(0, 150), contentType: req.file.mimetype, data: req.file.buffer, uploadedAt: new Date() };
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

app.get('/api/profile/resume', requireAuth, (req, res) => {
  if (!req.user.resume?.data) return res.status(404).json({ message: 'No resume has been uploaded yet.' });
  res.setHeader('Content-Type', req.user.resume.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${req.user.resume.name.replace(/["\\\r\n]/g, '_')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(req.user.resume.data);
});
app.delete('/api/profile/resume', requireAuth, async (req, res) => {
  req.user.resume = undefined;
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

app.get('/api/saved/jobs', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).populate({ path: 'savedJobs', options: { sort: { createdAt: -1 } } });
  res.json({ jobs: user.savedJobs.map(publicJob) });
});
app.put('/api/saved/jobs/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This job could not be found.' });
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'This job could not be found.' });
  const alreadySaved = req.user.savedJobs.some((id) => String(id) === req.params.id);
  if (alreadySaved) req.user.savedJobs.pull(req.params.id);
  else req.user.savedJobs.addToSet(req.params.id);
  await req.user.save();
  res.json({ saved: !alreadySaved, user: publicUser(req.user) });
});

app.post('/api/jobs/:id/apply', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This job could not be found.' });
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: 'This job could not be found.' });
  if (!req.user.resume?.data) return res.status(400).json({ message: 'Upload a resume to your profile before applying.' });
  try {
    const application = await Application.create({ user: req.user.id, job: job.id, coverLetter: cleanText(req.body?.coverLetter, 2000), resumeName: req.user.resume.name, resume: { name: req.user.resume.name, contentType: req.user.resume.contentType, data: Buffer.from(req.user.resume.data) } });
    res.status(201).json({ application: { id: application.id, status: application.status, createdAt: application.createdAt } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'You have already applied to this role.' });
    throw error;
  }
});
app.get('/api/applications/mine', requireAuth, async (req, res) => {
  const applications = await Application.find({ user: req.user.id }).populate('job').sort({ createdAt: -1 });
  res.json({ applications: applications.filter((item) => item.job).map((item) => ({ id: item.id, status: item.status, createdAt: item.createdAt, job: publicJob(item.job) })) });
});

app.get('/api/alerts', requireAuth, async (req, res) => {
  const alerts = await Alert.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ alerts });
});
app.post('/api/alerts', requireAuth, async (req, res) => {
  const title = cleanText(req.body?.title, 100);
  if (title.length < 2) return res.status(400).json({ message: 'Give this alert a name.' });
  const alert = await Alert.create({ user: req.user.id, title, keywords: cleanText(req.body?.keywords, 120), location: cleanText(req.body?.location, 100), category: cleanText(req.body?.category, 60) });
  res.status(201).json({ alert });
});
app.delete('/api/alerts/:id', requireAuth, async (req, res) => {
  const deleted = await Alert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!deleted) return res.status(404).json({ message: 'This alert could not be found.' });
  res.json({ ok: true });
});
app.get('/api/alerts/matches', requireAuth, async (req, res) => {
  const alerts = await Alert.find({ user: req.user.id });
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(100).lean();
  const matches = alerts.map((alert) => {
    const keywords = alert.keywords.toLowerCase().split(/[ ,]+/).filter(Boolean);
    const items = jobs.filter((job) => {
      const text = `${job.title} ${job.company} ${job.description} ${(job.skills || []).join(' ')}`.toLowerCase();
      const fitsKeywords = keywords.length === 0 || keywords.some((word) => text.includes(word));
      const fitsLocation = !alert.location || job.location.toLowerCase().includes(alert.location.toLowerCase());
      const fitsCategory = !alert.category || job.category.toLowerCase().includes(alert.category.toLowerCase());
      return fitsKeywords && fitsLocation && fitsCategory;
    }).slice(0, 8).map((job) => ({ ...job, id: String(job._id) }));
    return { id: alert.id, title: alert.title, matches: items };
  });
  res.json({ matches });
});

const adminOnly = [requireAuth, requireAdmin];
app.get('/api/admin/overview', ...adminOnly, async (_req, res) => {
  const [jobs, students, applications, alerts] = await Promise.all([
    Job.countDocuments(), User.countDocuments({ role: 'student' }), Application.countDocuments(), Alert.countDocuments(),
  ]);
  const recentApplications = await Application.find().populate('user', 'name email').populate('job', 'title company').sort({ createdAt: -1 }).limit(8).lean();
  res.json({ stats: { jobs, students, applications, alerts }, applications: recentApplications.map((item) => ({ id: String(item._id), user: item.user, job: item.job, status: item.status, resumeName: item.resumeName || item.resume?.name || '', createdAt: item.createdAt })) });
});
app.get('/api/admin/applications/:id/resume', ...adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This application could not be found.' });
  const application = await Application.findById(req.params.id).select('resume').lean();
  if (!application?.resume?.data) return res.status(404).json({ message: 'This application has no saved resume.' });
  const fileName = path.basename(application.resume.name || 'resume').replace(/[\r\n"\\]/g, '_');
  res.setHeader('Content-Type', application.resume.contentType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.send(application.resume.data);
});
app.patch('/api/admin/applications/:id', ...adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This application could not be found.' });
  const status = cleanText(req.body?.status, 30);
  if (!['Submitted', 'In review', 'Interview', 'Declined'].includes(status)) return res.status(400).json({ message: 'Choose a valid application status.' });
  const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
  if (!application) return res.status(404).json({ message: 'This application could not be found.' });
  res.json({ id: application.id, status: application.status });
});
app.get('/api/admin/jobs', ...adminOnly, async (_req, res) => {
  const jobs = await Job.find().sort({ createdAt: -1 }).limit(200);
  res.json({ jobs: jobs.map(publicJob) });
});
app.post('/api/admin/jobs', ...adminOnly, async (req, res) => {
  const data = normalizeJob(req.body);
  if (!data.title || !data.company || !data.location || !data.description) return res.status(400).json({ message: 'Title, company, location, and description are required.' });
  const job = await Job.create(data);
  res.status(201).json({ job: publicJob(job) });
});
app.patch('/api/admin/jobs/:id', ...adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This job could not be found.' });
  const job = await Job.findByIdAndUpdate(req.params.id, normalizeJob(req.body), { new: true, runValidators: true });
  if (!job) return res.status(404).json({ message: 'This job could not be found.' });
  res.json({ job: publicJob(job) });
});
app.delete('/api/admin/jobs/:id', ...adminOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'This job could not be found.' });
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) return res.status(404).json({ message: 'This job could not be found.' });
  await Promise.all([Application.deleteMany({ job: job.id }), User.updateMany({}, { $pull: { savedJobs: job.id } })]);
  res.json({ ok: true });
});
function normalizeJob(body = {}) {
  const types = ['Full-time', 'Part-time', 'Internship', 'Contract'];
  const type = types.includes(body.type) ? body.type : 'Full-time';
  const color = /^#[0-9a-fA-F]{6}$/.test(body.companyColor) ? body.companyColor : '#2854dc';
  return {
    title: cleanText(body.title, 120), company: cleanText(body.company, 100), location: cleanText(body.location, 100),
    type, category: cleanText(body.category, 60) || 'Technology', experience: cleanText(body.experience, 60) || 'Entry level',
    salary: cleanText(body.salary, 60) || 'Competitive', description: cleanText(body.description, 6000),
    skills: parseSkills(body.skills), featured: Boolean(body.featured), companyColor: color,
  };
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

async function seedDatabase() {
  if (await Job.estimatedDocumentCount() === 0) await Job.insertMany(jobSamples);
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = safeEmail(process.env.ADMIN_EMAIL);
    const exists = await User.findOne({ email });
    if (!exists) {
      await User.create({ name: 'Portal Administrator', email, role: 'admin', passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) });
      console.log(`Created admin account: ${email}`);
    }
  }
}

async function start() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required. Add it to your environment before starting the portal.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) throw new Error('JWT_SECRET must contain at least 24 characters.');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  await seedDatabase();
  app.listen(port, '0.0.0.0', () => console.log(`Pathway is listening on port ${port}`));
}

start().catch((error) => { console.error('Startup failed:', error.message); process.exit(1); });
