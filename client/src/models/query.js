import mongoose from 'mongoose';

const QuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    default: '',
  },
  context: {
    type: String,
    default: '',
  },
  sources: [{
    title: String,
    url: String,
    snippet: String,
    relevanceScore: Number,
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
    },
  },
});

// Index for faster queries
QuerySchema.index({ userId: 1, timestamp: -1 });
QuerySchema.index({ question: 'text' });

export default mongoose.models.Query || mongoose.model('Query', QuerySchema);