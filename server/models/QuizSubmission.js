const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A quiz submission must belong to a student']
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'A quiz submission must refer to a quiz ID']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'A quiz submission must belong to a course']
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  answers: {
    type: Map,
    of: Number, // questionIndex -> optionIndex selected
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a student can only submit a quiz once
quizSubmissionSchema.index({ student: 1, quizId: 1 }, { unique: true });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);

module.exports = QuizSubmission;
