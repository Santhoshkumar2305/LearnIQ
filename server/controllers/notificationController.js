const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendRealTimeNotification } = require('../config/socket');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const emailUtils = require('../utils/email');

/**
 * Fetch all notifications for the logged-in user
 * GET /api/notifications
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 for efficiency

    return sendSuccess(res, 'Notifications retrieved successfully', notifications);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a specific notification as read
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found or unauthorized', 404);
    }

    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all user notifications as read
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res, 'All notifications marked as read successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Helper utility to save notification, push via WebSockets, and send Gmail notifications.
 * Can be imported anywhere in controllers.
 */
exports.createAndSendNotification = async (recipientId, senderId, type, message, emailPayload = {}) => {
  try {
    // 1. Create database record
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message
    });

    // 2. Fetch populated sender details to emit with WebSocket
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name avatar role');

    // 3. Emit real-time update
    sendRealTimeNotification(recipientId, populatedNotification);

    // 4. Send Gmail Notification
    const recipient = await User.findById(recipientId);
    if (recipient && recipient.email) {
      const sender = await User.findById(senderId);
      const senderName = sender ? sender.name : 'Smart LMS User';

      const { courseTitle, itemTitle, grade, maxPoints } = emailPayload;

      if (type === 'material_upload') {
        await emailUtils.sendNewMaterialEmail(recipient.email, recipient.name, courseTitle || 'Course', itemTitle || 'Materials');
      } else if (type === 'quiz_upload') {
        await emailUtils.sendNewQuizEmail(recipient.email, recipient.name, courseTitle || 'Course', itemTitle || 'Quiz');
      } else if (type === 'assignment_upload') {
        await emailUtils.sendNewAssignmentEmail(recipient.email, recipient.name, courseTitle || 'Course', itemTitle || 'Assignment');
      } else if (type === 'student_submission') {
        await emailUtils.sendNewSubmissionEmail(recipient.email, recipient.name, senderName, itemTitle || 'Assignment');
      } else if (type === 'grade_released') {
        await emailUtils.sendGradeReleasedEmail(recipient.email, recipient.name, courseTitle || 'Course', itemTitle || 'Assignment', grade || 0, maxPoints || 100);
      }
    }

    return notification;
  } catch (err) {
    console.error('Error triggering notification lifecycle:', err);
  }
};
