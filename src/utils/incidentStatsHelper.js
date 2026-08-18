/**
 * Utilitaires pour calculer les statistiques des incidents
 */
import { gravite, repartitionGravite } from './gravite';

/**
 * Détermine la gravité d'un incident.
 *
 * Ce module en hébergeait sa propre copie, avec ses propres seuils. Il ne fait
 * plus que réexporter la définition commune : deux implémentations d'une même
 * règle finissent toujours par diverger, et c'est exactement ce qui s'était
 * produit ici (>= 4 pour « moyen », contre >= 3 sur la page Impact).
 *
 * @param {Object} incident
 * @returns {'high'|'medium'|'low'}
 */
export const getSeverity = gravite;

/**
 * Normalise les incidents (gère les formats array ou objet avec results)
 * @param {Array|Object} incidents - Les incidents à normaliser
 * @returns {Array} Tableau d'incidents non supprimés
 */
export const normalizeIncidents = (incidents) => {
  const data = Array.isArray(incidents)
    ? incidents
    : (incidents && Array.isArray(incidents.results) ? incidents.results : []);
  return data.filter(inc => !inc.is_deleted);
};

/**
 * Calcule les statistiques par statut
 * @param {Array} incidents - Liste des incidents
 * @returns {Object} { total, resolved, inProgress, unresolved }
 */
export const calculateStatusStats = (incidents) => {
  const normalized = normalizeIncidents(incidents);
  
  return {
    total: normalized.length,
    resolved: normalized.filter(inc => inc.etat === 'resolved').length,
    inProgress: normalized.filter(inc => 
      inc.etat === 'taken_into_account' || inc.etat === 'in_progress'
    ).length,
    unresolved: normalized.filter(inc => inc.etat === 'declared').length
  };
};

/**
 * Calcule les statistiques par localité
 * @param {Array} incidents - Liste des incidents
 * @param {number} limit - Nombre de résultats à retourner (défaut: 5)
 * @returns {Array} [{ name, count }]
 */
export const calculateLocationStats = (incidents, limit = 5) => {
  const normalized = normalizeIncidents(incidents);
  const locationMap = {};
  
  normalized.forEach(inc => {
    const zone = inc.zone || 'Non spécifié';
    locationMap[zone] = (locationMap[zone] || 0) + 1;
  });
  
  return Object.entries(locationMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Calcule le top des incidents par type
 * @param {Array} incidents - Liste des incidents
 * @param {number} limit - Nombre de résultats à retourner (défaut: 5)
 * @returns {Array} [{ name, count, percentage }]
 */
export const calculateTopIncidents = (incidents, limit = 5) => {
  const normalized = normalizeIncidents(incidents);
  const categoryMap = {};
  
  normalized.forEach(inc => {
    const category = inc.title || 'Incident anonyme';
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });
  
  const total = normalized.length || 1;
  
  return Object.entries(categoryMap)
    .map(([name, count]) => ({ 
      name: name.toUpperCase(), 
      percentage: Math.round((count / total) * 100),
      count 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Calcule les statistiques par gravité
 * @param {Array} incidents - Liste des incidents
 * @returns {Object} { high: {count, percentage}, medium: …, low: … }
 */
export const calculateSeverityStats = (incidents) =>
  repartitionGravite(normalizeIncidents(incidents));

/**
 * Calcule toutes les statistiques en une seule fois
 * @param {Array} incidents - Liste des incidents
 * @returns {Object} Objet contenant toutes les statistiques
 */
export const calculateAllStats = (incidents) => {
  return {
    status: calculateStatusStats(incidents),
    locations: calculateLocationStats(incidents),
    topIncidents: calculateTopIncidents(incidents),
    severity: calculateSeverityStats(incidents)
  };
};

export default {
  getSeverity,
  normalizeIncidents,
  calculateStatusStats,
  calculateLocationStats,
  calculateTopIncidents,
  calculateSeverityStats,
  calculateAllStats
};
