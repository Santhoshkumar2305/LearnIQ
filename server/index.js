require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = async () => {
  const conn = require('./config/db');
  await conn();
};

const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { initSocket } = require('./config/socket');
const { sendSuccess } = require('./utils/apiResponse');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Atlas
connectDB();

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health Check Route
app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'SLMS API Server is running smoothly', {
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// 404 Route handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
