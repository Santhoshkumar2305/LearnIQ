const express = require('express');
const router = express.Router();
const { getStudentAnalytics, getTeacherAnalytics, getAdminAnalytics } = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// All analytics routes require authentication
router.use(protect);

router.get('/student', restrictTo('student'), getStudentAnalytics);
router.get('/teacher', restrictTo('teacher'), getTeacherAnalytics);
router.get('/admin', restrictTo('admin'), getAdminAnalytics);

module.exports = router;
