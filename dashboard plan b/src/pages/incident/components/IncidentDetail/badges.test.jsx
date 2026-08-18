// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  getStatusBadge,
  getModeBadge,
  getUserRoleBadge,
  getCollabBadgeStyle,
  getRoleLabel,
  getStatusLabel,
} from './badges';

describe('badge d’état', () => {
  it('distingue « résolu par moi » de « résolu »', () => {
    // Un agent doit voir d'un coup d'oeil si c'est lui qui a cloture le
    // signalement ou quelqu'un d'autre.
    expect(getStatusBadge({ etat: 'resolved', isOwner: true }).label).toMatch(/Moi/);
    expect(getStatusBadge({ etat: 'resolved', isOwner: false }).label).not.toMatch(/Moi/);
  });

  it('donne toujours un libellé et une couleur, même sur un état inconnu', () => {
    // Sans repli, le badge se rendrait vide et sans style : une ligne de
    // tableau muette, impossible a interpreter.
    const badge = getStatusBadge({ etat: 'etat_ajoute_demain' });
    expect(badge.label).toBeTruthy();
    expect(badge.color).toBeTruthy();
  });
});

describe('badge de mode de prise en charge', () => {
  it('sépare le mode interne du mode collaboratif', () => {
    const interne = getModeBadge({ take_in_charge_mode: 'internal' });
    const collab = getModeBadge({ take_in_charge_mode: 'collaborative' });
    expect(interne.label).not.toBe(collab?.label);
  });
});

describe('badge de rôle', () => {
  it('n’affiche rien quand l’utilisateur n’a pas de rôle', () => {
    expect(getUserRoleBadge({})).toBeNull();
  });

  it('accepte les deux orthographes renvoyées par l’API', () => {
    // L'API melange l'anglais et le francais selon les endpoints.
    expect(getUserRoleBadge({ role: 'observer' })).not.toBeNull();
    expect(getUserRoleBadge({ role: 'observateur' })).not.toBeNull();
    expect(getUserRoleBadge({ role: 'contributor' })).not.toBeNull();
    expect(getUserRoleBadge({ role: 'contributeur' })).not.toBeNull();
  });
});

describe('style de badge de collaboration', () => {
  it('donne trois jeux de couleurs distincts', () => {
    const accepte = getCollabBadgeStyle('accepted');
    const attente = getCollabBadgeStyle('pending');
    const refuse = getCollabBadgeStyle('rejected');
    expect(new Set([accepte.color, attente.color, refuse.color]).size).toBe(3);
  });

  it('traite « in-progress » comme accepté et « refused » comme rejeté', () => {
    expect(getCollabBadgeStyle('in-progress')).toEqual(getCollabBadgeStyle('accepted'));
    expect(getCollabBadgeStyle('refused')).toEqual(getCollabBadgeStyle('rejected'));
  });

  it('ne rend jamais de couleur indéfinie', () => {
    for (const statut of [undefined, null, '', 'inconnu']) {
      const style = getCollabBadgeStyle(statut);
      expect(style.color).toBeTruthy();
      expect(style.bg).toBeTruthy();
      expect(style.border).toBeTruthy();
    }
  });

  it('n’utilise que des jetons du système de design', () => {
    for (const statut of ['accepted', 'pending', 'rejected', 'inconnu']) {
      const style = getCollabBadgeStyle(statut);
      expect(style.color).toMatch(/^var\(--/);
      expect(style.bg).toMatch(/var\(--rgb-/);
      expect(style.border).toMatch(/var\(--rgb-/);
    }
  });
});

describe('libellés', () => {
  it('traduit les rôles dans les deux orthographes', () => {
    expect(getRoleLabel('contributor')).toBe('Contributeur');
    expect(getRoleLabel('contributeur')).toBe('Contributeur');
    expect(getRoleLabel('observer')).toBe('Observateur');
    expect(getRoleLabel('leader')).toBe('Leader');
  });

  it('traduit les statuts de collaboration', () => {
    expect(getStatusLabel('accepted')).toBe('Acceptée');
    expect(getStatusLabel('in-progress')).toBe('Acceptée');
    expect(getStatusLabel('pending')).toBe('En attente');
    expect(getStatusLabel('refused')).toBe('Refusée');
  });

  it('rend une chaîne vide plutôt que « undefined »', () => {
    expect(getRoleLabel(null)).toBe('');
    expect(getStatusLabel(undefined)).toBe('');
  });
});
