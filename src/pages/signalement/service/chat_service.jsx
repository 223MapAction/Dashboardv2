import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

/**
 * Récupère l'historique de discussion (chatbot) pour un signalement donné
 * GET /MapApi/incidents/{incident_id}/chat/
 * @param {number|string} signalementId
 * @returns {Promise<Object>} { history: [...] }
 */
export const getSignalementChatHistoryService = async (signalementId, limit, before) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const params = {};
    if (limit !== undefined) params.limit = limit;
    if (before !== undefined) params.before = before;

    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/chat/`,
      { params }
    );
    return response.data;
  } catch (error) {
    logger.error(`[ChatService] Erreur récupération historique chat (signalement ${signalementId}):`, error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoie un message à l'assistant IA pour un signalement donné
 * POST /MapApi/incidents/{incident_id}/chat/
 * @param {number|string} signalementId
 * @param {string} message
 * @returns {Promise<Object>} { message: "...", history: [...] }
 */
export const sendSignalementChatMessageService = async (signalementId, message) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/chat/`,
      { message }
    );
    return response.data;
  } catch (error) {
    logger.error(`[ChatService] Erreur envoi message chat (signalement ${signalementId}):`, error.response?.status, error.response?.data);
    throw error;
  }
};

export default {
  getSignalementChatHistoryService,
  sendSignalementChatMessageService,
};
