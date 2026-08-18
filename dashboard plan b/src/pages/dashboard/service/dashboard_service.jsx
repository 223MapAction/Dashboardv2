import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère tous les incidents pour la carte
 */
// Le parametre de filtre accepte ici n'a jamais ete transmis a l'API : la
// requete ci-dessous ne le lit pas. Il est retire pour ne pas laisser croire a
// un filtrage cote serveur qui n'existe pas.
export const getIncidentsService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incident/`
    );

    return response.data || [];
  } catch (error) {
    console.error('[DASHBOARD] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les statistiques globales pour le tableau de bord
 */
export const getDashboardStatsService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/dashboard-stats/`);
    console.log('[DASHBOARD] Statistiques récupérées:', response.data);
    return response.data;
  } catch (error) {
    console.error('[DASHBOARD] Erreur récupération statistiques:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les incidents filtrés pour la carte (léger, paginé)
 * @param {Object} params - Paramètres de requête
 * @param {string} params.scope - Scope: 'resolved' | 'unresolved' | 'all' | 'mine'
 * @param {number} params.page - Numéro de page (défaut: 1)
 * @param {number} params.page_size - Taille de page (max: 100, défaut: 100)
 * @returns {Promise<Object>} { count, next, previous, results }
 */
export const getIncidentsFilteredService = async (params = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const queryParams = {
      scope: params.scope || 'all',
      page: params.page || 1,
      page_size: params.page_size || 100,
      ...params
    };
    const response = await axios.get(`${API_URL_BASE}/MapApi/incident-filter/`, { params: queryParams });
    console.log(`[DASHBOARD] Incidents filtrés (${queryParams.scope}) récupérés:`, response.data);
    return response.data;
  } catch (error) {
    console.error('[DASHBOARD] Erreur récupération incidents filtrés:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère la liste des incidents non résolus
 * @deprecated Utiliser getIncidentsFilteredService avec scope='unresolved' pour la carte
 */
export const getIncidentsNotResolvedService = async (params = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidentNotResolved/`, { params });
    console.log('[DASHBOARD] Incidents non résolus récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[DASHBOARD] Erreur récupération incidents non résolus:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère la liste des incidents résolus
 * @deprecated Utiliser getIncidentsFilteredService avec scope='resolved' pour la carte
 */
export const getIncidentsResolvedService = async (params = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidentResolved/`, { params });
    console.log('[DASHBOARD] Incidents résolus récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[DASHBOARD] Erreur récupération incidents résolus:', error.response?.status, error.response?.data);
    throw error;
  }
};

export const getActivityFeedService = async (filters = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    let url = `${API_URL_BASE}/MapApi/activity-feed/`;
    const params = {};

    if (filters.url) {
      url = filters.url;
    } else {
      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;
    }

    const response = await axios.get(url, { params });
    console.log('[DASHBOARD] Flux d\'activité récupéré:', response.data);
    return response.data;
  } catch (error) {
    console.error('[DASHBOARD] Erreur récupération flux d\'activité:', error.response?.status, error.response?.data);
    throw error;
  }
};
