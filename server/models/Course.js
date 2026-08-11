const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a material title'],
    trim: true
  },
  type: {
    type: String,
    enum: ['video', 'pdf'],
    required: [true, 'Please specify the material type (video or pdf)']
  },
  url: {
    type: String,
    required: [true, 'Please provide a material URL']
  },
  publicId: {
    type: String,
    required: [true, 'Please provide a Cloudinary public ID']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const quizQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Please provide the question text']
  },
  options: {
    type: [String],
    required: [true, 'Please provide options for the question'],
    validate: {
      validator: function(v) {
        return v && v.length >= 2;
      },
      message: 'A question must have at least two options'
    }
  },
  correctAnswerIndex: {
    type: Number,
    required: [true, 'Please specify the correct answer index'],
    min: [0, 'Correct answer index cannot be less than 0']
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    trim: true
  },
  questions: {
    type: [quizQuestionSchema],
    required: [true, 'Please provide questions for the quiz']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an assignment title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide an assignment description']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  fileUrl: {
    type: String
  },
  maxPoints: {
    type: Number,
    required: [true, 'Please provide maximum points for this assignment'],
    min: [1, 'Maximum points must be at least 1']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A course must belong to a teacher']
  },
  inviteCode: {
    type: String,
    required: [true, 'Please provide an invite code'],
    unique: true,
    trim: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  materials: [materialSchema],
  quizzes: [quizSchema],
  assignments: [assignmentSchema]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
