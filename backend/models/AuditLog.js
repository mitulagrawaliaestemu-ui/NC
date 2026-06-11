import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'OFFER_CREATION',
      'OFFER_RELEASE',
      'OFFER_UNRELEASE',
      'CANDIDATE_APPLICATION',
      'NOMINATION_SELECTION',
      'FINAL_SELECTION'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  details: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AuditLog', AuditLogSchema);
