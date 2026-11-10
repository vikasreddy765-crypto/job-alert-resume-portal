import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  headline: { type: String, default: '', maxlength: 120 },
  location: { type: String, default: '', maxlength: 100 },
  skills: { type: [String], default: [] },
  about: { type: String, default: '', maxlength: 1000 },
  resume: { name: String, contentType: String, data: Buffer, uploadedAt: Date },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  company: { type: String, required: true, trim: true, maxlength: 100 },
  location: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], default: 'Full-time' },
  category: { type: String, default: 'Technology', maxlength: 60 },
  experience: { type: String, default: 'Entry level', maxlength: 60 },
  salary: { type: String, default: 'Competitive', maxlength: 60 },
  description: { type: String, required: true, maxlength: 6000 },
  skills: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  companyColor: { type: String, default: '#2854dc' },
}, { timestamps: true });
jobSchema.index({ title: 'text', company: 'text', location: 'text', category: 'text', description: 'text' });

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  keywords: { type: String, default: '', maxlength: 120 },
  location: { type: String, default: '', maxlength: 100 },
  category: { type: String, default: '', maxlength: 60 },
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  coverLetter: { type: String, default: '', maxlength: 2000 },
  resumeName: { type: String, default: '' },
  resume: { name: String, contentType: String, data: Buffer },
  status: { type: String, enum: ['Submitted', 'In review', 'Interview', 'Declined'], default: 'Submitted' },
}, { timestamps: true });
applicationSchema.index({ user: 1, job: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
export const Job = mongoose.model('Job', jobSchema);
export const Alert = mongoose.model('Alert', alertSchema);
export const Application = mongoose.model('Application', applicationSchema);
