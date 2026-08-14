const Course = require('../models/Course');
const Submission = require('../models/Submission');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { cloudinary } = require('../config/cloudinary');
const pdfParse = require('pdf-parse');
const { Groq } = require('groq-sdk');
const QuizSubmission = require('../models/QuizSubmission');
const { createAndSendNotification } = require('./notificationController');

/**
 * Helper to extract text from a PDF url, supporting standard and TS class-based pdf-parse packages
 */
const extractTextFromPdf = async (pdfUrl) => {
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  if (pdfParse && typeof pdfParse.PDFParse === 'function') {
    const parser = new pdfParse.PDFParse(uint8Array);
    const textObj = await parser.getText();
    const text = textObj.text || '';
    parser.destroy();
    return text;
  } else if (typeof pdfParse === 'function') {
    const pdfData = await pdfParse(Buffer.from(arrayBuffer));
    return pdfData.text || '';
  } else {
    throw new Error('Unsupported pdf-parse package shape');
  }
};

/**
 * Generates a unique 6-character alphanumeric invite code
 */
const generateUniqueInviteCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let inviteCode = '';
  let exists = true;

  while (exists) {
    inviteCode = '';
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existingCourse = await Course.findOne({ inviteCode });
    if (!existingCourse) {
      exists = false;
    }
  }
  return inviteCode;
};

/**
 * Create a new course
 * POST /api/courses
 */
exports.createCourse = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return sendError(res, 'Please provide both title and description', 400);
    }

    const inviteCode = await generateUniqueInviteCode();

    const newCourse = await Course.create({
      title,
      description,
      teacher: req.user.id,
      inviteCode,
      students: [],
      materials: [],
      quizzes: [],
      assignments: []
    });

    return sendSuccess(res, 'Course created successfully', newCourse, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all courses created by the current teacher
 * GET /api/courses/teacher
 */
exports.getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user.id })
      .populate('students', 'name email avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Teacher courses retrieved successfully', courses);
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed view of a single course
 * GET /api/courses/:id
 */
exports.getCourseDetails = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar');

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Verify permission: Must be the teacher, an enrolled student, or an admin
    const isTeacher = course.teacher._id.toString() === req.user.id;
    const isStudent = course.students.some(student => student._id.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isTeacher && !isStudent && !isAdmin) {
      return sendError(res, 'You do not have access to this course', 403);
    }

    return sendSuccess(res, 'Course details retrieved successfully', course);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course
 * DELETE /api/courses/:id
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Check ownership
    if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to delete this course', 403);
    }

    await Course.findByIdAndDelete(courseId);

    return sendSuccess(res, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add educational material to a course (via Cloudinary upload)
 * POST /api/courses/:id/materials
 */
exports.addMaterial = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Owner check
    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to edit this course curriculum', 403);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    const { title } = req.body;
    if (!title) {
      return sendError(res, 'Please provide a title for the material', 400);
    }

    // Detect material type
    let fileType = 'pdf';
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext) || (req.file.mimetype && req.file.mimetype.startsWith('video'))) {
      fileType = 'video';
    }

    const materialData = {
      title,
      type: fileType,
      url: req.file.path || req.file.secure_url,
      publicId: req.file.filename || req.file.public_id
    };

    course.materials.push(materialData);
    await course.save();

    // Send notifications to all students in the background
    if (course.students && course.students.length > 0) {
      course.students.forEach(studentId => {
        createAndSendNotification(
          studentId,
          req.user.id,
          'material_upload',
          `New study material "${title}" has been uploaded to "${course.title}".`,
          { courseTitle: course.title, itemTitle: title }
        );
      });
    }

    return sendSuccess(res, 'Material uploaded and added successfully', course.materials[course.materials.length - 1]);
  } catch (error) {
    next(error);
  }
};

/**
 * Create an assignment for the course
 * POST /api/courses/:id/assignments
 */
