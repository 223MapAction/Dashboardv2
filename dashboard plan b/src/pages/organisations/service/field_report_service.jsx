import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

// ─────────────────────────────────────────────────────────
// RAPPORTS DE TERRAIN (FIELD REPORTS)
// ─────────────────────────────────────────────────────────

/**
 * Créer un rapport de terrain pour un incident
 * POST /MapApi/field-reports/
 * @param {{
 *   incident_id: number,
 *   visited_at: string,    // datetime ISO
 *   notes?: string,
 *   photos?: File,
 *   location_lat?: string,
 *   location_lng?: string
 * }} data
 * @returns {Promise<Object>}
 */
export const createFieldReportService = async (data) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    // Si une photo est fournie, on envoie en multipart/form-data
    let payload = data;
    let config = {};
    if (data.photos instanceof File) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val);
      });
      payload = formData;
      config = { headers: { 'Content-Type': 'multipart/form-data' } };
    }

    const response = await axios.post(`${API_URL_BASE}/MapApi/field-reports/`, payload, config);
    console.log('[FieldReport] Rapport créé:', response.data);
    return response?.data || {};
  } catch (error) {
    console.error('[FieldReport] Erreur création rapport:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Lister les rapports de terrain
 * GET /MapApi/field-reports/
 * @param {{ incident_id?: number, agent_id?: number }} params - Filtres optionnels
 * @returns {Promise<Array>}
 */
export const listFieldReportsService = async (params = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/field-reports/`, { params });
    console.log('[FieldReport] Rapports récupérés:', response.data);
    return response?.data?.results || response?.data || [];
  } catch (error) {
    console.error('[FieldReport] Erreur liste rapports:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

export default {
  createFieldReportService,
  listFieldReportsService,
};
