import api from './api';

const analyticsService = {
  /**
   * Fetch student statistics
   */
  getStudentAnalytics: async () => {
    const response = await api.get('/analytics/student');
    return response.data;
  },

  /**
   * Fetch teacher metrics
   */
  getTeacherAnalytics: async () => {
    const response = await api.get('/analytics/teacher');
    return response.data;
  },

  /**
   * Fetch admin platform-wide aggregates
   */
  getAdminAnalytics: async () => {
    const response = await api.get('/analytics/admin');
    return response.data;
  }
};

export default analyticsService;
