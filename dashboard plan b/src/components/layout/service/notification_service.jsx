import { authService } from '../../../pages/auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère toutes les notifications de l'utilisateur
 */
export const getNotifications = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/notifications/`);
    
    return Array.isArray(response.data) 
      ? response.data 
      : response.data.data || response.data.results || [];
  } catch (error) {
    console.error('[NOTIFICATIONS] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Marque une notification comme lue
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.patch(
      `${API_URL_BASE}/MapApi/notifications/${notificationId}/`,
      { read: true }
    );
    return response.data;
  } catch (error) {
    console.error('[NOTIFICATIONS] Erreur marquage lu:', error);
    throw error;
  }
};

/**
 * Marque toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/notifications/mark-all-read/`
    );
    return response.data;
  } catch (error) {
    console.error('[NOTIFICATIONS] Erreur marquage toutes lues:', error);
    throw error;
  }
};

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
