/**
 * Source unique de vérité pour les droits d'accès du dashboard.
 *
 * Règle : c'est `web_role` qui gouverne l'accès aux pages, jamais `org_role`.
 * `org_role` (org_admin | bureau_agent | field_agent) décrit la fonction dans
 * l'organisation — il sert aux libellés affichés et aux payloads d'invitation,
 * pas aux autorisations.
 */

const SUPER_ADMIN = 'super_admin';
const ORG_ADMIN = 'org_admin';
const BUREAU_AGENT = 'bureau_agent';

/** Rôles web autorisés à entrer dans l'application. */
export const ALLOWED_WEB_ROLES = [SUPER_ADMIN, ORG_ADMIN, BUREAU_AGENT];

/** Tous les identifiants de menu, dans l'ordre d'affichage de la sidebar. */
export const NAV_IDS = [
  'dashboard',
  'collaboration',
  'signalements',
  'mes-interventions',
  'organisations',
  'agents',
  'impact',
  'profile',
  'trash',
];

/** Menu réduit : org_admin et bureau_agent. Ni organisations, ni corbeille. */
const RESTRICTED_NAV_IDS = [
  'dashboard',
  'collaboration',
  'signalements',
  'mes-interventions',
  'agents',
  'impact',
  'profile',
];

/** Chemins ouverts à org_admin et bureau_agent. */
const RESTRICTED_PATHS = [
  '/dashboard',
  '/collaboration',
  '/collaboration-detail',
  '/signalements',
  '/mes-interventions',
  '/agents',
  '/profile',
  '/impact',
];

const getWebRole = (user) => user?.web_role ?? null;

export const isSuperAdmin = (user) => getWebRole(user) === SUPER_ADMIN;

export const isKnownWebRole = (user) => ALLOWED_WEB_ROLES.includes(getWebRole(user));

/**
 * Identifiants de menu visibles pour cet utilisateur.
 * @returns {string[]} vide si le rôle est inconnu
 */
export const getAccessibleNavIds = (user) => {
  if (!isKnownWebRole(user)) return [];
  return isSuperAdmin(user) ? NAV_IDS : RESTRICTED_NAV_IDS;
};

/**
 * Cet utilisateur peut-il ouvrir ce chemin ?
 * La comparaison se fait par segment : '/incidents-archives' ne passe pas
 * pour une autorisation sur '/incidents'.
 */
export const canAccessPath = (user, path) => {
  if (!isKnownWebRole(user)) return false;
  if (isSuperAdmin(user)) return true;
  return RESTRICTED_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  );
};
