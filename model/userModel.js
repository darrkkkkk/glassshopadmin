const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Define the user schema
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Only require password if not a Google user
      },
    },
    avatar: {
      type: String,
      required: false,
    },
    googleId: {
      type: String, // Store the Google ID for users who log in via Google
    },
    role:{
        type: String,
        required: false,
        enum: ['admin', 'user'],
    },
    permission:{
        type: [String],
        required: false,
    },
    status: {
      type: String,
      required: false,
      enum: ['banned','active'],
    },
    cart: {
        type: Object,
        required: false,
    },
    avatar:{
      type: String,
      required: false,
    }
  },
  {
    timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model('User', userSchema);