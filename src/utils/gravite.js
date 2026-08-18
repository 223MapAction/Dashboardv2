/**
 * Échelle de gravité — source unique côté frontend.
 *
 * ── TROIS NIVEAUX, PARCE QUE C'EST CE QUE LE SERVEUR ÉMET ───────────────────
 * `high`, `medium`, `low`. Pas un de plus : l'API en fait foi. Chaque signalement
 * arrive avec un champ `severity` déjà calculé (« severity: "medium" »), et
 * l'endpoint dashboard-stats renvoie un `by_severity` agrégé sur ces trois
 * clés. Le frontend LIT cette décision, il ne la recalcule pas.
 *
 * C'était pourtant ce qu'il faisait, à trois endroits et de trois façons :
 *
 *   MapContainer        3 niveaux, seuils >= 7 / >= 4
 *   signalementStatsHelper 3 niveaux, seuils >= 7 / >= 4      (copie de la 1re)
 *   Impact              4 niveaux, seuils >= 7 / >= 5 / >= 3
 *
 * Un même signalement pouvait donc être « moyen » sur la carte et « élevé » sur
 * Impact — et les deux pouvaient contredire le `severity` du serveur. Le calcul
 * local à partir de `base_severity` ne subsiste ici que comme REPLI, pour les
 * charges utiles où `severity` est absent (certaines réponses de prédiction).
 *
 * Ajouter un palier ici ne suffirait pas à le faire exister : tant que le
 * serveur ne l'émet pas, il resterait vide partout.
 */

/**
 * Du plus grave au moins grave. L'ORDRE FAIT PARTIE DU CONTRAT : les légendes
 * et les listes bouclent dessus, et c'est lui qui garantit qu'aucune vue ne
 * peut présenter les niveaux dans un ordre différent d'une autre.
 *
 * `min` est le seuil bas de `base_severity` (échelle 0 à 10) : un niveau est
 * retenu dès que la valeur l'atteint, en descendant.
 */
export const NIVEAUX_GRAVITE = [
  { cle: 'high', libelle: 'Élevée', min: 7 },
  { cle: 'medium', libelle: 'Moyenne', min: 4 },
  { cle: 'low', libelle: 'Faible', min: -Infinity }
];

export const CLES_GRAVITE = NIVEAUX_GRAVITE.map((n) => n.cle);

/** Le palier le moins grave : le repli quand rien n'est exploitable. */
const CLE_PAR_DEFAUT = 'low';

const LIBELLES = Object.fromEntries(NIVEAUX_GRAVITE.map((n) => [n.cle, n.libelle]));

/** Libellé affichable d'un niveau, ou tiret si la clé est inconnue. */
export const libelleGravite = (cle) => LIBELLES[cle] ?? '—';

/**
 * Variables CSS d'un niveau. Passer par cette fonction plutôt que d'écrire
 * `var(--color-severity-${cle})` à la main garde le nommage des jetons
 * modifiable depuis un seul endroit.
 */
export const couleurGravite = (cle) => `var(--color-severity-${cle})`;
export const couleurTexteGravite = (cle) => `var(--color-severity-${cle}-text)`;

/**
 * Lit le niveau de gravité d'un signalement.
 *
 * Trois sources, dans l'ordre de confiance :
 *   1. `severity`, la décision du backend — le cas normal ;
 *   2. `base_severity`, la note du modèle de prédiction, quand le serveur n'a
 *      pas tranché (page Impact) ;
 *   3. les badges, pour les charges utiles anciennes qui n'ont ni l'un ni
 *      l'autre.
 *
 * @param {Object} signalement
 * @param {Object} [prediction] détails de prédiction, quand l'appelant les a
 *   déjà sous la main séparément de l'signalement (cas de la page Impact)
 * @returns {'high'|'medium'|'low'}
 */
export const gravite = (signalement, prediction = null) => {
  if (!signalement) return CLE_PAR_DEFAUT;

  // La décision du serveur prime toujours.
  if (CLES_GRAVITE.includes(signalement.severity)) return signalement.severity;

  const note =
    signalement.base_severity ??
    prediction?.base_severity ??
    signalement.incident_details?.prediction_details?.base_severity;

  if (note !== undefined && note !== null) {
    const valeur = parseFloat(note);
    // `parseFloat` rend NaN sur une chaîne vide ou un texte : toute comparaison
    // serait alors fausse et on tomberait en « faible » par accident. On préfère
    // ignorer la note et laisser les badges décider.
    if (!Number.isNaN(valeur)) {
      return (NIVEAUX_GRAVITE.find((n) => valeur >= n.min) ?? NIVEAUX_GRAVITE.at(-1)).cle;
    }
  }

  const badges = (signalement.badges || []).map((b) => b?.variant);
  if (badges.includes('critical') || badges.includes('high') || badges.includes('expert-needed')) return 'high';
  if (badges.includes('in-progress') || badges.includes('medium')) return 'medium';
  return CLE_PAR_DEFAUT;
};

/**
 * Répartition d'une liste d'signalements par niveau.
 * @returns {Object} { high: {count, percentage}, medium: …, low: … }
 */
export const repartitionGravite = (signalements) => {
  const liste = Array.isArray(signalements) ? signalements : [];
  const compteurs = Object.fromEntries(CLES_GRAVITE.map((c) => [c, 0]));

  liste.forEach((inc) => {
    compteurs[gravite(inc)] += 1;
  });

  // Diviser par 0 donnerait NaN% : sur une liste vide, tous les niveaux sont à 0.
  const total = liste.length || 1;

  return Object.fromEntries(
    CLES_GRAVITE.map((c) => [
      c,
      { count: compteurs[c], percentage: Math.round((compteurs[c] / total) * 100) }
    ])
  );
};

/**
 * Lit la répartition renvoyée par l'API (`by_severity`) selon l'échelle.
 *
 * On ne retourne que les niveaux réellement présents dans la réponse, et dans
 * l'ordre de l'échelle : c'est le serveur qui agrège, et une vue qui inventerait
 * un niveau absent afficherait un compte que personne n'a calculé.
 *
 * @returns {Array} [{ cle, libelle, count, percentage }] du plus grave au moins
 */
export const lireRepartitionApi = (parGravite) => {
  if (!parGravite) return [];

  return NIVEAUX_GRAVITE.filter((n) => parGravite[n.cle]).map((n) => ({
    cle: n.cle,
    libelle: n.libelle,
    count: parGravite[n.cle]?.count ?? 0,
    percentage: parGravite[n.cle]?.percentage ?? 0
  }));
};

export default {
  NIVEAUX_GRAVITE,
  CLES_GRAVITE,
  gravite,
  libelleGravite,
  couleurGravite,
  couleurTexteGravite,
  repartitionGravite,
  lireRepartitionApi
};
