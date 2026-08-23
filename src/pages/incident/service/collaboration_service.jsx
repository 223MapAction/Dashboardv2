import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

/**
 * Récupère les collaborations de l'utilisateur.
 *
 * La route est paginée (`{ count, next, previous, results }`) et sert ici à
 * poser un badge sur chaque signalement de la liste : il faut donc l'ensemble
 * des lignes, pas la première page. Sans pagination explicite, l'API applique
 * la sienne — 20 lignes — et les collaborations au-delà disparaissaient du
 * badge sans erreur ni trace. Invisible aujourd'hui (20 collaborations en
 * tout), le jour où la 21e arrive.
 *
 * On demande donc des pages larges et on suit `next` jusqu'au bout.
 * `maxPages` est un garde-fou : si l'API renvoyait un `next` perpétuel, mieux
 * vaut une liste incomplète et un avertissement qu'une boucle infinie.
 *
 * @param {object} [options]
 * @param {number} [options.pageSize=100] lignes par requête
 * @param {number} [options.maxPages=10] nombre maximal de pages parcourues
 * @returns {Promise<Array>} toutes les collaborations
 */
export const getCollaborationsService = async ({ pageSize = 100, maxPages = 10 } = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const collaborations = [];

    for (let page = 1; page <= maxPages; page++) {
      const response = await axios.get(`${API_URL_BASE}/MapApi/collaboration/`, {
        params: { page, page_size: pageSize }
      });
      const data = response.data;

      // Certaines routes de l'API renvoient un tableau nu plutôt qu'une
      // enveloppe paginée : dans ce cas tout est déjà là.
      if (Array.isArray(data)) {
        collaborations.push(...data);
        break;
      }

      collaborations.push(...(data?.results || []));

      if (!data?.next) {
        return collaborations;
      }

      if (page === maxPages) {
        logger.warn(
          `[Liste Collaborations] Arrêt après ${maxPages} pages : la liste peut être incomplète.`
        );
      }
    }

    return collaborations;
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
