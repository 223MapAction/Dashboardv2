import { describe, it, expect } from 'vitest';
import {
  getAccessibleNavIds,
  canAccessPath,
  isSuperAdmin,
  isKnownWebRole,
} from './permissions';

const superAdmin = { web_role: 'super_admin', org_role: 'bureau_agent' };
const orgAdmin = { web_role: 'org_admin', org_role: 'org_admin' };
const bureau = { web_role: 'bureau_agent', org_role: 'field_agent' };
const fieldOnly = { web_role: 'field_agent', org_role: 'field_agent' };

describe('isKnownWebRole', () => {
  it('accepte les trois rôles web autorisés', () => {
    expect(isKnownWebRole(superAdmin)).toBe(true);
    expect(isKnownWebRole(orgAdmin)).toBe(true);
    expect(isKnownWebRole(bureau)).toBe(true);
  });

  it('refuse un rôle inconnu ou un utilisateur absent', () => {
    expect(isKnownWebRole(fieldOnly)).toBe(false);
    expect(isKnownWebRole(null)).toBe(false);
    expect(isKnownWebRole({})).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  it('ne se base que sur web_role, jamais sur org_role', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(isSuperAdmin({ web_role: 'org_admin', org_role: 'super_admin' })).toBe(false);
  });
});

describe('getAccessibleNavIds', () => {
  it('donne les 9 entrées au super_admin', () => {
    expect(getAccessibleNavIds(superAdmin)).toHaveLength(9);
    expect(getAccessibleNavIds(superAdmin)).toContain('trash');
    expect(getAccessibleNavIds(superAdmin)).toContain('organisations');
  });

  it('donne 7 entrées à org_admin et bureau_agent, sans trash ni organisations', () => {
    for (const user of [orgAdmin, bureau]) {
      const ids = getAccessibleNavIds(user);
      expect(ids).toHaveLength(7);
      expect(ids).not.toContain('trash');
      expect(ids).not.toContain('organisations');
    }
  });

  it('ignore org_role : un super_admin avec org_role bureau_agent garde tout', () => {
    expect(getAccessibleNavIds(superAdmin)).toHaveLength(9);
  });

  it('ne donne rien à un rôle inconnu', () => {
    expect(getAccessibleNavIds(fieldOnly)).toEqual([]);
    expect(getAccessibleNavIds(null)).toEqual([]);
  });
});

describe('canAccessPath', () => {
  it('ouvre tout au super_admin', () => {
    expect(canAccessPath(superAdmin, '/trash')).toBe(true);
    expect(canAccessPath(superAdmin, '/organisations')).toBe(true);
  });

  it('refuse trash et organisations à org_admin', () => {
    expect(canAccessPath(orgAdmin, '/trash')).toBe(false);
    expect(canAccessPath(orgAdmin, '/organisations')).toBe(false);
  });

  it('autorise les sous-chemins des routes permises', () => {
    expect(canAccessPath(orgAdmin, '/incidents/42')).toBe(true);
    expect(canAccessPath(orgAdmin, '/collaboration-detail/7')).toBe(true);
  });

  it('ne confond pas un préfixe avec un segment de chemin', () => {
    expect(canAccessPath(orgAdmin, '/incidents-archives')).toBe(false);
  });

  it('refuse tout à un rôle inconnu', () => {
    expect(canAccessPath(fieldOnly, '/dashboard')).toBe(false);
  });
});
