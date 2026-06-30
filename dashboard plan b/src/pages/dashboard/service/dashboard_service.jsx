import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère tous les incidents pour la carte
 */
export const getIncidentsService = async (filterType = '') => {
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
 * Récupère la liste des incidents non résolus
 */
export const getIncidentsNotResolvedService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidentNotResolved/`);
    console.log('[DASHBOARD] Incidents non résolus récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[DASHBOARD] Erreur récupération incidents non résolus:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère la liste des incidents résolus
 */
export const getIncidentsResolvedService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidentResolved/`);
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
