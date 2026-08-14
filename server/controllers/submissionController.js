const Submission = require('../models/Submission');
const Course = require('../models/Course');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const pdfParse = require('pdf-parse');
const { Groq } = require('groq-sdk');
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
 * Submit an assignment (via Cloudinary upload)
 * POST /api/submissions/submit/:courseId/:assignmentId
 */
exports.submitAssignment = async (req, res, next) => {
  try {
    const { courseId, assignmentId } = req.params;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Verify enrollment
    const isStudent = course.students.some(sId => sId.toString() === req.user.id);
    if (!isStudent) {
      return sendError(res, 'You are not enrolled in this course', 403);
    }

    // Verify assignment exists
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return sendError(res, 'Assignment not found in this course', 404);
    }

    // Verify file uploaded
    if (!req.file) {
      return sendError(res, 'No homework file uploaded', 400);
    }

    // Check if submission already exists (resubmission)
    let submission = await Submission.findOne({ student: req.user.id, assignmentId });

    if (submission) {
      submission.submissionFile = req.file.path || req.file.secure_url;
      submission.fileName = req.file.originalname;
      submission.status = 'pending'; // reset status for grading
      await submission.save();
    } else {
      submission = await Submission.create({
        student: req.user.id,
        assignmentId,
        course: courseId,
        submissionFile: req.file.path || req.file.secure_url,
        fileName: req.file.originalname,
        status: 'pending'
      });
    }

    // Send email/socket notification to the course teacher in the background
    createAndSendNotification(
      course.teacher,
      req.user.id,
      'student_submission',
      `Student "${req.user.name}" has submitted homework for assignment "${assignment.title}".`,
      { itemTitle: assignment.title }
    );

    return sendSuccess(res, 'Assignment submitted successfully', submission, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get logged-in student's submissions for a course
 * GET /api/submissions/course/:courseId
 */
exports.getCourseSubmissions = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const submissions = await Submission.find({ 
      student: req.user.id, 
      course: courseId 
    });

    return sendSuccess(res, 'Submissions retrieved successfully', submissions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all submissions of the logged-in student
 * GET /api/submissions/my
 */
exports.getMySubmissions = async (req, res, next) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('course', 'title');

    return sendSuccess(res, 'My submissions retrieved successfully', submissions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all student submissions for a specific assignment
 * GET /api/submissions/assignment/:assignmentId
 */
exports.getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    // Verify course owner (teacher)
    const course = await Course.findOne({
      'assignments._id': assignmentId,
      teacher: req.user.id
    });

    if (!course) {
      return sendError(res, 'You are not authorized to view submissions for this assignment', 403);
    }

    const submissions = await Submission.find({ assignmentId })
      .populate('student', 'name email avatar')
      .sort({ submittedAt: -1 });

    return sendSuccess(res, 'Assignment submissions retrieved successfully', submissions);
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger AI Evaluation review on a student submission using Groq
 * POST /api/submissions/:submissionId/ai-review
 */
exports.triggerAIReview = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    // Find submission
    const submission = await Submission.findById(submissionId).populate('course');
    if (!submission) {
      return sendError(res, 'Submission not found', 404);
    }

    // Verify teacher owns the course
    if (submission.course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to review this submission', 403);
    }

    // Find assignment details in the course
    const assignment = submission.course.assignments.id(submission.assignmentId);
    if (!assignment) {
      return sendError(res, 'Assignment details not found', 404);
    }

    if (!process.env.GROQ_API_KEY) {
      return sendError(res, 'Groq API Key is not configured on the server', 500);
    }

    let extractedText = '';
    const isPdf = submission.submissionFile.toLowerCase().endsWith('.pdf') || 
                  (submission.fileName && submission.fileName.toLowerCase().endsWith('.pdf'));

    if (isPdf) {
      try {
        extractedText = await extractTextFromPdf(submission.submissionFile);
      } catch (err) {
        console.error('PDF extraction failed:', err);
        extractedText = `Could not parse text from PDF file. File URL: ${submission.submissionFile}`;
      }
    } else {
      extractedText = `Text extraction is not supported for non-PDF files. File name: ${submission.fileName || 'document'}`;
    }

    // Clean text and limit size to fit prompt limits
    extractedText = extractedText.trim().replace(/\s+/g, ' ');
    if (extractedText.length > 12000) {
      extractedText = extractedText.slice(0, 12000) + '... [TRUNCATED]';
    }
    if (!extractedText || extractedText.length < 10) {
      extractedText = 'No readable text content extracted from file.';
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const promptText = `
You are an expert academic evaluator. Your task is to evaluate a student's homework submission based on the assignment instructions and criteria.

Evaluation Guidelines:
- Evaluate based on the student’s demonstrated understanding, not exact wording.
- Award partial credit when the approach or concepts are correct, even if the final answer has minor errors.
- Do not award marks for unsupported or incorrect claims.
- Be fair and consistent with the marking scheme.

Assignment Details:
- Title: ${assignment.title}
- Instructions / Description: ${assignment.description}
- Max Points: ${assignment.maxPoints}

Student Submission File Name: ${submission.fileName || 'document'}
Student Submission Extracted Text:
"""
${extractedText}
"""

Please review the student's submission carefully. Identify:
1. The overall quality and completeness of the work.
2. Key strengths of the submission.
3. Key weaknesses or areas that need improvement.
4. Any concepts required by the assignment instructions or rubrics that are missing or insufficiently detailed.
5. Estimate an originality score (from 0 to 100) indicating the uniqueness and authenticity of the response (e.g., lower if it seems plagiarized, template-copied, or completely AI-written without custom inputs; higher if it shows genuine effort, custom reasoning, or original problem solving).
6. General actionable suggestions on how the student can improve their score or understanding.

You MUST respond ONLY with a valid JSON object. Do not include any conversational filler, explanation, or markdown formatting (such as wrapping the response in \`\`\`json). The JSON object MUST adhere exactly to this schema:
{
  "summary": "overall summary of the submission",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "missingConcepts": ["concept 1", "concept 2", ...],
  "originalityScore": 85,
  "suggestions": "improvement suggestions"
}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an academic evaluator. You must return only a valid JSON response.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const rawJson = completion.choices[0]?.message?.content || '{}';
    let aiReview = {};
    try {
      aiReview = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error('Error parsing Groq response JSON:', parseErr);
      aiReview = {
        summary: 'Error parsing AI review results.',
        strengths: ['Unable to extract automatic strengths.'],
        weaknesses: [],
        missingConcepts: [],
        originalityScore: 100,
        suggestions: 'Review manually.'
      };
    }

    submission.aiReview = {
      summary: aiReview.summary || '',
      strengths: Array.isArray(aiReview.strengths) ? aiReview.strengths : [],
      weaknesses: Array.isArray(aiReview.weaknesses) ? aiReview.weaknesses : [],
      missingConcepts: Array.isArray(aiReview.missingConcepts) ? aiReview.missingConcepts : [],
      originalityScore: typeof aiReview.originalityScore === 'number' ? aiReview.originalityScore : 100,
      suggestions: aiReview.suggestions || ''
    };

    if (submission.status === 'pending') {
      submission.status = 'reviewed';
    }

    await submission.save();

    // Populate student and course fields to match getSubmissionDetails populated format
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('student', 'name email avatar')
      .populate('course', 'title teacher assignments');

    return sendSuccess(res, 'AI review generated and saved successfully', populatedSubmission);
  } catch (error) {
    next(error);
  }
};

/**
 * Update submission grade and feedback manually
 * PUT /api/submissions/:submissionId/grade
 */
exports.gradeSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === '') {
      return sendError(res, 'Please provide a grade', 400);
    }

    const submission = await Submission.findById(submissionId).populate('course');
    if (!submission) {
      return sendError(res, 'Submission not found', 404);
    }

    // Verify teacher owns course
    if (submission.course.teacher.toString() !== req.user.id) {
      return sendError(res, 'You are not authorized to grade this submission', 403);
    }

    // Validate grade limits
    const assignment = submission.course.assignments.id(submission.assignmentId);
    const maxPoints = assignment ? assignment.maxPoints : 100;
    if (Number(grade) < 0 || Number(grade) > maxPoints) {
      return sendError(res, `Grade must be between 0 and ${maxPoints}`, 400);
    }

    submission.grade = Number(grade);
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedAt = Date.now();

    await submission.save();

    // Send email/socket notification to the student in the background
    createAndSendNotification(
      submission.student,
      req.user.id,
      'grade_released',
      `Your submission for assignment "${assignment ? assignment.title : 'Assignment'}" has been graded by the instructor.`,
      {
        courseTitle: submission.course.title,
        itemTitle: assignment ? assignment.title : 'Assignment',
        grade: Number(grade),
        maxPoints: maxPoints
      }
    );

    // Populate student and course fields to match getSubmissionDetails populated format
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('student', 'name email avatar')
      .populate('course', 'title teacher assignments');

    return sendSuccess(res, 'Submission graded successfully', populatedSubmission);
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed view of a single submission (accessible by the student, the course teacher, or admins)
 * GET /api/submissions/:submissionId
 */
exports.getSubmissionDetails = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
      .populate('student', 'name email avatar')
      .populate('course', 'title teacher assignments');

    if (!submission) {
      return sendError(res, 'Submission not found', 404);
    }

    // Verify permission: User must be either the student who submitted, the course teacher, or an admin
    const isStudent = submission.student._id.toString() === req.user.id;
    const isTeacher = submission.course.teacher.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isTeacher && !isAdmin) {
      return sendError(res, 'You do not have access to this submission', 403);
    }

    return sendSuccess(res, 'Submission details retrieved successfully', submission);
  } catch (error) {
    next(error);
  }
};
