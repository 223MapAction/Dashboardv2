import { ROLES } from './data/agents';

export { ROLES };

export const getRoleConfig = (roleId) =>
  ROLES.find((r) => r.id === roleId) || { id: roleId, label: roleId, color: '#9CA3AF' };

/**
 * Ordre d'affichage des groupes : la hiérarchie opérationnelle, pas l'ordre
 * alphabétique. Un coordinateur cherche d'abord qui est sur le terrain.
 */
export const ORDRE_GROUPES = ['terrain', 'bureau', 'admin'];

export const LIBELLES_GROUPES = {
  terrain: 'Sur le terrain',
  bureau: 'Bureau',
  admin: 'Administration',
};

/** Regroupe les agents par rôle, dans l'ordre opérationnel, sans groupe vide. */
export const grouperParRole = (agents = []) =>
  ORDRE_GROUPES
    .map((role) => ({
      role,
      libelle: LIBELLES_GROUPES[role] || role,
      agents: agents.filter((a) => a.role === role),
    }))
    .filter((g) => g.agents.length > 0);
