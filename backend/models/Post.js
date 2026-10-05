const mongoose = require('mongoose');
const crypto = require('crypto');

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true, index: true },
    imageUrl: { type: String, default: '' },
    content: { type: String, required: true },
    readTime: { type: Number, default: 1 },
    likes: { type: Number, default: 0 },
    claps: { type: Number, default: 0 },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    comments: [commentSchema]
  },
  { timestamps: true }
);

// Auto-generate unique clean slug and calculate read time before saving
postSchema.pre('validate', function () {
  if (this.isModified('title') || !this.slug) {
    const cleanTitle = (this.title || 'article')
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
    const randomHex = crypto.randomBytes(3).toString('hex');
    this.slug = `${cleanTitle}-${randomHex}`;
  }
});

postSchema.pre('save', function () {
  if (this.isModified('content') && this.content) {
    const plainText = this.content.replace(/<[^>]*>/g, '').trim();
    const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    this.readTime = Math.max(1, Math.ceil(words / 200));
  }
});

module.exports = mongoose.model('Post', postSchema);