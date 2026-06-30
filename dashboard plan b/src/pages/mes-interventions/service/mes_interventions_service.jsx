import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';


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
export const getFieldReportsService = async (filters = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    let url = `${API_URL_BASE}/MapApi/field-reports/`;
    const params = {};

    if (filters.url) {
      url = filters.url;
    } else {
      if (filters.incident) params.incident = filters.incident;
      else if (filters.incident_id) params.incident = filters.incident_id;

      if (filters.agent_id) params.agent_id = filters.agent_id;
      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;
    }

    const response = await axios.get(url, { params });
    console.log('[FieldReport] Rapports récupérés:', response.data);
    return response.data;
  } catch (error) {
    console.error('[FieldReport] Erreur récupération rapports:', error?.response?.status, error?.response?.data);
    throw error;
  }
};
/**
 * Mes rapport dans mes incidents interne / agents
 * @param {number|string} incidentId - ID de l'incident
 * @returns {Promise<Object>}
 */

