const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      default: 'Guest Reader'
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      default: 'Author'
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    category: {
      type: String,
      default: 'Information Technology'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: true
    },
    readTime: {
      type: Number,
      default: 1
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    claps: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
    comments: [commentSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);