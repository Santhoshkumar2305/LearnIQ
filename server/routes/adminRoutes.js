const express = require('express');
const {
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getAllUsers,
  deleteUser
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Guard all admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/pending-teachers', getPendingTeachers);
router.put('/approve-teacher/:id', approveTeacher);
router.delete('/reject-teacher/:id', rejectTeacher);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
