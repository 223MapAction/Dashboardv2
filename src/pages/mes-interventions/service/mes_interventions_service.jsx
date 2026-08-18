import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';


/**
 * Récupère les signalements internes de l'organisation
 * @param {string} filter - 'agents_or_internal' | 'internal' | 'agents'
  * @returns {Promise<Object>}
 */
export const getOrgInternalSignalementsService = async (filters = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const params = {};

    // Determine filter mode/source (default to 'agents_or_internal' or support string/object parameter)
    const filter = typeof filters === 'string' ? filters : (filters.sourceFilter || 'agents_or_internal');
    if (filter === 'internal') {
      params.mode = 'internal';
    } else if (filter === 'agents') {
      params.source = 'agents';
    } else {
      params.source = filter;
    }

    if (filters && typeof filters === 'object') {
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.page) {
        params.page = filters.page;
      }
      if (filters.page_size) {
        params.page_size = filters.page_size;
      }
    }

    const response = await axios.get(`${API_URL_BASE}/MapApi/org-signalements/`, {
      params
    });
    return response.data;
  } catch (error) {
    logger.error('[MesInterventions] Erreur récupération signalements internes org:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Bascule la visibilité publique d'un signalement
 * @param {number|string} signalementId - ID de l'signalement
 * @returns {Promise<Object>}
 */
export const toggleSignalementPublicService = async (signalementId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(`${API_URL_BASE}/MapApi/incidents/${signalementId}/toggle-public/`);
    return response.data;
  } catch (error) {
    logger.error('[MesInterventions] Erreur basculement visibilité publique:', error.response?.status, error.response?.data);
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
    return response.data;
  } catch (error) {
    logger.error('[FieldReport] Erreur récupération rapports:', error?.response?.status, error?.response?.data);
    throw error;
  }
};
/**
 * Mes rapport dans mes signalements interne / agents
 * @param {number|string} signalementId - ID de l'signalement
 * @returns {Promise<Object>}
 */

