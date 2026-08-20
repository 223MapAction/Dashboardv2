import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

/**
 * Récupère toutes les collaborations de l'utilisateur
 * @returns 
 */
export const getCollaborationsService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/collaboration/`
    );
    
    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error('[Liste Collaborations] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**qe
 * Demander à rejoindre un incident
 * @param {object} data - { incident, role, motivation, end_date }
 * @returns 
 */
export const requestCollaborationService = async (data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/collaboration/`,
      data
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Demander Collaboration] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Accepter une demande de collaboration (leader uniquement)
 * @param {number} collaborationId 
 * @returns 
 */
export const acceptCollaborationService = async (collaborationId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/accept-collaboration/`,
      { collaboration_id: collaborationId }
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Accepter Collaboration] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Refuser une demande de collaboration (leader uniquement)
 * @param {number} collaborationId 
 * @returns 
 */
export const declineCollaborationService = async (collaborationId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/decline/`,
      { collaboration_id: collaborationId }
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Refuser Collaboration] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Gérer une collaboration (accept/reject) - Méthode alternative
 * @param {number} collaborationId 
 * @param {string} action - 'accept' ou 'reject'
 * @returns 
 */
export const handleCollaborationService = async (collaborationId, action) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/collaboration/${collaborationId}/${action}/`
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Gérer Collaboration] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};
