const Course = require('../models/Course');
const User = require('../models/User');
const Submission = require('../models/Submission');
const QuizSubmission = require('../models/QuizSubmission');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get analytics for the logged-in Student
 * GET /api/analytics/student
 */
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Fetch courses student is enrolled in
    const courses = await Course.find({ students: studentId });
    const enrolledCoursesCount = courses.length;

    // 2. Fetch homework assignment submissions
    const homeworkSubmissions = await Submission.find({ student: studentId });
    const totalAssignmentsSubmitted = homeworkSubmissions.length;
    const gradedAssignments = homeworkSubmissions.filter(s => s.status === 'graded');
    const gradedAssignmentsCount = gradedAssignments.length;

    // Calculate average assignment score percentage
    let totalAssignmentPercentage = 0;
    const assignmentPerformanceData = [];

    for (const sub of homeworkSubmissions) {
      // Find assignment in course to get maxPoints
      const courseObj = courses.find(c => c._id.toString() === sub.course.toString());
      const assign = courseObj?.assignments?.find(a => a._id.toString() === sub.assignmentId.toString());
      const maxPoints = assign ? assign.maxPoints : 100;
      
      const percentage = sub.grade !== undefined && sub.grade !== null 
        ? Math.round((sub.grade / maxPoints) * 100) 
        : null;

      if (percentage !== null && sub.status === 'graded') {
        totalAssignmentPercentage += percentage;
      }

      assignmentPerformanceData.push({
        title: assign ? assign.title : 'Assignment',
        grade: sub.grade || 0,
        maxPoints,
        percentage: percentage || 0,
        status: sub.status
      });
    }

    const avgAssignmentPercentage = gradedAssignmentsCount > 0 
      ? Math.round(totalAssignmentPercentage / gradedAssignmentsCount) 
      : 0;

    // 3. Fetch Quiz submissions
    const quizSubmissions = await QuizSubmission.find({ student: studentId });
    const totalQuizzesSubmitted = quizSubmissions.length;

    let totalQuizPercentage = 0;
    const quizPerformanceData = [];

    for (const sub of quizSubmissions) {
      // Find course title
      const courseObj = courses.find(c => c._id.toString() === sub.course.toString());
      const quizObj = courseObj?.quizzes?.find(q => q._id.toString() === sub.quizId.toString());

      totalQuizPercentage += sub.percentage;
      quizPerformanceData.push({
        title: quizObj ? quizObj.title : 'Quiz',
        score: sub.score,
        totalQuestions: sub.totalQuestions,
        percentage: sub.percentage
      });
    }

    const avgQuizPercentage = totalQuizzesSubmitted > 0 
      ? Math.round(totalQuizPercentage / totalQuizzesSubmitted) 
      : 0;

    return sendSuccess(res, 'Student analytics retrieved successfully', {
      summary: {
        coursesEnrolled: enrolledCoursesCount,
        assignmentsSubmitted: totalAssignmentsSubmitted,
        quizzesTaken: totalQuizzesSubmitted,
        avgAssignmentGrade: avgAssignmentPercentage,
        avgQuizGrade: avgQuizPercentage
      },
      charts: {
        assignments: assignmentPerformanceData,
        quizzes: quizPerformanceData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics for the logged-in Teacher
 * GET /api/analytics/teacher
 */
exports.getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    // 1. Fetch courses taught by the teacher
    const courses = await Course.find({ teacher: teacherId });
    const coursesCount = courses.length;

    // Get list of all enrolled students (unique count)
    const studentsSet = new Set();
    courses.forEach(course => {
      course.students.forEach(studentId => {
        studentsSet.add(studentId.toString());
      });
    });
    const totalUniqueStudents = studentsSet.size;

    // 2. Aggregate assignment submissions class performance
    const classPerformanceData = [];
    let pendingSubmissionsCount = 0;
    let gradedSubmissionsCount = 0;

    for (const course of courses) {
      for (const assign of course.assignments) {
        const subs = await Submission.find({ assignmentId: assign._id });
        
        const graded = subs.filter(s => s.status === 'graded');
        const pending = subs.filter(s => s.status === 'pending');
        pendingSubmissionsCount += pending.length;
        gradedSubmissionsCount += graded.length;

        // Calculate average grade
        let avgGrade = 0;
        if (graded.length > 0) {
          const totalGrade = graded.reduce((sum, s) => sum + (s.grade || 0), 0);
          avgGrade = parseFloat((totalGrade / graded.length).toFixed(1));
        }

        classPerformanceData.push({
          assignmentTitle: assign.title,
          courseTitle: course.title,
          averageScore: avgGrade,
          maxPoints: assign.maxPoints,
          averagePercentage: assign.maxPoints > 0 ? Math.round((avgGrade / assign.maxPoints) * 100) : 0,
          submissionsCount: subs.length
        });
      }
    }

    // 3. Aggregate Quiz Performance per quiz
    const quizAnalyticsData = [];
    for (const course of courses) {
      for (const quiz of course.quizzes) {
        const subs = await QuizSubmission.find({ quizId: quiz._id });
        
        let avgPercentage = 0;
        if (subs.length > 0) {
          const totalPct = subs.reduce((sum, s) => sum + s.percentage, 0);
          avgPercentage = Math.round(totalPct / subs.length);
        }

        quizAnalyticsData.push({
          quizTitle: quiz.title,
          courseTitle: course.title,
          submissionsCount: subs.length,
          averagePercentage: avgPercentage
        });
      }
    }

    // 4. Course size distribution
    const courseDistribution = courses.map(c => ({
      name: c.title,
      value: c.students.length
    }));

    return sendSuccess(res, 'Teacher analytics retrieved successfully', {
      summary: {
        totalCourses: coursesCount,
        totalStudents: totalUniqueStudents,
        pendingReviews: pendingSubmissionsCount,
        gradedSubmissions: gradedSubmissionsCount
      },
      charts: {
        classPerformance: classPerformanceData,
        quizPerformance: quizAnalyticsData,
        courseDistribution: courseDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics for the platform Admin
 * GET /api/analytics/admin
 */
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Total platform metrics
    const totalUsers = await User.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    const pendingTeachers = await User.countDocuments({ role: 'teacher', isApproved: false });

    // 2. User role distribution
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const userDistribution = [
      { name: 'Students', value: 0 },
      { name: 'Teachers', value: 0 },
      { name: 'Admins', value: 0 }
    ];

    roleStats.forEach(stat => {
      if (stat._id === 'student') userDistribution[0].value = stat.count;
      else if (stat._id === 'teacher') userDistribution[1].value = stat.count;
      else if (stat._id === 'admin') userDistribution[2].value = stat.count;
    });

    // 3. Platform Growth (Number of students per course)
    const platformCourses = await Course.find({}).sort({ createdAt: -1 }).limit(10);
    const courseEnrollmentTimeline = platformCourses.map(c => ({
      courseTitle: c.title,
      studentsCount: c.students.length
    }));

    return sendSuccess(res, 'Admin analytics retrieved successfully', {
      summary: {
        totalUsers,
        totalCourses,
        pendingApprovals: pendingTeachers
      },
      charts: {
        userDistribution,
        courseEnrollment: courseEnrollmentTimeline
      }
    });
  } catch (error) {
    next(error);
  }
};
