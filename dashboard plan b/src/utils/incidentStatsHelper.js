/**
 * Utilitaires pour calculer les statistiques des incidents
 */

/**
 * Détermine la sévérité d'un incident
 * @param {Object} incident - L'incident à analyser
 * @returns {string} 'high' | 'medium' | 'low'
 */
export const getSeverity = (incident) => {
  const baseSeverity = incident.base_severity ?? incident.incident_details?.prediction_details?.base_severity;
  if (baseSeverity !== undefined && baseSeverity !== null) {
    const val = parseFloat(baseSeverity);
    if (val >= 7) return 'high';
    if (val >= 4) return 'medium';
    return 'low';
  }
  const badges = (incident.badges || []).map((b) => b.variant);
  if (badges.includes('critical') || badges.includes('high') || badges.includes('expert-needed')) return 'high';
  if (badges.includes('in-progress') || badges.includes('medium')) return 'medium';
  return 'low';
};

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
 * @returns {Object} { high: {count, percentage}, medium: {count, percentage}, low: {count, percentage} }
 */
export const calculateSeverityStats = (incidents) => {
  const normalized = normalizeIncidents(incidents);
  const severityMap = { high: 0, medium: 0, low: 0 };
  
  normalized.forEach(inc => {
    const severity = getSeverity(inc);
    severityMap[severity]++;
  });
  
  const total = normalized.length || 1;
  
  return {
    high: {
      count: severityMap.high,
      percentage: Math.round((severityMap.high / total) * 100)
    },
    medium: {
      count: severityMap.medium,
      percentage: Math.round((severityMap.medium / total) * 100)
    },
    low: {
      count: severityMap.low,
      percentage: Math.round((severityMap.low / total) * 100)
    }
  };
};

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

/**
 * Affiche les statistiques dans la console de manière formatée
 * @param {Array} incidents - Liste des incidents
 */
export const logStats = (incidents) => {
  const stats = calculateAllStats(incidents);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 STATISTIQUES DES INCIDENTS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('📈 PAR STATUT:');
  console.log(`   Total: ${stats.status.total}`);
  console.log(`   ✅ Résolus: ${stats.status.resolved}`);
  console.log(`   🔄 En cours: ${stats.status.inProgress}`);
  console.log(`   ❌ Non résolus: ${stats.status.unresolved}\n`);
  
  console.log('📍 TOP 5 PAR LOCALITÉ:');
  stats.locations.forEach((loc, idx) => {
    console.log(`   ${idx + 1}. ${loc.name}: ${loc.count} incidents`);
  });
  console.log('');
  
  console.log('🔥 TOP 5 TYPES D\'INCIDENTS:');
  stats.topIncidents.forEach((inc, idx) => {
    console.log(`   ${idx + 1}. ${inc.name}: ${inc.count} (${inc.percentage}%)`);
  });
  console.log('');
  
  console.log('⚠️  PAR GRAVITÉ:');
  console.log(`   🔴 Critique: ${stats.severity.high.count} (${stats.severity.high.percentage}%)`);
  console.log(`   🟠 Grave: ${stats.severity.medium.count} (${stats.severity.medium.percentage}%)`);
  console.log(`   🟡 Modéré: ${stats.severity.low.count} (${stats.severity.low.percentage}%)`);
  
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  return stats;
};

export default {
  getSeverity,
  normalizeIncidents,
  calculateStatusStats,
  calculateLocationStats,
  calculateTopIncidents,
  calculateSeverityStats,
  calculateAllStats,
  logStats
};
