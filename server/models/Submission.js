const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A submission must belong to a student']
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'A submission must refer to an assignment ID']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'A submission must belong to a course']
  },
  submissionFile: {
    type: String,
    required: [true, 'Please provide the submission file URL']
  },
  fileName: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'graded'],
    default: 'pending'
  },
  grade: {
    type: Number,
    min: [0, 'Grade cannot be less than 0']
  },
  feedback: {
    type: String,
    trim: true
  },
  aiReview: {
    summary: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    originalityScore: { type: Number },
    suggestions: { type: String, default: '' }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
