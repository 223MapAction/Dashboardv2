import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère les incidents de l'organisation
 * @param {string} source - 'agents' | 'citizens' | 'all' (default: 'agents')
 * @returns {Promise<Object>}
 */
export const getOrgIncidentsService = async (source = 'agents') => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/org-incidents/`, {
      params: { source }
    });
    console.log('[MesInterventions] Incidents de l\'organisation récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[MesInterventions] Erreur récupération incidents org:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les incidents internes de l'organisation
 * @param {string} filter - 'agents_or_internal' | 'internal' | 'agents'
  * @returns {Promise<Object>}
 */
export const getOrgInternalIncidentsService = async (filter = 'agents_or_internal') => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const params = {};
    if (filter === 'internal') {
      params.mode = 'internal';
    } else if (filter === 'agents') {
      params.source = 'agents';
    } else {
      params.source = filter;
    }
    const response = await axios.get(`${API_URL_BASE}/MapApi/org-incidents/`, {
      params
    });
    console.log('[MesInterventions] Incidents internes de l\'organisation récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[MesInterventions] Erreur récupération incidents internes org:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Bascule la visibilité publique d'un incident
 * @param {number|string} incidentId - ID de l'incident
 * @returns {Promise<Object>}
 */
export const toggleIncidentPublicService = async (incidentId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(`${API_URL_BASE}/MapApi/incidents/${incidentId}/toggle-public/`);
    console.log('[MesInterventions] Visibilité publique basculée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[MesInterventions] Erreur basculement visibilité publique:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les rapports de terrain remontés par les agents
 * @returns {Promise<Array>}
 */
export const getFieldReportsService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/field-reports/`);
     return response.data;
  } catch (error) {
    console.error('[MesInterventions] Erreur récupération rapports de terrain:', error.response?.status, error.response?.data);
    throw error;
  }
};
/**
 * Mes rapport dans mes incidents interne / agents
 * @param {number|string} incidentId - ID de l'incident
 * @returns {Promise<Object>}
 */
 
 