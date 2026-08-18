import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

/**
 * Récupère toutes les suggestions de partenaires pour un signalement
 * @param {number} signalementId 
 * @returns 
 */
export const getSuggestionsService = async (signalementId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/suggestions/`
    );
    
    return response.data || [];
  } catch (error) {
    logger.error('[Liste Suggestions] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Créer une suggestion de partenaire (contributeur uniquement ou observeur)
 * @param {number} signalementId 
 * @param {object} data - { suggested_organisation, suggested_role, justification }
 * @returns 
 */
export const createSuggestionService = async (signalementId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/suggestions/`,
      data
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Créer Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère une suggestion spécifique
 * @param {number} signalementId 
 * @param {number} suggestionId 
 * @returns 
 */
export const getSuggestionService = async (signalementId, suggestionId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/suggestions/${suggestionId}/`
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Détail Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Accepter une suggestion de partenaire (leader uniquement)
 * @param {number} signalementId 
 * @param {number} suggestionId 
 * @returns 
 */
export const acceptSuggestionService = async (signalementId, suggestionId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/suggestions/${suggestionId}/accept/`
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Accepter Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Rejeter une suggestion de partenaire (leader uniquement)
 * @param {number} signalementId 
 * @param {number} suggestionId 
 * @returns 
 */
export const rejectSuggestionService = async (signalementId, suggestionId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/suggestions/${suggestionId}/reject/`
    );
    
    return response.data;
  } catch (error) {
    logger.error('[Rejeter Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};
