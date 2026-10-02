const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET all posts with pagination, category filter, and search
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 9 } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const totalPosts = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limitNum) || 1,
      currentPage: pageNum
    });
  } catch (err) {
    console.error('Error in GET /api/posts:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single post by slug OR ObjectId
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const post = isObjectId
      ? await Post.findById(identifier)
      : await Post.findOne({ slug: identifier });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error('Error in GET /api/posts/:identifier:', err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE a new post
router.post('/', async (req, res) => {
  try {
    const { title, author, category, imageUrl, content } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const newPost = new Post({
      title: title.trim(),
      author: author && author.trim() ? author.trim() : 'Editorial Staff',
      category: category && category.trim() ? category.trim() : 'General',
      imageUrl: imageUrl || '',
      content: content.trim()
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Mongoose POST Save Error:', err);
    res.status(400).json({ error: err.message || 'Validation error while saving post.' });
  }
});

// UPDATE a post
router.put('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.author !== undefined) post.author = req.body.author;
    if (req.body.category !== undefined) post.category = req.body.category;
    if (req.body.imageUrl !== undefined) post.imageUrl = req.body.imageUrl;
    if (req.body.content !== undefined) post.content = req.body.content;

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    console.error('Error in PUT /api/posts/:id:', err);
    res.status(400).json({ error: err.message || 'Error updating post.' });
  }
});

// DELETE a post
router.delete('/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /api/posts/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;