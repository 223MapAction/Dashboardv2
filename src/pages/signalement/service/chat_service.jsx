import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

/**
 * Récupère l'historique de discussion (chatbot) pour un incident donné
 * GET /MapApi/incidents/{incident_id}/chat/
 * @param {number|string} incidentId
 * @returns {Promise<Object>} { history: [...] }
 */
export const getIncidentChatHistoryService = async (incidentId, limit, before) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const params = {};
    if (limit !== undefined) params.limit = limit;
    if (before !== undefined) params.before = before;

    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/chat/`,
      { params }
    );
    return response.data;
  } catch (error) {
    logger.error(`[ChatService] Erreur récupération historique chat (incident ${incidentId}):`, error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoie un message à l'assistant IA pour un incident donné
 * POST /MapApi/incidents/{incident_id}/chat/
 * @param {number|string} incidentId
 * @param {string} message
 * @returns {Promise<Object>} { message: "...", history: [...] }
 */
export const sendIncidentChatMessageService = async (incidentId, message) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/chat/`,
      { message }
    );
    return response.data;
  } catch (error) {
    logger.error(`[ChatService] Erreur envoi message chat (incident ${incidentId}):`, error.response?.status, error.response?.data);
    throw error;
  }
};

export default {
  getIncidentChatHistoryService,
  sendIncidentChatMessageService,
};
