import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère les données globales d'impact
 * @returns {Promise<Object>}
 */
export const getGlobalImpactService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/impact/global/`);
    console.log('[Impact] Données globales récupérées:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Impact] Erreur récupération données globales:', error.response?.status, error.response?.data);
    throw error;
  }
};
