import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère tous les messages de discussion d'un incident
 * @param {number} incidentId 
 * @returns 
 */
export const getDiscussionMessagesService = async (incidentId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/discussion/${incidentId}/`
    );
    console.log("[Discussion] Message", response.data);

    return response.data || [];
  } catch (error) {
    console.error('[Liste Messages] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un message texte dans la discussion
 * @param {number} incidentId 
 * @param {object} data - { message, recipient (optionnel) }
 * @returns 
 */
export const sendTextMessageService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${incidentId}/`,
      data
    );

    return response.data;
  } catch (error) {
    console.error('[Envoyer Message Texte] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un message audio dans la discussion
 * @param {number} incidentId 
 * @param {FormData} formData - { audio, recipient (optionnel) }
 * @returns 
 */
export const sendAudioMessageService = async (incidentId, formData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${incidentId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[Envoyer Message Audio] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un fichier dans la discussion
 * @param {number} incidentId 
 * @param {FormData} formData - { attachment, recipient (optionnel) }
 * @returns 
 */
export const sendAttachmentMessageService = async (incidentId, formData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${incidentId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[Envoyer Fichier] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Envoyer un message (texte, audio ou fichier) - Fonction générique
 * @param {number} incidentId 
 * @param {object|FormData} data - Message texte ou FormData pour audio/fichier
 * @returns 
 */
export const sendMessageService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const isFormData = data instanceof FormData;

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/discussion/${incidentId}/`,
      data,
      isFormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {}
    );

    return response.data;
  } catch (error) {
    console.error('[Envoyer Message] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};
