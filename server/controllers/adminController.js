const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get all teachers awaiting registration approval
 */
const getPendingTeachers = async (req, res, next) => {
  try {
    const pendingTeachers = await User.find({
      role: 'teacher',
      isApproved: false
    }).sort({ createdAt: -1 });

    return sendSuccess(res, 'Pending teachers list retrieved successfully', {
      teachers: pendingTeachers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a pending teacher registration
 */
const approveTeacher = async (req, res, next) => {
  const { id } = req.params;

  try {
    const teacher = await User.findById(id);

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    if (teacher.role !== 'teacher') {
      return sendError(res, 'Target user is not a teacher account', 400);
    }

    teacher.isApproved = true;
    await teacher.save();

    return sendSuccess(res, `Teacher "${teacher.name}" approved successfully`, {
      teacher
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject/Delete a teacher account registration
 */
const rejectTeacher = async (req, res, next) => {
  const { id } = req.params;

  try {
    const teacher = await User.findById(id);

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    if (teacher.role !== 'teacher') {
      return sendError(res, 'Target user is not a teacher account', 400);
    }

    await User.findByIdAndDelete(id);

    return sendSuccess(res, `Teacher registration for "${teacher.name}" has been rejected and account deleted`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users registered in the system
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    return sendSuccess(res, 'All users list retrieved successfully', { users });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user from the system
 */
const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'You cannot delete your own administrator account', 400);
    }

    await User.findByIdAndDelete(id);

    return sendSuccess(res, `User "${user.name}" has been deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getAllUsers,
  deleteUser
};
