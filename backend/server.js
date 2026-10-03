const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const postRoutes = require('./routes/postRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS Configuration (Handles Vercel frontend, local dev, and pre-flight requests)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 2. Body Parser Middleware (High payload limit to handle image uploads)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 3. Root Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'DevPress MERN Backend API is running smoothly.',
    timestamp: new Date().toISOString()
  });
});

// 4. API Routes
app.use('/api/posts', postRoutes);

// 5. Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found on this server.` });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 7. MongoDB Atlas Connection & Server Startup
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI is not defined in environment variables!');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas Connected Successfully!');
    app.listen(PORT, () => {
      console.log(`Server actively running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error:', err);
    process.exit(1);
  });