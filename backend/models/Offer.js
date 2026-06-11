import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  offerCode: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String
  },
  country: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  payment: {
    type: String
  },
  workType: {
    type: String,
    required: true
  },
  lcScope: {
    type: String,
    enum: ['GLOBAL', 'SPECIFIC'],
    required: true
  },
  targetLc: {
    type: String,
    enum: ['MU', 'MUJ', 'KU', 'JECRC', null],
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  releasedLcs: {
    type: [String],
    default: []
  },
  deadline: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['DRAFT', 'RELEASED', 'CLOSED'],
    default: 'DRAFT'
  },
  finalSelectedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Offer', OfferSchema);
