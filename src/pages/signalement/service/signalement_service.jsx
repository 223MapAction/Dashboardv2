
import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';



const INCIDENT_URL = 'signalement';
const INCIDENTS_URL = 'signalements';

/**
 * Récupère tous les signalements avec pagination
 * @param {number} page - Numéro de page (default: 1)
 * @param {number} pageSize - Taille de la page (default: 10)
 * @returns {Promise<Object>} - { count, next, previous, results }
 */
export const getSignalementsService = async (page = null, pageSize = null, search = '', etat = '') => {
  try {
    const axios = authService.createAuthenticatedAxios();
    
    const params = [];
    if (page !== null && pageSize !== null) {
      params.push(`page=${page}`);
      params.push(`page_size=${pageSize}`);
    } else {
      params.push(`page_size=100`);
    }
    
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }

    if (etat) {
      params.push(`etat=${encodeURIComponent(etat)}`);
    }

    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incident/${queryString}`
    );

    logger.warn('[Signalement]url Signalements récupérés:', `${API_URL_BASE}/MapApi/incident/${queryString}`);
    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur récupération incidents:', error.response?.status, error.response?.data);
    throw error;
  }
};


/**
 * Récupère les signalements résolus
 * @returns {Promise<Object>} - { count, next, previous, results }
 */
export const getResolvedSignalementsService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidentResolved/`
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur récupération signalements résolus:', error.response?.status, error.response?.data);
    throw error;
  }
};


/**
 * Récupère les détails d'un signalement spécifique
 * @param {number} id - ID de l'signalement
 * @returns {Promise<Object>} Détails de l'signalement
 */
export const getSignalementService = async (id) => {
  try {
    const axios = authService.createAuthenticatedAxios();


    const response = await axios.get(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}/${id}`
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur récupération incident:', error.response?.status, error.response?.data);
    throw error;
  }
};


/**
 * Crée un nouvel signalement
 * @param {Object} incidentData - Données de l'signalement
 * @param {string} incidentData.title - Titre
 * @param {string} incidentData.zone - Zone (requis)
 * @param {string} incidentData.description - Description
 * @param {string} incidentData.lattitude - Latitude
 * @param {string} incidentData.longitude - Longitude
 * @param {number} incidentData.category_id - ID de la catégorie
 * @param {number} incidentData.indicateur_id - ID de l'indicateur
 * @param {File} incidentData.photo - Fichier photo
 * @param {File} incidentData.video - Fichier vidéo
 * @param {File} incidentData.audio - Fichier audio
 * @returns {Promise<Object>} Signalement créé
 */
export const createSignalementService = async (incidentData) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    // Créer un FormData pour envoyer les fichiers
    const formData = new FormData();
    Object.keys(incidentData).forEach(key => {
      if (incidentData[key] !== null && incidentData[key] !== undefined) {
        formData.append(key, incidentData[key]);
      }
    });

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur création incident:', error.response?.status, error.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Met à jour un signalement
 * @param {number} id - ID de l'signalement
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Signalement mis à jour
 */
export const updateSignalementService = async (id, updates) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.put(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}s/${id}/`,
      updates
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur mise à jour incident:', error.response?.status, error.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Supprime un signalement (soft delete)
 * @param {number} id - ID de l'signalement
 * @returns {Promise<void>}
 */
export const deleteSignalementService = async (id) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    await axios.delete(`${API_URL_BASE}/MapApi/${INCIDENT_URL}/${id}`);

  } catch (error) {
    logger.error('[Signalement] Erreur suppression incident:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Prendre en charge un signalement (devenir leader)
 * @param {number} signalementId 
 * @returns 
 */
export const takeInChargeSignalementService = async (signalementId, data = null) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}s/${signalementId}/take_in_charge/`,
      data
    );

    return response.data;
  } catch (error) {
    logger.error('[Prise en charge Signalement] Erreur:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les signalements par zone
 * @param {string} zone - Nom de la zone
 * @returns {Promise<Array>} Liste des signalements
 */
export const getSignalementsByZoneService = async (zone) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}/zone/${zone}/`
    );

    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error('[Signalement] Erreur récupération signalements par zone:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les signalements par catégorie
 * @param {number} categoryId - ID de la catégorie
 * @returns {Promise<Array>} Liste des signalements
 */
export const getSignalementsByCategoryService = async (categoryId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}/category/${categoryId}/`
    );

    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error('[Signalement] Erreur récupération signalements par catégorie:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Récupère les signalements de l'organisation
 * @param {string} source - Source des signalements (agents|citizens|all, default: all)
 * @returns {Promise<Array>} Liste des signalements
 */
export const getOrgSignalementsService = async (source = 'agents') => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/org-${INCIDENTS_URL}/`,
      {
        params: { source }
      }
    );

    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error('[Signalement] Erreur récupération signalements organisation:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Bascule la visibilité publique d'un signalement
 * @param {number} signalementId - ID de l'signalement
 * @returns {Promise<Object>} - { status, message, data: { is_public } }
 */
export const togglePublicSignalementService = async (signalementId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${INCIDENTS_URL}/${signalementId}/toggle-public/`
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur basculement visibilité:', error.response?.status, error.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Récupère les assignations d'signalement a un agents
 * @returns {Promise<Array>} 
 */
export const getAssignSignalementToAgentService = async (signalementId = null, data = null) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    if (signalementId) {
      const payload = {
        incident: signalementId,
        user_id: data?.taken_by,
        deadline: data?.deadline,
        ...data
      };
      const response = await axios.post(
        `${API_URL_BASE}/MapApi/agent/assigned-signalements/`,
        payload
      );
      return response.data;
    }

    const response = await axios.get(
      `${API_URL_BASE}/MapApi/agent/assigned-signalements/`
    );

    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error(
      `[Signalement] Erreur ${signalementId ? 'assignation' : 'récupération'} signalements assignés:`,
      error.response?.status,
      error.response?.data
    );
    throw error;
  }
};
/**
 * Assigne un signalement à un ou plusieurs agents.
 *
 * `signalementId` est obligatoire. La version précédente l'acceptait à null et
 * retombait sur une ligne référençant `response`, variable déclarée dans le
 * bloc `if` : tout appel sans identifiant levait un ReferenceError au lieu
 * d'une erreur exploitable. Reste d'un copier-coller depuis
 * getAssignSignalementToAgentService, dont la branche GET avait été retirée
 * sans son `return`.
 *
 * @param {number|string} signalementId - ID de l'signalement (requis)
 * @param {Object} data - Données d'assignation
 * @returns {Promise<Object>} Assignation créée
 */
export const assignSignalementToAgentService = async (signalementId, data = null) => {
  if (!signalementId) {
    throw new Error('[Signalement] assignSignalementToAgentService : signalementId est requis');
  }

  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/assignments/`,
      data
    );
    return response.data;
  } catch (error) {
    logger.error(
      '[Signalement] Erreur assignation incident:',
      error.response?.status,
      error.response?.data
    );
    throw error;
  }
};

