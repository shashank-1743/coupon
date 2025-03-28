const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const couponRoutes = require('../../routes/couponRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected in production'))
  .catch(err => console.error('MongoDB connection error:', err));

// Debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Cache control and content type
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store');
  res.header('Content-Type', 'application/json');
  next();
});

// Routes
app.use('/.netlify/functions/api', couponRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server'
  });
});

module.exports.handler = serverless(app);