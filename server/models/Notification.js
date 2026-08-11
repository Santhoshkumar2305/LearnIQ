const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A notification must have a recipient']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A notification must have a sender']
  },
  type: {
    type: String,
    enum: ['material_upload', 'quiz_upload', 'assignment_upload', 'student_submission', 'grade_released'],
    required: [true, 'Please specify the notification type']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to quickly fetch unread notifications per user
notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
