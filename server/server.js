require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const { redirectUrl } = require('./controllers/urlController');

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // In production, replace with specific origins
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Redirect short code route (e.g. http://localhost:5000/r/abc123)
app.get('/r/:shortCode', redirectUrl);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Root Healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LinkNest URL Shortener API' });
});

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Global Error Handler
app.use(errorHandler);

// Database Connection and Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linknest';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
