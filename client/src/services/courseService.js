import api from './api';

/**
 * Service to handle all API operations relating to courses and curriculum
 */
const courseService = {
  /**
   * Fetch courses created by the logged-in teacher
   */
  getTeacherCourses: async () => {
    const response = await api.get('/courses/teacher');
    return response.data;
  },

  /**
   * Fetch detailed view of a course (by ID)
   */
  getCourseDetails: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  },

  /**
   * Create a new course
   * @param {Object} courseData - { title, description }
   */
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  /**
   * Delete an existing course
   */
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  },

  /**
   * Upload resource material (PDF or Video) to Cloudinary and append to course
   * @param {string} courseId
   * @param {FormData} formData - Contains 'title' and 'file' fields
   */
  uploadMaterial: async (courseId, formData) => {
    const response = await api.post(`/courses/${courseId}/materials`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Add a new assignment to a course
   * @param {string} courseId
   * @param {Object} assignmentData - { title, description, dueDate, fileUrl, maxPoints }
   */
  createAssignment: async (courseId, assignmentData) => {
    const response = await api.post(`/courses/${courseId}/assignments`, assignmentData);
    return response.data;
  },

  /**
   * Add a new quiz to a course
   * @param {string} courseId
   * @param {Object} quizData - { title, questions: [{ questionText, options, correctAnswerIndex }] }
   */
  createQuiz: async (courseId, quizData) => {
    const response = await api.post(`/courses/${courseId}/quizzes`, quizData);
    return response.data;
  },

  /**
   * Delete a course material
   */
  deleteMaterial: async (courseId, materialId) => {
    const response = await api.delete(`/courses/${courseId}/materials/${materialId}`);
    return response.data;
  },

  /**
   * Update an existing assignment
   */
  updateAssignment: async (courseId, assignmentId, assignmentData) => {
    const response = await api.put(`/courses/${courseId}/assignments/${assignmentId}`, assignmentData);
    return response.data;
  },

  /**
   * Delete an assignment
   */
  deleteAssignment: async (courseId, assignmentId) => {
    const response = await api.delete(`/courses/${courseId}/assignments/${assignmentId}`);
    return response.data;
  },

  /**
   * Update an existing quiz
   */
  updateQuiz: async (courseId, quizId, quizData) => {
    const response = await api.put(`/courses/${courseId}/quizzes/${quizId}`, quizData);
    return response.data;
  },

  /**
   * Delete a quiz
   */
  deleteQuiz: async (courseId, quizId) => {
    const response = await api.delete(`/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  },

  /**
   * Enroll a student in a course using an invite code
   */
  joinCourse: async (inviteCode) => {
    const response = await api.post('/courses/join', { inviteCode });
    return response.data;
  },

  /**
   * Fetch courses enrolled by the student
   */
  getStudentCourses: async () => {
    const response = await api.get('/courses/student');
    return response.data;
  },

  /**
   * Generate AI notes for a specific material
   */
  generateNotes: async (courseId, materialId) => {
    const response = await api.post(`/courses/${courseId}/materials/${materialId}/notes`);
    return response.data;
  },

  /**
   * Submit student quiz answers to the backend for secure grading
   */
  submitQuiz: async (courseId, quizId, answers) => {
    const response = await api.post(`/courses/${courseId}/quizzes/${quizId}/submit`, { answers });
    return response.data;
  },

  /**
   * Fetch all quiz submissions made by the current student for a course
   */
  getQuizSubmissions: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/quizzes/submissions`);
    return response.data;
  },

  /**
   * Fetch all quiz submissions for a specific quiz (for teachers)
   */
  getTeacherQuizSubmissions: async (courseId, quizId) => {
    const response = await api.get(`/courses/${courseId}/quizzes/${quizId}/submissions`);
    return response.data;
  }
};

export default courseService;
