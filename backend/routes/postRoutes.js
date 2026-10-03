const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devpress_super_secret_jwt_key_2026';

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields (Name, Email, Password) are required.' });
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
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
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

// Login
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
      { id: user._id, name: user.name, email: user.email },
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
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post('/', async (req, res) => {
  try {
    const { title, author, authorId, category, imageUrl, content, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const newPost = new Post({
      title: title.trim(),
      author: author ? author.trim() : 'Anonymous',
      authorId: authorId || null,
      category: category ? category.trim() : 'Information Technology',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      content: content.trim(),
      status: status === 'draft' ? 'draft' : 'published',
      likes: 0,
      claps: 0
    });

    const savedPost = await newPost.save();
    return res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(400).json({ error: err.message });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requesterId = req.body.requesterId;
    const requesterRole = req.body.requesterRole;

    if (post.authorId && post.authorId.toString() !== requesterId && requesterRole !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this article.' });
    }

    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const requesterId = req.query.requesterId;
    const requesterRole = req.query.requesterRole;

    if (post.authorId && post.authorId.toString() !== requesterId && requesterRole !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this article.' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like / Unlike Toggle Handler
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

// Add comment or reply
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
    res.status(201).json(post.comments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cascade Delete Comment (Deletes comment & all attached replies)
router.delete('/:postId/comments/:commentId', async (req, res) => {
  const { postId, commentId } = req.params;
  const { requesterId, requesterName, requesterRole } = req.query;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const targetComment = post.comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const isOwner =
      requesterRole === 'admin' ||
      (post.authorId && post.authorId.toString() === requesterId) ||
      (targetComment.authorId && targetComment.authorId.toString() === requesterId) ||
      (targetComment.author && targetComment.author.trim().toLowerCase() === requesterName?.trim().toLowerCase());

    if (!isOwner) {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }

    // Recursively gather IDs of target comment and any child replies
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