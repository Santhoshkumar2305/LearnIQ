import api from './api';

/**
 * Service to handle assignment submissions
 */
const submissionService = {
  /**
   * Submit an assignment to a course
   * @param {string} courseId
   * @param {string} assignmentId
   * @param {FormData} formData - Contains the 'file' field
   */
  submitAssignment: async (courseId, assignmentId, formData) => {
    const response = await api.post(`/submissions/submit/${courseId}/${assignmentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Fetch submissions made by the logged-in student for a specific course
   */
  getCourseSubmissions: async (courseId) => {
    const response = await api.get(`/submissions/course/${courseId}`);
    return response.data;
  },

  /**
   * Fetch all submissions of the logged-in student
   */
  getMySubmissions: async () => {
    const response = await api.get('/submissions/my');
    return response.data;
  },

  /**
   * Fetch all submissions for a specific assignment (Teacher)
   */
  getAssignmentSubmissions: async (assignmentId) => {
    const response = await api.get(`/submissions/assignment/${assignmentId}`);
    return response.data;
  },

  /**
   * Trigger AI review evaluation for a submission (Teacher)
   */
  triggerAIReview: async (submissionId) => {
    const response = await api.post(`/submissions/${submissionId}/ai-review`);
    return response.data;
  },

  /**
   * Submit manual grade and feedback for a submission (Teacher)
   */
  gradeSubmission: async (submissionId, grade, feedback) => {
    const response = await api.put(`/submissions/${submissionId}/grade`, { grade, feedback });
    return response.data;
  },

  /**
   * Fetch single submission details
   */
  getSubmissionDetails: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}`);
    return response.data;
  }
};

export default submissionService;