exports.createAssignment = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Owner check
    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to create assignments for this course', 403);
    }

    const { title, description, dueDate, fileUrl, maxPoints } = req.body;

    if (!title || !description || !dueDate || !maxPoints) {
      return sendError(res, 'Please fill in all required fields (title, description, due date, max points)', 400);
    }

    const assignmentData = {
      title,
      description,
      dueDate: new Date(dueDate),
      fileUrl,
      maxPoints: Number(maxPoints)
    };

    course.assignments.push(assignmentData);
    await course.save();

    // Send notifications to all students in the background
    if (course.students && course.students.length > 0) {
      course.students.forEach(studentId => {
        createAndSendNotification(
          studentId,
          req.user.id,
          'assignment_upload',
          `New assignment "${title}" has been posted in "${course.title}".`,
          { courseTitle: course.title, itemTitle: title }
        );
      });
    }

    return sendSuccess(res, 'Assignment created successfully', course.assignments[course.assignments.length - 1]);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a quiz for the course
 * POST /api/courses/:id/quizzes
 */
exports.createQuiz = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Owner check
    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to create quizzes for this course', 403);
    }

    const { title, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return sendError(res, 'Please provide a quiz title and at least one question', 400);
    }

    // Validate questions formatting
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.options || !Array.isArray(q.options) || q.options.length < 2 || q.correctAnswerIndex === undefined) {
        return sendError(res, `Question at index ${i} is invalid. Make sure it has question text, at least two options, and a correct answer index.`, 400);
      }
    }

    const quizData = {
      title,
      questions
    };

    course.quizzes.push(quizData);
    await course.save();

    // Send notifications to all students in the background
    if (course.students && course.students.length > 0) {
      course.students.forEach(studentId => {
        createAndSendNotification(
          studentId,
          req.user.id,
          'quiz_upload',
          `New quiz "${title}" has been released in "${course.title}".`,
          { courseTitle: course.title, itemTitle: title }
        );
      });
    }

    return sendSuccess(res, 'Quiz created successfully', course.quizzes[course.quizzes.length - 1]);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course material (and remove from Cloudinary)
 * DELETE /api/courses/:id/materials/:materialId
 */
exports.deleteMaterial = async (req, res, next) => {
  try {
    const { id, materialId } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to delete materials from this course', 403);
    }

    const material = course.materials.id(materialId);
    if (!material) {
      return sendError(res, 'Material not found', 404);
    }

    // Attempt to delete from Cloudinary
    try {
      let resourceType = 'raw';
      if (material.type === 'video') {
        resourceType = 'video';
      } else if (material.type === 'pdf') {
        resourceType = 'image'; // since we upload PDFs under the 'image' type
      }

      await cloudinary.uploader.destroy(material.publicId, { resource_type: resourceType });
    } catch (cloudinaryErr) {
      console.error('Cloudinary destroy error:', cloudinaryErr);
      // Log and continue to delete from DB even if Cloudinary fails (e.g. file already deleted or wrong credentials)
    }

    // Pull from subdocument array
    course.materials.pull(materialId);
    await course.save();

    return sendSuccess(res, 'Material deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update course assignment details
 * PUT /api/courses/:id/assignments/:assignmentId
 */
exports.updateAssignment = async (req, res, next) => {
  try {
    const { id, assignmentId } = req.params;
    const { title, description, dueDate, fileUrl, maxPoints } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to update assignments', 403);
    }

    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (fileUrl !== undefined) assignment.fileUrl = fileUrl;
    if (maxPoints !== undefined) assignment.maxPoints = Number(maxPoints);

    await course.save();

    return sendSuccess(res, 'Assignment updated successfully', assignment);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course assignment
 * DELETE /api/courses/:id/assignments/:assignmentId
 */
exports.deleteAssignment = async (req, res, next) => {
  try {
    const { id, assignmentId } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to delete assignments', 403);
    }

    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return sendError(res, 'Assignment not found', 404);
    }

    // Find all student submissions for this assignment to delete files from Cloudinary
    const submissions = await Submission.find({ assignmentId });
    
    const getPublicIdFromUrl = (url) => {
      try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        let path = parts[1];
        if (path.startsWith('v')) {
          const slashIndex = path.indexOf('/');
          if (slashIndex !== -1) {
            path = path.substring(slashIndex + 1);
          }
        }
        const dotIndex = path.lastIndexOf('.');
        if (dotIndex !== -1) {
          path = path.substring(0, dotIndex);
        }
        return path;
      } catch (err) {
        console.error('Error parsing Cloudinary URL:', err);
        return null;
      }
    };

    for (const sub of submissions) {
      if (sub.submissionFile) {
        try {
          const ext = sub.submissionFile.split('.').pop().toLowerCase();
          const resourceType = ext === 'pdf' ? 'image' : 'raw';
          const publicId = getPublicIdFromUrl(sub.submissionFile);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          }
        } catch (cloudErr) {
          console.error('Failed to delete student submission file from Cloudinary:', cloudErr);
        }
      }
    }

    // Delete submission documents from MongoDB
    await Submission.deleteMany({ assignmentId });

    course.assignments.pull(assignmentId);
    await course.save();

    return sendSuccess(res, 'Assignment and associated student submissions deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update course quiz details
 * PUT /api/courses/:id/quizzes/:quizId
 */
exports.updateQuiz = async (req, res, next) => {
  try {
    const { id, quizId } = req.params;
    const { title, questions } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to update quizzes', 403);
    }

    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return sendError(res, 'Quiz not found', 404);
    }

    if (title) quiz.title = title;
    if (questions && Array.isArray(questions)) {
      // Validate questions formatting
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText || !q.options || !Array.isArray(q.options) || q.options.length < 2 || q.correctAnswerIndex === undefined) {
          return sendError(res, `Question at index ${i} is invalid. Make sure it has question text, at least two options, and a correct answer index.`, 400);
        }
      }
      quiz.questions = questions;
    }

    await course.save();

    return sendSuccess(res, 'Quiz updated successfully', quiz);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course quiz
 * DELETE /api/courses/:id/quizzes/:quizId
 */
