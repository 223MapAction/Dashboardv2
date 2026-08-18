/**
 * Utilitaires pour calculer les statistiques des signalements
 */
import { gravite, repartitionGravite } from './gravite';

/**
 * Détermine la gravité d'un signalement.
 *
 * Ce module en hébergeait sa propre copie, avec ses propres seuils. Il ne fait
 * plus que réexporter la définition commune : deux implémentations d'une même
 * règle finissent toujours par diverger, et c'est exactement ce qui s'était
 * produit ici (>= 4 pour « moyen », contre >= 3 sur la page Impact).
 *
 * @param {Object} signalement
 * @returns {'high'|'medium'|'low'}
 */
export const getSeverity = gravite;

/**
 * Normalise les signalements (gère les formats array ou objet avec results)
 * @param {Array|Object} signalements - Les signalements à normaliser
 * @returns {Array} Tableau d'signalements non supprimés
 */
export const normalizeSignalements = (signalements) => {
  const data = Array.isArray(signalements)
    ? signalements
    : (signalements && Array.isArray(signalements.results) ? signalements.results : []);
  return data.filter(inc => !inc.is_deleted);
};

/**
 * Calcule les statistiques par statut
 * @param {Array} signalements - Liste des signalements
 * @returns {Object} { total, resolved, inProgress, unresolved }
 */
export const calculateStatusStats = (signalements) => {
  const normalized = normalizeSignalements(signalements);
  
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
 * @param {Array} signalements - Liste des signalements
 * @param {number} limit - Nombre de résultats à retourner (défaut: 5)
 * @returns {Array} [{ name, count }]
 */
export const calculateLocationStats = (signalements, limit = 5) => {
  const normalized = normalizeSignalements(signalements);
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
 * Calcule le top des signalements par type
 * @param {Array} signalements - Liste des signalements
 * @param {number} limit - Nombre de résultats à retourner (défaut: 5)
 * @returns {Array} [{ name, count, percentage }]
 */
export const calculateTopSignalements = (signalements, limit = 5) => {
  const normalized = normalizeSignalements(signalements);
  const categoryMap = {};
  
  normalized.forEach(inc => {
    const category = inc.title || 'Signalement anonyme';
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
 * @param {Array} signalements - Liste des signalements
 * @returns {Object} { high: {count, percentage}, medium: …, low: … }
 */
export const calculateSeverityStats = (signalements) =>
  repartitionGravite(normalizeSignalements(signalements));

/**
 * Calcule toutes les statistiques en une seule fois
 * @param {Array} signalements - Liste des signalements
 * @returns {Object} Objet contenant toutes les statistiques
 */
export const calculateAllStats = (signalements) => {
  return {
    status: calculateStatusStats(signalements),
    locations: calculateLocationStats(signalements),
    topSignalements: calculateTopSignalements(signalements),
    severity: calculateSeverityStats(signalements)
  };
};

export default {
  getSeverity,
  normalizeSignalements,
  calculateStatusStats,
  calculateLocationStats,
  calculateTopSignalements,
  calculateSeverityStats,
  calculateAllStats
};
