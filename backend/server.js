const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const postRoutes = require('./routes/postRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. Strict Limiter for Login/Register routes (Max 15 attempts every 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 2. General Limiter for API endpoints (Max 300 requests every 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' }
});

// Apply rate limiters
app.use('/api/posts/auth', authLimiter);
app.use('/api', generalLimiter);

// Routes
app.use('/api/posts', postRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('DevPress Backend API is running smoothly.');
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas Connected Successfully!');
    app.listen(PORT, () => {
      console.log(`Server actively running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
  });