exports.deleteQuiz = async (req, res, next) => {
  try {
    const { id, quizId } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to delete quizzes', 403);
    }

    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return sendError(res, 'Quiz not found', 404);
    }

    course.quizzes.pull(quizId);
    await course.save();

    return sendSuccess(res, 'Quiz deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Join a course using an invite code
 * POST /api/courses/join
 */
exports.joinCourse = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return sendError(res, 'Please provide an invite code', 400);
    }

    const course = await Course.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!course) {
      return sendError(res, 'Invalid invite code. No course found.', 404);
    }

    // Check if already enrolled
    const isEnrolled = course.students.some(sId => sId.toString() === req.user.id);
    if (isEnrolled) {
      return sendError(res, 'You are already enrolled in this course', 400);
    }

    course.students.push(req.user.id);
    await course.save();

    return sendSuccess(res, 'Enrolled in course successfully', course);
  } catch (error) {
    next(error);
  }
};

/**
 * Get enrolled courses for current student
 * GET /api/courses/student
 */
exports.getStudentCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ students: req.user.id })
      .populate('teacher', 'name email avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Enrolled courses retrieved successfully', courses);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate AI study notes from course material using Groq
 * POST /api/courses/:id/materials/:materialId/notes
 */
exports.generateAINotes = async (req, res, next) => {
  try {
    const { id: courseId, materialId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Access check: must be student, teacher, or admin
    const isTeacher = course.teacher.toString() === req.user.id;
    const isStudent = course.students.some(sId => sId.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isTeacher && !isStudent && !isAdmin) {
      return sendError(res, 'You do not have access to this course', 403);
    }

    const material = course.materials.id(materialId);
    if (!material) {
      return sendError(res, 'Material not found', 404);
    }

    if (!process.env.GROQ_API_KEY) {
      return sendError(res, 'Groq API Key is not configured on the server', 500);
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    let notes = '';

    if (material.type === 'pdf') {
      try {
        let extractedText = await extractTextFromPdf(material.url);

        // Clean text and limit size to ~12000 chars to fit prompt limits comfortably
        extractedText = extractedText.trim().replace(/\s+/g, ' ');
        if (extractedText.length > 12000) {
          extractedText = extractedText.slice(0, 12000) + '... [TRUNCATED]';
        }

        if (!extractedText || extractedText.length < 20) {
          extractedText = `No readable text found in PDF. Material title is: ${material.title}`;
        }

        // Run Groq LLM notes generation
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a brilliant academic study assistant. Your task is to output highly detailed, beautifully formatted study notes in Markdown.'
            },
            {
              role: 'user',
              content: `Generate highly structured, clear, and comprehensive study notes from the following text extracted from the course lecture document "${material.title}".

Your notes should include:
- A brief high-level overview.
- Key concepts and their detailed explanations/definitions.
- Bullet points summarizing main takeaways.
- Code blocks or examples if the text mentions programming.
- A concise summary at the end.

Extracted lecture text:
"""
${extractedText}
"""`
            }
          ],
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          temperature: 0.3
        });

        notes = completion.choices[0]?.message?.content || 'Failed to generate notes.';

      } catch (err) {
        console.error('PDF Notes generation error:', err);
        // Fallback if parsing fails
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: `Generate a detailed study outline and notes summary for the topic: "${material.title}" in the course: "${course.title}". Explain key subtopics and concepts related to this topic in beautiful Markdown.`
            }
          ],
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
          temperature: 0.3
        });
        notes = `*Note: PDF text parsing was bypassed, generating general topic study guide.*\n\n` + (completion.choices[0]?.message?.content || '');
      }
    } else {
      // Fallback for videos/other files
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Generate a detailed study outline and notes summary for the video lecture topic: "${material.title}" in the course: "${course.title}". Explain key subtopics and concepts related to this topic in beautiful Markdown.`
          }
        ],
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        temperature: 0.3
      });
      notes = completion.choices[0]?.message?.content || 'Failed to generate outline.';
    }

    return sendSuccess(res, 'AI study notes generated successfully', { notes });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz answers and store student score securely (once only)
 * POST /api/courses/:id/quizzes/:quizId/submit
 */
exports.submitQuiz = async (req, res, next) => {
  try {
    const { id: courseId, quizId } = req.params;
    const { answers } = req.body; // Map/Object questionIndex -> optionIndex selected

    if (!answers) {
      return sendError(res, 'No answers provided', 400);
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Verify enrollment
    const isStudent = course.students.some(sId => sId.toString() === req.user.id);
    if (!isStudent) {
      return sendError(res, 'You are not enrolled in this course', 403);
    }

    // Check if already submitted
    const existingSubmission = await QuizSubmission.findOne({ student: req.user.id, quizId });
    if (existingSubmission) {
      return sendError(res, 'You have already submitted this quiz once', 400);
    }

    // Find quiz subdocument
    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return sendError(res, 'Quiz not found', 404);
    }

    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      // Convert index to string to match Map key lookup
      const selectedOption = answers[idx] !== undefined ? answers[idx] : answers[String(idx)];
      if (selectedOption === q.correctAnswerIndex) {
        score++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const submission = await QuizSubmission.create({
      student: req.user.id,
      quizId,
      course: courseId,
      score,
      totalQuestions,
      percentage,
      answers
    });

    return sendSuccess(res, 'Quiz submitted and graded successfully', submission, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quiz submissions made by the student for this course
 * GET /api/courses/:id/quizzes/submissions
 */
exports.getQuizSubmissions = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;

    const submissions = await QuizSubmission.find({
      student: req.user.id,
      course: courseId
    });

    return sendSuccess(res, 'Quiz submissions retrieved successfully', submissions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quiz submissions for a specific quiz (Teacher only)
 * GET /api/courses/:id/quizzes/:quizId/submissions
 */
exports.getTeacherQuizSubmissions = async (req, res, next) => {
  try {
    const { id: courseId, quizId } = req.params;

    // Verify course owner (teacher)
    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    if (course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to view submissions for this course', 403);
    }

    // Verify quiz exists in the course
    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return sendError(res, 'Quiz not found', 404);
    }

    // Find all submissions for this quiz
    const submissions = await QuizSubmission.find({
      course: courseId,
      quizId: quizId
    }).populate('student', 'name email avatar').sort({ submittedAt: -1 });

    return sendSuccess(res, 'Quiz submissions retrieved successfully', {
      quizTitle: quiz.title,
      questions: quiz.questions,
      submissions
    });
  } catch (error) {
    next(error);
  }
};

