import mongoose from 'mongoose';

const UserPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
  notifications: {
    type: Boolean,
    default: true,
  },
  // Developer-specific preferences
  codeSnippets: {
    type: Boolean,
    default: false,
  },
  technicalTerms: {
    type: Boolean,
    default: false,
  },
  // Teacher-specific preferences
  simplifiedExplanations: {
    type: Boolean,
    default: false,
  },
  educationalResources: {
    type: Boolean,
    default: false,
  },
  // General Q&A preferences
  showSources: {
    type: Boolean,
    default: true,
  },
  querySaving: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps on save
UserPreferenceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.UserPreference || mongoose.model('UserPreference', UserPreferenceSchema);