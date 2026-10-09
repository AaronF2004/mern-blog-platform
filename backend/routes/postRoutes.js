const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const upload = require('../config/cloudinary');

const JWT_SECRET = process.env.JWT_SECRET || 'devpress_super_secret_jwt_key_2026';
const ADMIN_SECRET = (process.env.ADMIN_SECRET || 'DEVPRESS_ADMIN_2026').trim().toLowerCase();

// ==========================================
// 1. AUTHORIZATION MIDDLEWARE
// ==========================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// ==========================================
// 2. RESILIENT CLOUDINARY UPLOAD ENDPOINT
// ==========================================
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Cloudinary/Multer Upload Error:', err);
      return res.status(500).json({
        error: err.message || 'Cloudinary upload rejected.'
      });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'No image file was received.' });
    }

    return res.json({ imageUrl: req.file.path });
  });
});

// ==========================================
// 3. AUTHENTICATION & ADMIN GATEWAY
// ==========================================
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'author'
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'No account registered with this email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role || 'author' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role || 'author'
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

router.post('/auth/claim-admin', verifyToken, async (req, res) => {
  try {
    const { adminSecret } = req.body;
    if (!adminSecret || adminSecret.trim().toLowerCase() !== ADMIN_SECRET) {
      return res.status(400).json({ message: 'Incorrect Admin Secret Key.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { role: 'admin' },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    const newToken = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Account successfully upgraded to Admin!',
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('Claim Admin Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. POSTS CRUD & ATOMIC VIEW PERSISTENCE
// ==========================================

// GET all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    const sanitizedPosts = posts.map((p) => ({
      ...p,
      views: Number(p.views) >= 0 ? Number(p.views) : 0
    }));
    return res.json(sanitizedPosts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Atomic increment for views
const handleViewIncrement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true, runValidators: false, upsert: false }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json({ views: Number(updated.views), postId: updated._id });
  } catch (err) {
    console.error('View increment error:', err);
    return res.status(500).json({ error: err.message });
  }
};

router.patch('/:id/view', handleViewIncrement);
router.put('/:id/view', handleViewIncrement);
router.post('/:id/view', handleViewIncrement);

// Reassign legacy anonymous posts
router.patch('/claim-all-anonymous', verifyToken, async (req, res) => {
  try {
    const authorName = req.user.name || 'Author';
    const authorId = req.user.id;

    await Post.updateMany(
      { $or: [{ author: 'Anonymous' }, { author: null }, { author: '' }] },
      { $set: { author: authorName, authorId: authorId } }
    );

    const updatedPosts = await Post.find().sort({ createdAt: -1 }).lean();
    return res.json(updatedPosts);
  } catch (err) {
    console.error('Claim anonymous error:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

    const post = isObjectId
      ? await Post.findById(identifier).lean()
      : await Post.findOne({ slug: identifier }).lean();

    if (!post) return res.status(404).json({ message: 'Article not found.' });
    return res.json({ ...post, views: Number(post.views) >= 0 ? Number(post.views) : 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create Post
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, category, imageUrl, content, status, author } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const resolvedAuthor = (author && author.trim() && author !== 'Anonymous')
      ? author.trim()
      : (req.user?.name || 'Author');

    const newPost = new Post({
      title: title.trim(),
      author: resolvedAuthor,
      authorId: req.user.id,
      category: category ? category.trim() : 'Information Technology',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      content: content.trim(),
      status: status === 'draft' ? 'draft' : 'published',
      likes: 0,
      claps: 0,
      views: 0
    });

    const savedPost = await newPost.save();
    return res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(400).json({ error: err.message });
  }
});

// Update Post (STRICTLY AUTHOR ONLY - Admins and other users CANNOT edit)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isAuthor = post.authorId && post.authorId.toString() === req.user.id;
    const isLegacyNameMatch =
      !post.authorId && post.author && req.user.name &&
      post.author.toLowerCase().trim() === req.user.name.toLowerCase().trim();
    const isLegacyAnonymous = !post.authorId || post.author === 'Anonymous';

    // Only the author who created it can edit
    if (!isAuthor && !isLegacyNameMatch && !isLegacyAnonymous) {
      return res.status(403).json({ error: 'Forbidden: Only the author who created this article can edit it.' });
    }

    const updateData = { ...req.body };
    updateData.author = (req.body.author && req.body.author !== 'Anonymous')
      ? req.body.author
      : (req.user.name || post.author);

    if (!post.authorId || post.author === 'Anonymous') {
      updateData.authorId = req.user.id;
    }

    const updated = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Delete Post (Author OR Platform Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isAuthor = post.authorId && post.authorId.toString() === req.user.id;
    const isLegacyNameMatch =
      !post.authorId && post.author && req.user.name &&
      post.author.toLowerCase().trim() === req.user.name.toLowerCase().trim();
    const isAdmin = req.user.role === 'admin';
    const isLegacyAnonymous = !post.authorId || post.author === 'Anonymous';

    if (!isAuthor && !isLegacyNameMatch && !isAdmin && !isLegacyAnonymous) {
      return res.status(403).json({ error: 'Forbidden: Only the author or an admin can delete this article.' });
    }

    await Post.findByIdAndDelete(req.params.id);
    return res.json({ message: `Post deleted successfully by ${isAdmin ? 'Admin' : 'Author'}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ATOMIC LIKE/UNLIKE
// ==========================================
const handleLikeToggle = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const delta = typeof req.body.delta === 'number' ? req.body.delta : 1;
    const currentLikes = typeof post.likes === 'number' ? post.likes : (post.claps || 0);
    const newCount = Math.max(0, currentLikes + delta);

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: newCount, claps: newCount } },
      { new: true }
    );

    return res.json({ likes: updated.likes, claps: updated.claps });
  } catch (err) {
    console.error('Like Route Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

router.patch('/:id/like', handleLikeToggle);
router.patch('/:id/clap', handleLikeToggle);

// ==========================================
// 6. COMMENTS & CASCADING REPLIES
// ==========================================
router.post('/:id/comments', async (req, res) => {
  const { author, authorId, content, parentId } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Article not found.' });

    post.comments.push({
      author: author || 'Guest Reader',
      authorId: authorId || null,
      content,
      parentId: parentId || null
    });

    await post.save();
    return res.status(201).json(post.comments);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/:postId/comments/:commentId', verifyToken, async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const targetComment = post.comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const isCommentAuthor = targetComment.authorId && targetComment.authorId.toString() === req.user.id;
    const isPostAuthor = post.authorId && post.authorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
    }

    const idsToDelete = new Set([commentId.toString()]);
    let added = true;
    while (added) {
      added = false;
      post.comments.forEach((c) => {
        if (c.parentId && idsToDelete.has(c.parentId.toString()) && !idsToDelete.has(c._id.toString())) {
          idsToDelete.add(c._id.toString());
          added = true;
        }
      });
    }

    post.comments = post.comments.filter((c) => !idsToDelete.has(c._id.toString()));
    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;