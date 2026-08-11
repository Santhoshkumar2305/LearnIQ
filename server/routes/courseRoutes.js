const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// All course routes require authentication
router.use(protect);

// Student-specific course routes (must be defined before /:id)
router.post('/join', restrictTo('student'), courseController.joinCourse);
router.get('/student', restrictTo('student'), courseController.getStudentCourses);

// Teacher-only route to list courses (must be defined before /:id)
router.get('/teacher', restrictTo('teacher'), courseController.getTeacherCourses);

// Get single course details (accessible by teachers, students, and admins, with controller validation)
router.get('/:id', courseController.getCourseDetails);

// Teacher-only routes for course and curriculum management
router.post('/', restrictTo('teacher'), courseController.createCourse);
router.delete('/:id', restrictTo('teacher'), courseController.deleteCourse);

// Curriculum Materials CRUD
router.post('/:id/materials', restrictTo('teacher'), upload.single('file'), courseController.addMaterial);
router.delete('/:id/materials/:materialId', restrictTo('teacher'), courseController.deleteMaterial);
router.post('/:id/materials/:materialId/notes', courseController.generateAINotes);

// Assignments CRUD
router.post('/:id/assignments', restrictTo('teacher'), courseController.createAssignment);
router.put('/:id/assignments/:assignmentId', restrictTo('teacher'), courseController.updateAssignment);
router.delete('/:id/assignments/:assignmentId', restrictTo('teacher'), courseController.deleteAssignment);

// Quizzes CRUD
router.post('/:id/quizzes', restrictTo('teacher'), courseController.createQuiz);
router.put('/:id/quizzes/:quizId', restrictTo('teacher'), courseController.updateQuiz);
router.delete('/:id/quizzes/:quizId', restrictTo('teacher'), courseController.deleteQuiz);

// Quiz Student Submissions
router.post('/:id/quizzes/:quizId/submit', restrictTo('student'), courseController.submitQuiz);
router.get('/:id/quizzes/submissions', restrictTo('student'), courseController.getQuizSubmissions);

// Quiz Teacher Submissions View
router.get('/:id/quizzes/:quizId/submissions', restrictTo('teacher'), courseController.getTeacherQuizSubmissions);

module.exports = router;
