const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// All submission routes require student authentication
router.use(protect);

// Submit homework (only students)
router.post('/submit/:courseId/:assignmentId', restrictTo('student'), upload.single('file'), submissionController.submitAssignment);

// Get course submissions for student
router.get('/course/:courseId', restrictTo('student'), submissionController.getCourseSubmissions);

// Get student's own submissions
router.get('/my', restrictTo('student'), submissionController.getMySubmissions);

// Teacher-specific submission routes
router.get('/assignment/:assignmentId', restrictTo('teacher'), submissionController.getAssignmentSubmissions);
router.post('/:submissionId/ai-review', restrictTo('teacher'), submissionController.triggerAIReview);
router.put('/:submissionId/grade', restrictTo('teacher'), submissionController.gradeSubmission);

// Get single submission details (accessible by student or teacher)
router.get('/:submissionId', submissionController.getSubmissionDetails);

module.exports = router;
