import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';
import { logger } from '../../../utils/logger';

const DISCUSSION_URL = 'discussion';

/**
 * Récupère les messages de discussion d'un incident avec pagination
 * @param {number} incidentId - ID de l'incident
 * @param {Object} options - Options de pagination
 * @param {number} [options.limit] - Nombre de messages à récupérer (par défaut: tous)
 * @param {number} [options.before] - ID du message avant lequel récupérer (pour charger les messages plus anciens)
 * @returns {Promise<Object>} { results: Array, has_more: boolean, next_before: number|null }
 */
export const getDiscussionMessagesService = async (incidentId, options = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    
    // Construire les paramètres de requête
    const params = {};
    if (options.limit) {
      params.limit = options.limit;
    }
    if (options.before) {
      params.before = options.before;
    }
    
    const response = await axios.get(`${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/`, { params });

    const data = response?.data;

    // 1. La réponse est directement un tableau (format legacy le plus simple)
    if (Array.isArray(data)) {
      return { results: data, has_more: false, next_before: null };
    }

    // 2. La réponse est un objet : extraire le tableau de messages quelle que soit la clé
    if (data && typeof data === 'object') {
      let results = [];
      if (Array.isArray(data.results)) {
        results = data.results;
      } else if (Array.isArray(data.messages)) {
        results = data.messages;
      } else if (Array.isArray(data.data)) {
        results = data.data;
      }

      // has_more : explicite, sinon déduit de la pagination DRF (next non nul)
      const has_more = typeof data.has_more === 'boolean'
        ? data.has_more
        : Boolean(data.next);

      // next_before : explicite, sinon l'ID du plus ancien message chargé
      const next_before = data.next_before != null
        ? data.next_before
        : (results.length > 0 ? results[0]?.id ?? null : null);

      return { results, has_more, next_before };
    }

    logger.warn('[Discussion] Format de réponse inattendu, retour vide:', data);
    return { results: [], has_more: false, next_before: null };
  } catch (error) {
    logger.error('[Discussion] Erreur récupération messages:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Envoie un message texte dans la discussion
 * @param {number} incidentId - ID de l'incident
 * @param {Object} data - Données du message
 * @param {string} data.message - Contenu du message
 * @param {number} [data.recipient] - ID du destinataire (optionnel)
 * @returns {Promise<Object>} Message créé
 */
export const sendTextMessageService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/`,
      {
        message: data.message,
        ...(data.recipient && { recipient: data.recipient })
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('[Discussion] Erreur envoi message texte:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Envoie un message audio dans la discussion
 * @param {number} incidentId - ID de l'incident
 * @param {Object} data - Données du message
 * @param {File} data.audio - Fichier audio (mp3, wav, etc.)
 * @param {number} [data.recipient] - ID du destinataire (optionnel)
 * @returns {Promise<Object>} Message créé
 */
export const sendAudioMessageService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    const formData = new FormData();
    formData.append('audio', data.audio);
    if (data.recipient) {
      formData.append('recipient', data.recipient);
    }

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('[Discussion] Erreur envoi message audio:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Envoie un fichier joint dans la discussion
 * @param {number} incidentId - ID de l'incident
 * @param {Object} data - Données du message
 * @param {File} data.attachment - Fichier joint (pdf, doc, docx, xls, xlsx)
 * @param {number} [data.recipient] - ID du destinataire (optionnel)
 * @returns {Promise<Object>} Message créé
 */
export const sendAttachmentMessageService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    const formData = new FormData();
    formData.append('attachment', data.attachment);
    if (data.recipient) {
      formData.append('recipient', data.recipient);
    }

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('[Discussion] Erreur envoi fichier joint:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Envoie un message avec texte et fichier joint
 * @param {number} incidentId - ID de l'incident
 * @param {Object} data - Données du message
 * @param {string} [data.message] - Contenu du message (optionnel)
 * @param {File} [data.attachment] - Fichier joint (optionnel)
 * @param {File} [data.audio] - Fichier audio (optionnel)
 * @param {number} [data.recipient] - ID du destinataire (optionnel)
 * @returns {Promise<Object>} Message créé
 */
export const sendMessageService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    // Si c'est un message texte simple
    if (data.message && !data.attachment && !data.audio) {
      return await sendTextMessageService(incidentId, data);
    }

    // Si c'est un fichier audio
    if (data.audio) {
      return await sendAudioMessageService(incidentId, data);
    }

    // Si c'est un fichier joint (avec ou sans message)
    if (data.attachment) {
      const formData = new FormData();
      formData.append('attachment', data.attachment);
      if (data.message) {
        formData.append('message', data.message);
      }
      if (data.recipient) {
        formData.append('recipient', data.recipient);
      }

      const response = await axios.post(
        `${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    }

    throw new Error('Au moins un des champs message/audio/attachment est requis');
  } catch (error) {
    logger.error('[Discussion] Erreur envoi message:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Modifier un message de discussion
 * PATCH /MapApi/discussion/<incidentId>/<messageId>/
 * @param {string} incidentId - ID de l'incident
 * @param {string} messageId - ID du message
 * @param {string} message - Nouveau contenu du message
 * @returns {Promise<Object>} Message modifié
 */
export const updateDiscussionMessageService = async (incidentId, messageId, message) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.patch(
      `${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/${messageId}/`,
      { message },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    logger.error('[Discussion] Erreur modification message:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Supprimer un message de discussion
 * DELETE /MapApi/discussion/<incidentId>/<messageId>/
 * @param {string} incidentId - ID de l'incident
 * @param {string} messageId - ID du message
 * @returns {Promise<void>}
 */
export const deleteDiscussionMessageService = async (incidentId, messageId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    await axios.delete(`${API_URL_BASE}/MapApi/${DISCUSSION_URL}/${incidentId}/${messageId}/`);
  } catch (error) {
    logger.error('[Discussion] Erreur suppression message:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Génère une couleur déterministe à partir d'une chaîne (ID ou nom)
 * @param {string} str - Chaîne de référence (senderId, senderName)
 * @returns {string} Couleur HSL
 */
const generateAvatarColor = (str) => {
  if (!str) return 'var(--color-text-secondary)';
  const strVal = String(str);
  let hash = 0;
  for (let i = 0; i < strVal.length; i++) {
    hash = strVal.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
};

/**
 * Formate un message pour l'affichage
 * @param {Object} message - Message brut de l'API
 * @returns {Object} Message formaté
 */
export const formatMessage = (message) => {
  if (!message) return null;

  const currentUser = authService.getCurrentUser();
  const currentUserId = currentUser?.id;

  let senderId = null;
  let senderName = '';
  let senderOrgName = '';
  let senderInitials = 'U';
  let senderAvatar = '';
  let isMe = false;

  if (message.sender && typeof message.sender === 'object') {
    senderId = message.sender.id;
    const firstName = message.sender.first_name || '';
    const lastName = message.sender.last_name || '';
    senderName = `${firstName} ${lastName}`.trim() || `Utilisateur #${senderId}`;
    senderOrgName = message.sender.organisation_name || '';
    senderAvatar = message.sender.avatar || '';

    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    senderInitials = (first + last).toUpperCase() || 'U';
    isMe = currentUserId ? (senderId === currentUserId) : (message.is_me || false);
  } else {
    senderId = message.sender;
    senderName = message.sender_name || `Utilisateur #${senderId}`;
    senderOrgName = message.sender_organisation_name || '';
    senderAvatar = message.sender_avatar || '';
    senderInitials = message.sender_initials || 'U';
    isMe = message.is_me || false;
  }

  let file = null;
  if (message.attachment) {
    const urlWithoutQuery = message.attachment.split('?')[0];
    const rawName = message.attachment_name || urlWithoutQuery.split('/').pop() || 'Fichier joint';
    const cleanName = decodeURIComponent(rawName);
    file = {
      name: cleanName,
      size: 0,
      type: urlWithoutQuery.toLowerCase().endsWith('.pdf') ? 'pdf' : '',
      url: message.attachment
    };
  }

  return {
    id: message.id,
    senderId,
    senderName,
    senderOrgName,
    senderAvatar,
    senderInitials,
    senderColor: message.sender_color || generateAvatarColor(senderId || senderName),
    message: message.message || '',
    audio: message.audio || null,
    attachment: message.attachment || null,
    attachmentName: message.attachment_name || null,
    file,
    recipient: message.recipient || null,
    timestamp: message.created_at,
    isMe,
    createdAt: message.created_at
  };
};

/**
 * Filtre les messages par destinataire
 * @param {Array} messages - Liste des messages
 * @param {number} recipientId - ID du destinataire
 * @returns {Array} Messages filtrés
 */
export const filterMessagesByRecipient = (messages, recipientId) => {
  if (!recipientId) return messages;
  return messages.filter(msg => msg.recipient === recipientId || msg.sender === recipientId);
};

/**
 * Groupe les messages par date
 * @param {Array} messages - Liste des messages
 * @returns {Object} Messages groupés par date
 */
export const groupMessagesByDate = (messages) => {
  if (!messages || messages.length === 0) return {};

  return messages.reduce((acc, message) => {
    const date = new Date(message.timestamp || message.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (!acc[date]) {
      acc[date] = [];
    }

    acc[date].push(message);
    return acc;
  }, {});
};

/**
 * Suggère une organisation partenaire pour une collaboration
 * @param {number} incidentId - ID de la collaboration
 * @param {Object} data - Données de la suggestion
 * @param {string} data.suggested_organisation - UUID de l'organisation
 * @param {string} data.suggested_role - 'contributor' | 'observer'
 * @param {string} data.justification - Motif de la suggestion
 * @returns {Promise<Object>} Résultat de la suggestion
 */
export const suggestCollaborationPartnerService = async (incidentId, data) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/suggestions/`,
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    logger.error('[Collaboration] Erreur suggestion:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Récupère les organisations autres que celle de l'utilisateur
 * GET /MapApi/organisations/others/
 * @param {Object} [params]
 * @param {number} [params.page] - Numéro de page
 * @param {number} [params.page_size] - Nombre d'éléments par page
 * @param {string} [params.search] - Terme de recherche
 * @returns {Promise<Object>} Liste paginée des organisations
 */
export const getOtherOrganisationsService = async (params = {}) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(
      `${API_URL_BASE}/MapApi/organisations/others/`,
      { params }
    );
    return response.data;
  } catch (error) {
    logger.error('[Organisations] Erreur récupération autres organisations:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

export default {
  getDiscussionMessagesService,
  sendTextMessageService,
  sendAudioMessageService,
  sendAttachmentMessageService,
  sendMessageService,
  updateDiscussionMessageService,
  deleteDiscussionMessageService,
  formatMessage,
  filterMessagesByRecipient,
  groupMessagesByDate,
  suggestCollaborationPartnerService,
  getOtherOrganisationsService
};
