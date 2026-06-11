import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeSnapshot: {
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      college: String,
      lc: String,
      bio: String
    },
    education: [{
      degree: String,
      school: String,
      startYear: String,
      endYear: String,
      gpa: String
    }],
    experience: [{
      role: String,
      company: String,
      location: String,
      startDate: String,
      endDate: String,
      description: String
    }],
    projects: [{
      title: String,
      description: String,
      link: String
    }],
    skills: [String],
    languages: [String],
    certifications: [String]
  },
  status: {
    type: String,
    enum: ['APPLIED', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'NOMINATED', 'SELECTED', 'NOT_SELECTED'],
    default: 'APPLIED'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a member can only apply to a specific offer once
ApplicationSchema.index({ offerId: 1, memberId: 1 }, { unique: true });

export default mongoose.model('Application', ApplicationSchema);
