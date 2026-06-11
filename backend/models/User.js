import mongoose from 'mongoose';

const EducationSchema = new mongoose.Schema({
  degree: String,
  school: String,
  startYear: String,
  endYear: String,
  gpa: String
});

const ExperienceSchema = new mongoose.Schema({
  role: String,
  company: String,
  location: String,
  startDate: String,
  endDate: String,
  description: String
});

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  link: String
});

const ResumeSchema = new mongoose.Schema({
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    college: String,
    lc: {
      type: String,
      enum: ['MU', 'MUJ', 'KU', 'JECRC']
    },
    bio: String
  },
  education: [EducationSchema],
  experience: [ExperienceSchema],
  projects: [ProjectSchema],
  skills: [String],
  languages: [String],
  certifications: [String],
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['NC_ADMIN', 'LC_ADMIN', 'MEMBER'],
    required: true
  },
  lc: {
    type: String,
    enum: ['MU', 'MUJ', 'KU', 'JECRC', 'GLOBAL', null],
    default: null
  },
  learnId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values but enforces uniqueness for non-nulls
  },
  yearsLeftForMembership: {
    type: Number,
    default: 0
  },
  isTempPassword: {
    type: Boolean,
    default: false
  },
  tempPassword: {
    type: String,
    default: null
  },
  resume: {
    type: ResumeSchema,
    default: () => ({
      personalInfo: {},
      education: [],
      experience: [],
      projects: [],
      skills: [],
      languages: [],
      certifications: [],
      isCompleted: false
    })
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', UserSchema);