/**
 * Récupère les assignations (agents assignés) d'un signalement spécifique
 * @param {number} signalementId - ID de l'signalement
 * @returns {Promise<Array>} Liste des assignations
 */
export const getSignalementAssignmentsService = async (signalementId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/incidents/${signalementId}/assignments/`
    );
    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error(
      `[Signalement] Erreur récupération assignations pour l'signalement ${signalementId}:`,
      error.response?.status,
      error.response?.data
    );
    throw error;
  }
};

/**
 * Clôture un signalement (leader uniquement)
 * @param {number} signalementId - ID de l'signalement
 * @param {Object} data - { resolution_start_date, resolution_end_date }
 * @returns {Promise<Object>} Signalement clôturé
 */
export const closeSignalementService = async (signalementId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    let payload = data;
    let headers = {};

    if (data && data.resolution_file) {
      const formData = new FormData();
      formData.append('resolution_start_date', data.resolution_start_date);
      formData.append('resolution_end_date', data.resolution_end_date);
      formData.append('resolution_file', data.resolution_file);
      payload = formData;
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}s/${signalementId}/close/`,
      payload,
      { headers }
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur clôture incident:', error.response?.status, error.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Récupère les signalements supprimés (corbeille)
 * @returns {Promise<Array>} Liste des signalements supprimés
 */
export const getTrashSignalementsService = async () => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/${INCIDENTS_URL}/trash/`
    );

    return response.data?.results || response.data || [];
  } catch (error) {
    logger.error('[Signalement] Erreur récupération corbeille:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Restaure un signalement supprimé
 * @param {number} signalementId - ID de l'signalement
 * @returns {Promise<Object>} Signalement restauré
 */
export const restoreSignalementService = async (signalementId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${INCIDENT_URL}/${signalementId}/restore/`
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur restauration incident:', error.response?.status, error.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Récupère les prédictions d'un signalement spécifique
 * @param {number|string} id - ID de l'signalement
 * @returns {Promise<Object>} Prédictions de l'signalement
 */
export const getSignalementPredictionService = async (id) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/Incidentprediction/${id}/`
    );

    return response.data;
  } catch (error) {
    logger.error('[Signalement] Erreur récupération prédiction:', error.response?.status, error.response?.data);
    throw error;
  }
};

/**
 * Formate un signalement pour l'affichage
 * @param {Object} signalement - Données brutes de l'signalement
 * @returns {Object} Signalement formaté
 */
export const formatSignalement = (signalement) => {
  if (!signalement) return null;

  return {
    id: signalement.id,
    title: signalement.title,
    zone: signalement.zone,
    description: signalement.description,
    etat: signalement.etat,
    etatLabel: getEtatLabel(signalement.etat),
    progress: signalement.progress || 0,
    isPublic: signalement.is_public,
    isDeleted: signalement.is_deleted,
    createdAt: signalement.created_at,
    photo: signalement.photo,
    video: signalement.video,
    audio: signalement.audio,
    category: signalement.category,
    takenBy: signalement.taken_by,
    userId: signalement.user_id,
    resolutionStartDate: signalement.resolution_start_date,
    resolutionEndDate: signalement.resolution_end_date,
    reportedByAgent: signalement.reported_by_agent
  };
};

/**
 * Obtient le libellé d'un état
 * @param {string} etat - État de l'signalement
 * @returns {string} Libellé traduit
 */
const getEtatLabel = (etat) => {
  const labels = {
    declared: 'Déclaré',
    taken_into_account: 'Pris en compte',
    in_progress: 'En cours',
    resolved: 'Résolu'
  };
  return labels[etat] || etat;
};

export default {
  getSignalementsService,
  getResolvedSignalementsService,
  getSignalementService,
  getSignalementPredictionService,
  createSignalementService,
  updateSignalementService,
  deleteSignalementService,
  getSignalementsByZoneService,
  getSignalementsByCategoryService,
  getOrgSignalementsService,
  togglePublicSignalementService,
  assignSignalementToAgentService,
  getSignalementAssignmentsService,
  takeInChargeSignalementService,
  closeSignalementService,
  getTrashSignalementsService,
  restoreSignalementService,
  formatSignalement
};