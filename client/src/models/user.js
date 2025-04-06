// src/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Make name required
    },
    email: {
      type: String,
      required: true, // Make email required
      unique: true,   // Ensure email uniqueness
    },
    image: String,
    emailVerified: Date,
    role: {
      type: String,
      default: "user",  // Add default role
      enum: ["user", "admin", "moderator"]  // Optional: restrict to valid roles
    },
    preferences: {
      theme: {
        type: String,
        default: "consumer", // 'consumer' or 'developer' or 'assistant'
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      showSources: {
        type: Boolean,
        default: true,
      },
      codeSnippets: {
        type: Boolean,
        default: false,
      },
      technicalTerms: {
        type: Boolean,
        default: false,
      },
      historyRetention: {
        type: Number, 
        default: 30,  // Days to retain history
      }
    },
    metadata: {
      lastLogin: Date,
      loginCount: {
        type: Number,
        default: 0,
      },
      queryCount: {
        type: Number,
        default: 0,
      },
      lastQueryTimestamp: Date,  // Add timestamp of last query
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Method to increment query count
userSchema.methods.incrementQueryCount = async function() {
  this.metadata.queryCount += 1;
  this.metadata.lastQueryTimestamp = new Date();
  return this.save();
};

// Static method to find users with recent activity
userSchema.statics.findActiveUsers = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    'metadata.lastQueryTimestamp': { $gte: cutoffDate }
  }).sort({ 'metadata.queryCount': -1 });
};

// Check if model is already defined to prevent overwriting during hot reloads
export const User = mongoose.models.User || mongoose.model("User", userSchema);