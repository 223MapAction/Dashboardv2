import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

// ─────────────────────────────────────────────────────────
// SUGGESTIONS DE PARTENAIRES
// ─────────────────────────────────────────────────────────

/**
 * Lister les suggestions de partenaires pour un incident
 * GET /MapApi/incidents/<incident_id>/suggestions/
 * @param {number|string} incidentId
 * @returns {Promise<Array>}
 */
export const listPartnerSuggestionsService = async (params = {}) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaboration/`, {
            params: { scope: 'received', ...params }
        });
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[PartnerSuggestion] Erreur liste suggestions:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Suggérer un partenaire pour collaboration sur un incident
 * POST /MapApi/incidents/<incident_id>/suggestions/
 * @param {number|string} incidentId
 * @param {{
 *   suggested_organisation: string,
 *   suggested_role?: 'leader' | 'contributor' | 'observer',
 *   justification?: string
 * }} data
 * @returns {Promise<Object>}
 */
export const createPartnerSuggestionService = async (incidentId, data) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.post(`${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/`, data);
        return response?.data || {};
    } catch (error) {
        logger.error('[PartnerSuggestion] Erreur création suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Détails d'une suggestion de partenaire
 * GET /MapApi/incidents/<incident_id>/suggestions/<suggestion_id>/
 * @param {number|string} incidentId
 * @param {number|string} suggestionId
 * @returns {Promise<Object>}
 */
export const getPartnerSuggestionService = async (incidentId, suggestionId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/`);
        return response?.data || {};
    } catch (error) {
        logger.error('[PartnerSuggestion] Erreur détail suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }

};

/**
 * Accepter une suggestion de partenaire
 * POST /MapApi/incidents/<incident_id>/suggestions/<suggestion_id>/accept/
 * @param {number|string} incidentId
 * @param {number|string} suggestionId
 * @returns {Promise<Object>}
 */
export const acceptPartnerSuggestionService = async (incidentId, suggestionId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.post(
            `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/accept/`
        );
        return response?.data || {};
    } catch (error) {
        logger.error('[PartnerSuggestion] Erreur acceptation suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Rejeter une suggestion de partenaire
 * POST /MapApi/incidents/<incident_id>/suggestions/<suggestion_id>/reject/
 * @param {number|string} incidentId
 * @param {number|string} suggestionId
 * @returns {Promise<Object>}
 */
export const rejectPartnerSuggestionService = async (incidentId, suggestionId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.post(
            `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/reject/`
        );
        return response?.data || {};
    } catch (error) {
        logger.error('[PartnerSuggestion] Erreur rejet suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Lister mes suggestions de partenaires reçues en attente
 * GET /MapApi/my-suggestions/received/?status=pending
 * @returns {Promise<Array>}
 */
export const getMyPendingReceivedSuggestionsService = async () => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/my-suggestions/received/?status=pending`);
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[PartnerSuggestion] Erreur suggestions reçues en attente:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Lister mes collaborations acceptées en cours (non terminées)
 * GET /MapApi/collaborations/dashboard/?status=in-progress
 * @returns {Promise<Array>}
 */
export const getMyActiveCollaborationsService = async () => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaborations/dashboard/?status=in-progress`);
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[Collaboration] Erreur collabs en cours:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Lister mes invitations à collaborer (en attente) en tant que contributeur
 * GET /MapApi/collaboration/?status=pending&role=contributor
 * @returns {Promise<Array>}
 */
export const getMyPendingContributorInvitationsService = async () => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaboration/?status=pending&role=contributor`);
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[Collaboration] Erreur invitations en attente:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Lister les suggestions acceptées pour un incident spécifique
 * GET /MapApi/incidents/<incidentId>/suggestions/?status=accepted
 * @param {number|string} incidentId
 * @returns {Promise<Array>}
 */
export const getAcceptedIncidentSuggestionsService = async (incidentId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/?status=accepted`);
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error(`[PartnerSuggestion] Erreur suggestions acceptées incident ${incidentId}:`, error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Lister toutes mes collaborations sur un incident spécifique
 * GET /MapApi/collaboration/?incident_id=<incidentId>
 * @param {number|string} incidentId
 * @returns {Promise<Array>}
 */
export const getIncidentCollaborationsService = async (incidentId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaboration/?incident_id=${incidentId}`);
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error(`[Collaboration] Erreur collabs incident ${incidentId}:`, error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Liste paginée des collaborations de l'utilisateur (les siennes + celles dont il est leader)
 * GET /MapApi/collaboration/
 * @param {Object} [params]
 * @param {string} [params.status] - pending | accepted | declined
 * @param {string} [params.role] - leader | contributor | observer
 * @param {number|string} [params.incident_id]
 * @param {number} [params.page]
 * @param {number} [params.page_size]
 * @returns {Promise<Object>}
 */
export const listDemandeDeCollaborationsService = async (params = {}) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaboration/`, { params });
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[Collaboration] Erreur liste collaborations:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Vue dashboard enrichie avec filtres avancés et recherche
 * GET /MapApi/collaborations/dashboard/
 * @param {Object} [params]
 * @param {string} [params.status] - all | in-progress | completed | pending | accepted | declined
 * @param {string} [params.date_from] - YYYY-MM-DD
 * @param {string} [params.date_to] - YYYY-MM-DD
 * @param {string} [params.search]
 * @returns {Promise<Object>}
 */
export const getCollaborationDashboardService = async (params = {}) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaborations/dashboard/`, { params });
        return response?.data;
    } catch (error) {
        logger.error('[Collaboration] Erreur dashboard:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Détail d'une collaboration
 * GET /MapApi/collaboration/{id}/
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getCollaborationDetailService = async (id) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/collaboration/${id}/`);
        return response?.data || {};
    } catch (error) {
        logger.error('[Collaboration] Erreur détail collaboration:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Modification d'une collaboration (motivation, end_date)
 * PATCH /MapApi/collaboration/{id}/
 * @param {number|string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateCollaborationDetailService = async (id, data) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.patch(`${API_URL_BASE}/MapApi/collaboration/${id}/`, data);
        return response?.data || {};
    } catch (error) {
        logger.error('[Collaboration] Erreur modification collaboration:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Suppression d'une collaboration
 * DELETE /MapApi/collaboration/{id}/
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const deleteCollaborationDetailService = async (id) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.delete(`${API_URL_BASE}/MapApi/collaboration/${id}/`);
        return response?.data || {};
    } catch (error) {
        logger.error('[Collaboration] Erreur suppression collaboration:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Accepter une demande pending
 * POST /MapApi/collaboration/{collaboration_id}/accept/
 * @param {number|string} collaborationId
 * @returns {Promise<Object>}
 */
export const acceptCollaborationService = async (collaborationId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.post(`${API_URL_BASE}/MapApi/collaboration/${collaborationId}/accept/`);
        return response?.data || {};
    } catch (error) {
        logger.error('[Collaboration] Erreur acceptation collaboration:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Rejeter/retirer une collaboration
 * POST /MapApi/collaboration/{collaboration_id}/reject/
 * @param {number|string} collaborationId
 * @returns {Promise<Object>}
 */
export const rejectCollaborationService = async (collaborationId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.post(`${API_URL_BASE}/MapApi/collaboration/${collaborationId}/reject/`);
        return response?.data || {};
    } catch (error) {
        logger.error('[Collaboration] Erreur rejet collaboration:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

export default {
    listPartnerSuggestionsService,
    createPartnerSuggestionService,
    getPartnerSuggestionService,
    acceptPartnerSuggestionService,
    rejectPartnerSuggestionService,
    getMyPendingReceivedSuggestionsService,
    getMyActiveCollaborationsService,
    getMyPendingContributorInvitationsService,
    getAcceptedIncidentSuggestionsService,
    getIncidentCollaborationsService,
    listDemandeDeCollaborationsService,
    getCollaborationDashboardService,
    getCollaborationDetailService,
    updateCollaborationDetailService,
    deleteCollaborationDetailService,
    acceptCollaborationService,
    rejectCollaborationService,
};
