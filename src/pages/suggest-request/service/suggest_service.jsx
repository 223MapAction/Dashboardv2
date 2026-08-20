import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

// ─────────────────────────────────────────────────────────
// SUGGESTIONS DE PARTENAIRES (NOUVEAUX ENDPOINTS)
// ─────────────────────────────────────────────────────────

/**
 * 1. Lister les suggestions d'un incident
 * GET /MapApi/incidents/<incident_id>/suggestions/
 * Auth : leader ou contributeur de l'incident
 * @param {number|string} incidentId
 * @param {Object} [params] - Filtres optionnels { status: 'pending'|'accepted'|'rejected' }
 * @returns {Promise<Array>}
 */
export const listIncidentSuggestionsService = async (incidentId, params = {}) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/`, { params });
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[Suggestion] Erreur liste suggestions:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * 2. Créer une suggestion (inviter une org)
 * POST /MapApi/incidents/<incident_id>/suggestions/
 * Auth : leader ou contributeur
 * @param {number|string} incidentId
 * @param {{
 *   suggested_organisation?: string,
 *   suggested_partner?: string,
 *   suggested_role: 'contributor' | 'observer',
 *   justification: string
 * }} data
 * @returns {Promise<Object>}
 */
export const createSuggestionService = async (incidentId, data) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.post(`${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/`, data);
        return response?.data || {};
    } catch (error) {
        logger.error('[Suggestion] Erreur création suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * 3. Détail d'une suggestion
 * GET /MapApi/incidents/<incident_id>/suggestions/<pk>/
 * Auth : collaborateur de l'incident
 * @param {number|string} incidentId
 * @param {number|string} suggestionId
 * @returns {Promise<Object>}
 */
export const getSuggestionDetailService = async (incidentId, suggestionId) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/${suggestionId}/`);
        return response?.data || {};
    } catch (error) {
        logger.error('[Suggestion] Erreur détail suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * 4. Accepter une suggestion
 * POST /MapApi/incidents/<incident_id>/suggestions/<pk>/accept/
 * Auth : l'org invitée (suggested_partner), le leader, ou super admin
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
        logger.error('[Suggestion] Erreur acceptation suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * 5. Refuser une suggestion
 * POST /MapApi/incidents/<incident_id>/suggestions/<pk>/reject/
 * Auth : l'org invitée (suggested_partner), le leader, ou super admin
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
        logger.error('[Suggestion] Erreur rejet suggestion:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * 6. Mes suggestions REÇUES (je suis l'org invitée)
 * GET /MapApi/my-suggestions/received/
 * @param {Object} [params] - Filtres optionnels { status: 'pending'|'accepted'|'rejected' }
 * @returns {Promise<Array>}
 */
export const getMyReceivedSuggestionsService = async (params = {}) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/my-suggestions/received/`, { params });
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[Suggestion] Erreur suggestions reçues:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

/**
 * Mes suggestions reçues en attente (raccourci)
 * @returns {Promise<Array>}
 */
export const getMyPendingReceivedSuggestionsService = async () => {
    return getMyReceivedSuggestionsService({ status: 'pending' });
};

/**
 * 7. Mes suggestions ENVOYÉES (je les ai créées)
 * GET /MapApi/my-suggestions/sent/
 * @param {Object} [params] - Filtres optionnels { status: 'pending'|'accepted'|'rejected' }
 * @returns {Promise<Array>}
 */
export const getMySentSuggestionsService = async (params = {}) => {
    try {
        const axios = authService.createAuthenticatedAxios();
        const response = await axios.get(`${API_URL_BASE}/MapApi/my-suggestions/sent/`, { params });
        return response?.data?.results || response?.data || [];
    } catch (error) {
        logger.error('[Suggestion] Erreur suggestions envoyées:', error?.response?.status, error?.response?.data);
        throw error;
    }
};

// ─────────────────────────────────────────────────────────
// SERVICES DE COLLABORATION (COMPATIBILITÉ)
// ─────────────────────────────────────────────────────────

/**
 * Lister les collaborations
 * GET /MapApi/collaboration/
 * @param {Object} [params]
 * @returns {Promise<Array>}
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
 * Accepter une demande de collaboration
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
 * Rejeter une collaboration
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

/**
 * Alias pour compatibilité avec l'ancien code
 */
export const getPartnerSuggestionService = getSuggestionDetailService;
export const createPartnerSuggestionService = createSuggestionService;

export default {
    // Nouveaux endpoints de suggestions
    listIncidentSuggestionsService,
    createSuggestionService,
    getSuggestionDetailService,
    acceptPartnerSuggestionService,
    rejectPartnerSuggestionService,
    getMyReceivedSuggestionsService,
    getMyPendingReceivedSuggestionsService,
    getMySentSuggestionsService,
    
    // Services de collaboration
    listDemandeDeCollaborationsService,
    getCollaborationDashboardService,
    acceptCollaborationService,
    rejectCollaborationService,
    
    // Alias pour compatibilité
    getPartnerSuggestionService,
    createPartnerSuggestionService,
};
