const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    author: {
      type: String,
      default: 'Editorial Staff',
      trim: true
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    excerpt: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    readTime: {
      type: String,
      default: '1 min read'
    }
  },
  { timestamps: true }
);

// Synchronous pre-save hook (NO next parameter)
postSchema.pre('save', function () {
  if (this.isModified('title') || !this.slug) {
    const cleanTitle = (this.title || 'untitled')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    this.slug = `${cleanTitle || 'post'}-${Date.now()}`;
  }

  if (this.isModified('content') && this.content) {
    const words = this.content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    this.readTime = `${minutes} min read`;

    if (!this.excerpt) {
      this.excerpt =
        this.content.slice(0, 160) + (this.content.length > 160 ? '...' : '');
    }
  }
});

module.exports = mongoose.model('Post', postSchema);