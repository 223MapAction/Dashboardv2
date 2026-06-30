import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère toutes les suggestions de partenaires pour un incident
 * @param {number} incidentId 
 * @returns 
 */
export const getSuggestionsService = async (incidentId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/`
    );
    
    return response.data || [];
  } catch (error) {
    console.error('[Liste Suggestions] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Créer une suggestion de partenaire (contributeur uniquement ou observeur)
 * @param {number} incidentId 
 * @param {object} data - { suggested_partner, suggested_role, justification }
 * @returns 
 */
export const createSuggestionService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/`,
      data
    );
    
    return response.data;
  } catch (error) {
    console.error('[Créer Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère une suggestion spécifique
 * @param {number} incidentId 
 * @param {number} suggestionId 
 * @returns 
 */
export const getSuggestionService = async (incidentId, suggestionId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/`
    );
    
    return response.data;
  } catch (error) {
    console.error('[Détail Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Accepter une suggestion de partenaire (leader uniquement)
 * @param {number} incidentId 
 * @param {number} suggestionId 
 * @returns 
 */
export const acceptSuggestionService = async (incidentId, suggestionId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/accept/`
    );
    
    return response.data;
  } catch (error) {
    console.error('[Accepter Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Rejeter une suggestion de partenaire (leader uniquement)
 * @param {number} incidentId 
 * @param {number} suggestionId 
 * @returns 
 */
export const rejectSuggestionService = async (incidentId, suggestionId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/reject/`
    );
    
    return response.data;
  } catch (error) {
    console.error('[Rejeter Suggestion] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};
