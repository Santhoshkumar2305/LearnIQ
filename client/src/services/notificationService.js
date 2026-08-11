import api from './api';

const notificationService = {
  /**
   * Fetch all notifications for current user
   */
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Bulk mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

export default notificationService;
