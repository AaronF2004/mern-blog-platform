const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6
    },
    bio: {
      type: String,
      default: 'Writer & reader on DevPress.'
    },
    role: {
      type: String,
      enum: ['reader', 'author', 'admin'],
      default: 'author'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);