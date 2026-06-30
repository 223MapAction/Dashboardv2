import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';


const COLLABORATION_URL = "collaboration"
/**
 * Récupère toutes les collaborations de l'utilisateur
 * @returns {Promise<Array>} Liste des collaborations
 */
export const getCollaborationsService = async (params = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/collaborations/dashboard/`, {
      params: { scope: 'self', ...params }
    });

    console.log('[Collaboration] Collaborations récupérées:', response.data);
    return response?.data;
  } catch (error) {
    console.error('[Collaboration] Erreur récupération collaborations:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Récupère les détails d'une collaboration spécifique
 * @param {number} id - ID de la collaboration
 * @returns {Promise<Object>} Détails de la collaboration
 */
export const getCollaborationService = async (id) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/${COLLABORATION_URL}/${id}/`);

    console.log('[Collaboration] Collaboration récupérée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Collaboration] Erreur récupération collaboration:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Crée une demande de collaboration sur un incident
 * @param {Object} collaborationData - Données de la collaboration
 * @param {number} collaborationData.incident_id - ID de l'incident (requis)
 * @param {string} collaborationData.motivation - Motivation de la demande
 * @param {string} collaborationData.role - Rôle demandé (contributor|observer, default: contributor)
 * @returns {Promise<Object>} Collaboration créée
 */
export const createCollaborationService = async (collaborationData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${COLLABORATION_URL}/`,
      collaborationData
    );

    console.log('[Collaboration] Collaboration créée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Collaboration] Erreur création collaboration:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Accepte une demande de collaboration (leader uniquement)
 * @param {number} id - ID de la collaboration
 * @returns {Promise<Object>} Collaboration acceptée
 */
export const acceptCollaborationService = async (id) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${COLLABORATION_URL}/${id}/accept/`
    );

    console.log('[Collaboration] Collaboration acceptée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Collaboration] Erreur acceptation collaboration:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Rejette une demande de collaboration (leader uniquement)
 * @param {number} id - ID de la collaboration
 * @returns {Promise<Object>} Collaboration rejetée
 */
export const rejectCollaborationService = async (id) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${COLLABORATION_URL}/${id}/reject/`
    );

    console.log('[Collaboration] Collaboration rejetée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Collaboration] Erreur rejet collaboration:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

// ========================
// ORGANISATIONS - MEMBRES
// ========================

/**
 * Récupère la liste des membres d'une organisation
 * @param {number} orgId - ID de l'organisation
 * @returns {Promise<Array>} Liste des membres
 */
export const getOrganisationMembersService = async (orgId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/organisations/${orgId}/members/`
    );

    console.log('[Organisation] Membres récupérés:', response.data);
    return response?.data?.results || response?.data || [];
  } catch (error) {
    console.error('[Organisation] Erreur récupération membres:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Ajoute un membre à une organisation
 * @param {number} orgId - ID de l'organisation
 * @param {Object} memberData - Données du membre
 * @param {number} memberData.user_id - ID de l'utilisateur (requis)
 * @param {string} memberData.org_role - Rôle (org_admin|bureau_agent|field_agent, requis)
 * @returns {Promise<Object>} Membre ajouté
 */
export const addOrganisationStaffMemberService = async (orgId, memberData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/organisations/${orgId}/members/add/`,
      memberData
    );

    console.log('[Organisation] Membre ajouté:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Organisation] Erreur ajout membre:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Modifie le rôle d'un membre dans une organisation
 * @param {number} orgId - ID de l'organisation
 * @param {number} userId - ID de l'utilisateur
 * @param {Object} roleData - Données du rôle
 * @param {string} roleData.org_role - Nouveau rôle (org_admin|bureau_agent|field_agent, requis)
 * @returns {Promise<Object>} Membre mis à jour
 */
export const updateOrganisationMemberService = async (orgId, userId, roleData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.put(
      `${API_URL_BASE}/MapApi/organisations/${orgId}/members/${userId}/`,
      roleData
    );

    console.log('[Organisation] Rôle membre mis à jour:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Organisation] Erreur mise à jour membre:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Retire un membre d'une organisation
 * @param {number} orgId - ID de l'organisation
 * @param {number} userId - ID de l'utilisateur à retirer
 * @returns {Promise<Object>} Confirmation de suppression
 */
export const removeOrganisationMemberService = async (orgId, userId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.delete(
      `${API_URL_BASE}/MapApi/organisations/${orgId}/members/${userId}/`
    );

    console.log('[Organisation] Membre retiré:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Organisation] Erreur suppression membre:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

// ========================
// RAPPORTS DE TERRAIN
// ========================

/**
 * Crée un rapport de terrain pour un incident
 * @param {Object} reportData - Données du rapport (FormData recommandé pour les photos)
 * @param {number} reportData.incident_id - ID de l'incident (requis)
 * @param {string} reportData.visited_at - Date/heure de visite (requis)
 * @param {string} [reportData.notes] - Notes du rapport
 * @param {File} [reportData.photos] - Photo(s) jointe(s)
 * @param {string} [reportData.location_lat] - Latitude
 * @param {string} [reportData.location_lng] - Longitude
 * @returns {Promise<Object>} Rapport créé
 */
export const createFieldReportService = async (reportData) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    // Si reportData contient des fichiers, on utilise FormData
    let payload = reportData;
    let headers = {};

    if (reportData instanceof FormData) {
      headers = { 'Content-Type': 'multipart/form-data' };
    } else if (reportData.photos instanceof File) {
      const formData = new FormData();
      Object.entries(reportData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      payload = formData;
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/field-reports/`,
      payload,
      { headers }
    );

    console.log('[FieldReport] Rapport créé:', response.data);
    return response.data;
  } catch (error) {
    console.error('[FieldReport] Erreur création rapport:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Récupère la liste des rapports de terrain
 * @param {Object} [filters] - Filtres optionnels
 * @param {number} [filters.incident_id] - Filtrer par incident
 * @param {number} [filters.agent_id] - Filtrer par agent
 * @returns {Promise<Array>} Liste des rapports
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
 * Filtre les collaborations par statut
 * @param {Array} collaborations - Liste des collaborations
 * @param {string} status - Statut (pending|accepted|rejected)
 * @returns {Array} Collaborations filtrées
 */
export const filterCollaborationsByStatus = (collaborations, status) => {
  if (!status) return collaborations;
  return collaborations.filter(collab => collab.status === status);
};

/**
 * Filtre les collaborations par rôle
 * @param {Array} collaborations - Liste des collaborations
 * @param {string} role - Rôle (leader|contributor|observer)
 * @returns {Array} Collaborations filtrées
 */
export const filterCollaborationsByRole = (collaborations, role) => {
  if (!role) return collaborations;
  return collaborations.filter(collab => collab.role === role);
};

/**
 * Filtre les collaborations par incident
 * @param {Array} collaborations - Liste des collaborations
 * @param {number} incidentId - ID de l'incident
 * @returns {Array} Collaborations filtrées
 */
export const filterCollaborationsByIncident = (collaborations, incidentId) => {
  if (!incidentId) return collaborations;
  return collaborations.filter(collab => collab.incident === incidentId || collab.incidentId === incidentId);
};

/**
 * Formate une collaboration pour l'affichage
 * @param {Object} collaboration - Données brutes de la collaboration
 * @returns {Object} Collaboration formatée
 */
export const formatCollaboration = (collaboration) => {
  if (!collaboration) return null;

  return {
    id: collaboration.id,
    incidentId: collaboration.incident, // ID de l'incident (number)
    userId: collaboration.user, // ID de l'utilisateur (number)
    role: collaboration.role,
    roleLabel: getRoleLabel(collaboration.role),
    roleColor: getRoleColor(collaboration.role),
    status: collaboration.status,
    statusLabel: getStatusLabel(collaboration.status),
    statusColor: getStatusColor(collaboration.status),
    motivation: collaboration.motivation,
    otherOption: collaboration.other_option,
    endDate: collaboration.end_date,
    createdAt: collaboration.created_at
  };
};

/**
 * Obtient le libellé d'un rôle
 * @param {string} role - Rôle de la collaboration
 * @returns {string} Libellé traduit
 */
const getRoleLabel = (role) => {
  const labels = {
    leader: 'Leader',
    contributor: 'Contributeur',
    observer: 'Observateur'
  };
  return labels[role] || role;
};

/**
 * Obtient la couleur associée à un rôle
 * @param {string} role - Rôle de la collaboration
 * @returns {string} Code couleur
 */
const getRoleColor = (role) => {
  const colors = {
    leader: '#F59E0B',      // orange (warning)
    contributor: '#3AA2DD',  // bleu (primary)
    observer: '#6C7278'      // gris
  };
  return colors[role] || '#6C7278';
};

/**
 * Obtient le libellé d'un statut
 * @param {string} status - Statut de la collaboration
 * @returns {string} Libellé traduit
 */
const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Rejetée'
  };
  return labels[status] || status;
};

/**
 * Obtient la couleur associée à un statut
 * @param {string} status - Statut de la collaboration
 * @returns {string} Code couleur
 */
const getStatusColor = (status) => {
  const colors = {
    pending: '#F59E0B',   // orange (warning)
    accepted: '#22C55E',  // vert (success)
    rejected: '#EF4444'   // rouge (danger)
  };
  return colors[status] || '#6C7278';
};

/**
 * Calcule les statistiques des collaborations
 * @param {Array} collaborations - Liste des collaborations
 * @returns {Object} Statistiques
 */
export const getCollaborationsStats = (collaborations) => {
  if (!collaborations || collaborations.length === 0) {
    return {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      asLeader: 0,
      asContributor: 0,
      asObserver: 0
    };
  }

  return {
    total: collaborations.length,
    pending: collaborations.filter(c => c.status === 'pending').length,
    accepted: collaborations.filter(c => c.status === 'accepted').length,
    rejected: collaborations.filter(c => c.status === 'rejected').length,
    asLeader: collaborations.filter(c => c.role === 'leader').length,
    asContributor: collaborations.filter(c => c.role === 'contributor').length,
    asObserver: collaborations.filter(c => c.role === 'observer').length
  };
};

/**
 * Groupe les collaborations par incident
 * @param {Array} collaborations - Liste des collaborations
 * @returns {Object} Collaborations groupées par incident
 */
export const groupCollaborationsByIncident = (collaborations) => {
  if (!collaborations || collaborations.length === 0) return {};

  return collaborations.reduce((acc, collab) => {
    const incidentId = collab.incident || collab.incidentId;
    if (!incidentId) return acc;

    if (!acc[incidentId]) {
      acc[incidentId] = {
        incidentId: incidentId,
        collaborations: []
      };
    }

    acc[incidentId].collaborations.push(collab);
    return acc;
  }, {});
};

export default {
  // Collaborations
  getCollaborationsService,
  getCollaborationService,
  createCollaborationService,
  acceptCollaborationService,
  rejectCollaborationService,
  filterCollaborationsByStatus,
  filterCollaborationsByRole,
  filterCollaborationsByIncident,
  formatCollaboration,
  getCollaborationsStats,
  groupCollaborationsByIncident,
  // Organisation - Membres
  getOrganisationMembersService,
  addOrganisationStaffMemberService,
  updateOrganisationMemberService,
  removeOrganisationMemberService,
  // Rapports de terrain
  createFieldReportService,
  getFieldReportsService
};
