import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère tous les incidents pour la carte
 */
export const getIncidentsService = async (filterType = '') => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incident-filter/`
    );

    return response.data || [];
  } catch (error) {
    console.error('[DASHBOARD] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};
