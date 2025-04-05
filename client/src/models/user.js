// src/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    image: String,
    emailVerified: Date,
    role: String,
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
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Check if model is already defined to prevent overwriting during hot reloads
export const User = mongoose.models.User || mongoose.model("User", userSchema);
