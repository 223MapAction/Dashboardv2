import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère les données globales d'impact
 * @returns {Promise<Object>}
 */
export const getGlobalImpactService = async (status = 'all', period = 'all') => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const params = {};
    if (status) params.status = status;
    if (period) params.filter_type = period;

    const response = await axios.get(`${API_URL_BASE}/MapApi/impact/`, { params });
    console.log('[Impact] Données globales récupérées:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Impact] Erreur récupération données globales:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère la liste paginée et filtrée des incidents d'impact
 * @param {string} status - all | resolved | taken_action
 * @param {string} period - all | 30d | 90d | year
 * @param {string} search - terme de recherche
 * @param {number} page - page courante
 * @param {number} pageSize - taille de la page
 * @returns {Promise<Object>}
 */
export const getImpactIncidentsService = async (status = 'all', period = 'all', search = '', page = 1, pageSize = 10) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const params = {
      status,
      filter_type: period,
      page,
      page_size: pageSize
    };
    if (search) params.search = search;

    const response = await axios.get(`${API_URL_BASE}/MapApi/impact/incidents/`, { params });
    console.log('[Impact] Incidents d\'impact récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Impact] Erreur récupération incidents d\'impact:', error.response?.status, error.response?.data);
    throw error;
  }
};
