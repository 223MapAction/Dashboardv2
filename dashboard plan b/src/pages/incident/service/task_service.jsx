import { authService } from '../../auth/services/authService';
import { API_URL_BASE } from '../../../config/api_url_base';

/**
 * Récupère toutes les tâches d'un incident
 * @param {number} incidentId - ID de l'incident
 * @returns {Promise<Array>} Liste des tâches
 */
export const getTasksService = async (incidentId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/`);

    console.log('[Task] Tâches récupérées:', response.data);
    return response?.data?.results || response?.data || [];
  } catch (error) {
    console.error('[Task] Erreur récupération tâches:', error?.response?.status, error?.response?.data);
    throw error;
  }
  
};

/**
 * Récupère les détails d'une tâche spécifique
 * @param {number} incidentId - ID de l'incident
 * @param {number} taskId - ID de la tâche
 * @returns {Promise<Object>} Détails de la tâche
 */
export const getTaskService = async (incidentId, taskId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.get(`${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/${taskId}/`);

    console.log('[Task] Tâche récupérée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Task] Erreur récupération tâche:', error?.response?.status, error?.response?.data);
    throw error;
  }
};

/**
 * Crée une nouvelle tâche pour un incident
 * @param {number} incidentId - ID de l'incident
 * @param {Object} taskData - Données de la tâche
 * @param {string} taskData.title - Titre de la tâche (requis)
 * @param {string} taskData.description - Description de la tâche
 * @param {string} taskData.start_date - Date de début
 * @param {string} taskData.end_date - Date de fin
 * @param {number} taskData.assigned_to - ID de l'utilisateur assigné
 * @returns {Promise<Object>} Tâche créée
 */
export const createTaskService = async (incidentId, taskData) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/`,
      taskData
    );

    console.log('[Task] Tâche créée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Task] Erreur création tâche:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Marque une tâche comme terminée
 * @param {number} incidentId - ID de l'incident
 * @param {number} taskId - ID de la tâche
 * @param {File} proofs - Fichier de preuve (image/vidéo) - requis
 * @returns {Promise<Object>} Tâche mise à jour
 */
export const completeTaskService = async (incidentId, taskId, proofs) => {
  try {
    const axios = authService.createAuthenticatedAxios();

    let formData;
    if (proofs instanceof FormData) {
      formData = proofs;
    } else {
      formData = new FormData();
      if (proofs) {
        if (proofs.type && proofs.type.startsWith('video/')) {
          formData.append('proof_video', proofs);
        } else {
          formData.append('proof_image', proofs);
        }
      }
    }

    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/${taskId}/complete/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('[Task] Tâche complétée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Task] Erreur complétion tâche:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Marque une tâche comme échouée
 * @param {number} incidentId - ID de l'incident
 * @param {number} taskId - ID de la tâche
 * @param {string} failureReason - Raison de l'échec (requis)
 * @returns {Promise<Object>} Tâche mise à jour
 */
export const failTaskService = async (incidentId, taskId, failureReason) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.post(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/${taskId}/fail/`,
      { failure_reason: failureReason }
    );

    console.log('[Task] Tâche marquée comme échouée:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Task] Erreur échec tâche:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Met à jour une tâche (fonction générique)
 * @param {number} incidentId - ID de l'incident
 * @param {number} taskId - ID de la tâche
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} Tâche mise à jour
 */
export const updateTaskService = async (incidentId, taskId, updates) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    const response = await axios.patch(
      `${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/${taskId}/`,
      updates
    );

    console.log('[Task] Tâche mise à jour:', response.data);
    return response.data;
  } catch (error) {
    console.error('[Task] Erreur mise à jour tâche:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Supprime une tâche
 * @param {number} incidentId - ID de l'incident
 * @param {number} taskId - ID de la tâche
 * @returns {Promise<void>}
 */
export const deleteTaskService = async (incidentId, taskId) => {
  try {
    const axios = authService.createAuthenticatedAxios();
    await axios.delete(`${API_URL_BASE}/MapApi/incidents/${incidentId}/tasks/${taskId}/`);

    console.log('[Task] Tâche supprimée:', taskId);
  } catch (error) {
    console.error('[Task] Erreur suppression tâche:', error?.response?.status, error?.response?.data);
    throw error?.response?.data || error;
  }
};

/**
 * Filtre les tâches par état
 * @param {Array} tasks - Liste des tâches
 * @param {string} state - État (pending|in_progress|done|failed)
 * @returns {Array} Tâches filtrées
 */
export const filterTasksByState = (tasks, state) => {
  if (!state) return tasks;
  return tasks.filter(task => task.state === state);
};

/**
 * Filtre les tâches assignées à un utilisateur
 * @param {Array} tasks - Liste des tâches
 * @param {number} userId - ID de l'utilisateur
 * @returns {Array} Tâches filtrées
 */
export const filterTasksByAssignee = (tasks, userId) => {
  if (!userId) return tasks;
  return tasks.filter(task => task.assigned_to?.id === userId);
};

/**
 * Formate une tâche pour l'affichage
 * @param {Object} task - Données brutes de la tâche
 * @returns {Object} Tâche formatée
 */
export const formatTask = (task) => {
  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    state: task.state,
    stateLabel: getStateLabel(task.state),
    startDate: task.start_date,
    endDate: task.end_date,
    assignedTo: task.assigned_to,
    createdBy: task.created_by,
    proofs: task.proofs,
    failureReason: task.failure_reason,
    incident: task.incident,
    // Calcul du statut de la date
    isOverdue: task.end_date && new Date(task.end_date) < new Date() && task.state !== 'done',
    daysRemaining: task.end_date ? Math.ceil((new Date(task.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
  };
};

/**
 * Obtient le libellé d'un état
 * @param {string} state - État de la tâche
 * @returns {string} Libellé traduit
 */
const getStateLabel = (state) => {
  const labels = {
    pending: 'En attente',
    in_progress: 'En cours',
    done: 'Terminée',
    failed: 'Échouée'
  };
  return labels[state] || state;
};

/**
 * Calcule les statistiques des tâches
 * @param {Array} tasks - Liste des tâches
 * @returns {Object} Statistiques
 */
export const getTasksStats = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      done: 0,
      failed: 0,
      completionRate: 0
    };
  }

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.state === 'pending').length,
    inProgress: tasks.filter(t => t.state === 'in_progress').length,
    done: tasks.filter(t => t.state === 'done').length,
    failed: tasks.filter(t => t.state === 'failed').length
  };

  stats.completionRate = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  return stats;
};

export default {
  getTasksService,
  getTaskService,
  createTaskService,
  completeTaskService,
  failTaskService,
  updateTaskService,
  deleteTaskService,
  filterTasksByState,
  filterTasksByAssignee,
  formatTask,
  getTasksStats
};
