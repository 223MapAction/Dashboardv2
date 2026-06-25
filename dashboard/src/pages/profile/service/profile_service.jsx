import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère le profil d'un utilisateur
 * @param {string|number} id - ID de l'utilisateur
 * @returns {Promise<Object>} Détails du profil
 */
export const getUserProfileService = async (id) => {
  if (!id) throw new Error('ID utilisateur requis');
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/user/${id}/`);
    console.log('[Profile] Profil récupéré:', response.data);
    return response?.data || {};
  } catch (error) {
    console.error('[Profile] Erreur récupération profil:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Met à jour le profil d'un utilisateur
 * @param {string|number} id - ID de l'utilisateur
 * @param {Object} data - Données du profil à modifier
 * @returns {Promise<Object>} Profil mis à jour
 */
export const updateUserProfileService = async (id, data) => {
  if (!id) throw new Error('ID utilisateur requis');
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.put(`${API_URL_BASE}/MapApi/user/${id}/`, data);
    console.log('[Profile] Profil mis à jour:', response.data);
    return response?.data || {};
  } catch (error) {
    console.error('[Profile] Erreur mise à jour profil:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

export default {
  getUserProfileService,
  updateUserProfileService,
};
