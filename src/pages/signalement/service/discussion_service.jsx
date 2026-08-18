import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

/**
 * Récupère tous les messages de discussion d'un signalement
 * @param {number} signalementId 
 * @returns 
 */
export const getDiscussionMessagesService = async (signalementId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/discussion/${signalementId}/`
    );

    return response.data || [];
  } catch (error) {
    logger.error('[Liste Messages] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un message texte dans la discussion
 * @param {number} signalementId 
 * @param {object} data - { message, recipient (optionnel) }
 * @returns 
 */
export const sendTextMessageService = async (signalementId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${signalementId}/`,
      data
    );

    return response.data;
  } catch (error) {
    logger.error('[Envoyer Message Texte] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un message audio dans la discussion
 * @param {number} signalementId 
 * @param {FormData} formData - { audio, recipient (optionnel) }
 * @returns 
 */
export const sendAudioMessageService = async (signalementId, formData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${signalementId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('[Envoyer Message Audio] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un fichier dans la discussion
 * @param {number} signalementId 
 * @param {FormData} formData - { attachment, recipient (optionnel) }
 * @returns 
 */
export const sendAttachmentMessageService = async (signalementId, formData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${signalementId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('[Envoyer Fichier] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un message (texte, audio ou fichier) - Fonction générique
 * @param {number} signalementId 
 * @param {object|FormData} data - Message texte ou FormData pour audio/fichier
 * @returns 
 */
export const sendMessageService = async (signalementId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const isFormData = data instanceof FormData;

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${signalementId}/`,
      data,
      isFormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {}
    );

    return response.data;
  } catch (error) {
    logger.error('[Envoyer Message] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};
