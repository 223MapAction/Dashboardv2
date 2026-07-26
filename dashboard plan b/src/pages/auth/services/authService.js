import axios from 'axios';
import { mutate } from 'swr';
import { API_URL_BASE } from '../../../config/api_url_base';

const API_URL = API_URL_BASE;

// Clés de stockage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  USER_ID: 'user_id',
  FIRST_NAME: 'first_name',
  ZONE: 'zone',
  USER_TYPE: 'user_type',
  ORGANISATION: 'organisation',
};

export const authService = {
  /**
   * Connexion de l'utilisateur
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} - Données de l'utilisateur connecté
   */
  login: async (credentials) => {
    try {
      // 1. Authentification
      const authResponse = await axios.post(
        `${API_URL}/MapApi/login/`,
        credentials
      );

      const { access, refresh } = authResponse.data;

      if (!access) {
        throw new Error('Token d\'accès non reçu');
      }

      // 2. Récupération des informations utilisateur
      const userResponse = await axios.get(
        `${API_URL}/MapApi/user_retrieve/`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      );

      console.log('[AUTH] Réponse user_retrieve:', userResponse.status, userResponse.data);

      const userData = userResponse.data.data || userResponse.data;

      console.log('[AUTH] Données user:', userData);

      // 3. Stockage dans sessionStorage
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      sessionStorage.setItem(STORAGE_KEYS.USER_ID, userData.id);
      sessionStorage.setItem(STORAGE_KEYS.FIRST_NAME, userData.first_name);
      sessionStorage.setItem(STORAGE_KEYS.ZONE, userData.adress);
      sessionStorage.setItem(STORAGE_KEYS.USER_TYPE, userData.user_type);
      sessionStorage.setItem(STORAGE_KEYS.ORGANISATION, userData.organisation);

      return {
        success: true,
        user: userData,
        tokens: { access, refresh },
      };
    } catch (error) {
      console.error('[AUTH] Erreur complète:', error);
      console.error('[AUTH] Status:', error.response?.status);
      console.error('[AUTH] Data:', error.response?.data);
      console.error('[AUTH] Headers:', error.response?.headers);

      if (error.response?.status === 401) {
        throw {
          detail: 'Identifiants incorrects. Vérifiez votre email et mot de passe.',
          status: 401,
          originalError: error.response?.data
        };
      }

      throw error.response?.data || error.message || 'Erreur de connexion';
    }
  },

  /**
   * Déconnexion de l'utilisateur
   */
  logout: () => {
    // Effacer tous les caches SWR
    mutate(
      () => true, // Matcher toutes les clés
      undefined,  // Pas de nouvelles données
      { revalidate: false } // Ne pas revalider
    );

    // Effacer le sessionStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });

    console.log('[AUTH] ✅ Déconnexion effectuée - Caches SWR et sessionStorage effacés');
  },

  /**
   * Récupère l'utilisateur courant
   * @returns {Object|null}
   */
  getCurrentUser: () => {
    const user = sessionStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Récupère le token d'accès
   * @returns {string|null}
   */
  getAccessToken: () => {
    return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Récupère le token de rafraîchissement
   * @returns {string|null}
   */
  getRefreshToken: () => {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Rafraîchit le token d'accès
   * @returns {Promise<string|null>}
   */
  refreshToken: async () => {
    const refresh = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refresh) return null;

    try {
      const response = await axios.post(`${API_URL}/MapApi/token/refresh/`, {
        refresh,
      });
      const { access } = response.data;
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      return access;
    } catch (error) {
      console.error('Token refresh error:', error);
      authService.logout();
      return null;
    }
  },

  /**
   * Demande de réinitialisation du mot de passe (envoi du code par email)
   * @param {string} email - Adresse e-mail de l'utilisateur
   * @returns {Promise<Object>} - { message: string }
   */
  requestPasswordReset: async (email) => {
    try {
      console.log('[AUTH] Demande de réinitialisation pour:', email);
      const response = await axios.post(`${API_URL}/MapApi/password_reset`, { email });
      console.log('[AUTH] Réponse requestPasswordReset:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AUTH] Erreur requestPasswordReset:', error);
      throw error.response?.data || error.message || 'Erreur lors de l\'envoi de l\'e-mail';
    }
  },

  /**
   * Confirme la réinitialisation du mot de passe avec le code reçu par email
   * @param {Object} payload - { email, code, new_password }
   * @returns {Promise<Object>} - { message: string }
   */
  confirmPasswordReset: async ({ email, code, new_password }) => {
    try {
      console.log('[AUTH] Confirmation réinitialisation pour:', email);
      const response = await axios.post(`${API_URL}/MapApi/password_reset/`, {
        email,
        code,
        new_password,
      });
      console.log('[AUTH] Réponse confirmPasswordReset:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AUTH] Erreur confirmPasswordReset:', error);
      throw error.response?.data || error.message || 'Erreur lors de la réinitialisation';
    }
  },

  /**
   * Change le mot de passe de l'utilisateur connecté
   * @param {Object} payload - { old_password, new_password }
   * @returns {Promise<Object>} - { message: string }
   */
  changePassword: async ({ old_password, new_password }) => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('Utilisateur non authentifié');
      }

      console.log('[AUTH] Changement de mot de passe');
      const response = await axios.put(
        `${API_URL}/MapApi/change_password/`,
        { old_password, new_password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('[AUTH] Réponse changePassword:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AUTH] Erreur changePassword:', error);
      throw error.response?.data || error.message || 'Erreur lors du changement de mot de passe';
    }
  },


  /**
   * Crée une instance axios configurée avec le token
   * @returns {AxiosInstance}
   */
  createAuthenticatedAxios: () => {
    const token = authService.getAccessToken();
    return axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
  },
};

export default authService;

