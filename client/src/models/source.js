import mongoose from 'mongoose';

const SourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['document', 'website', 'api', 'database', 'other'],
    default: 'document',
  },
  url: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastIndexed: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'indexed', 'failed', 'outdated'],
    default: 'pending',
  },
});

// Text index for search
SourceSchema.index({ title: 'text', description: 'text', content: 'text' });

// Update timestamps on save
SourceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Source || mongoose.model('Source', SourceSchema);