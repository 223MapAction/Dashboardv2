import { describe, it, expect } from 'vitest';
import {
  formatFailureReason,
  formatDateTime,
  formatEtat,
  getEtatBadgeClass,
  formatStatus,
  getStatusBadgeClass,
  formatRole,
  getRoleBadgeClass,
} from './formatage';

describe('formatFailureReason', () => {
  // L'API renvoie parfois la raison d'echec brute, sous la forme du dictionnaire
  // Python qui l'a produite. Sans ce demelage, l'agent lit
  // « {'failure_reason': 'Zone inaccessible'} » a l'ecran.
  it('extrait la raison d’un dictionnaire Python à quotes simples', () => {
    expect(formatFailureReason("{'failure_reason': 'Zone inaccessible'}")).toBe('Zone inaccessible');
  });

  it('extrait la raison d’un objet JSON', () => {
    expect(formatFailureReason('{"failure_reason": "Pluie battante"}')).toBe('Pluie battante');
  });

  it('aplatit les autres formes d’objet plutôt que de les afficher brutes', () => {
    expect(formatFailureReason("{'a': ['x', 'y']}")).toBe('x, y');
  });

  it('laisse intacte une phrase déjà lisible', () => {
    expect(formatFailureReason('Le pont est coupé')).toBe('Le pont est coupé');
  });

  it('rend une chaîne vide quand il n’y a pas de raison', () => {
    expect(formatFailureReason(null)).toBe('');
    expect(formatFailureReason('')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('rend le jour, le mois et l’heure', () => {
    const rendu = formatDateTime('2026-03-04T09:05:00Z');
    expect(rendu).toMatch(/mars/);
    expect(rendu).toMatch(/à/);
  });

  it('rend une chaîne vide sans date', () => {
    expect(formatDateTime(null)).toBe('');
  });

  it('rend une chaîne vide sur une date invalide', () => {
    // Une date illisible ne doit jamais produire « Invalid Date » a l'ecran.
    expect(formatDateTime('pas-une-date')).toBe('');
  });
});

describe('libellés d’état', () => {
  it('traduit les états connus', () => {
    expect(formatEtat('declared')).toBe('Déclaré');
    expect(formatEtat('taken_into_account')).toBe('Pris en compte');
    expect(formatEtat('in_progress')).toBe('En cours');
    expect(formatEtat('resolved')).toBe('Résolu');
  });

  it('ne laisse aucun état de l’API s’afficher en anglais', () => {
    // Deux des quatre etats tombaient dans le cas par defaut et sortaient tels
    // quels : « Declared », « In_progress ».
    for (const etat of ['declared', 'taken_into_account', 'in_progress', 'resolved']) {
      expect(formatEtat(etat)).not.toMatch(/^[A-Z][a-z]*_?[a-z]*$/);
    }
  });

  it('rend lisible un état inconnu plutôt que de le masquer', () => {
    // Si l'API ajoute un etat demain, mieux vaut l'afficher capitalise que
    // laisser un blanc dans l'interface.
    expect(formatEtat('archive')).toBe('Archive');
  });

  it('annonce l’absence d’état', () => {
    expect(formatEtat(null)).toBe('Inconnu');
  });
});

describe('libellés de statut de collaboration', () => {
  it('traduit les trois statuts de l’API', () => {
    expect(formatStatus('accepted')).toBe('Acceptée');
    expect(formatStatus('pending')).toBe('En attente');
    expect(formatStatus('rejected')).toBe('Refusée');
  });

  it('annonce l’absence de statut', () => {
    expect(formatStatus(null)).toBe('Inconnu');
  });
});

describe('libellés de rôle', () => {
  it('traduit les trois rôles', () => {
    expect(formatRole('leader')).toBe('Leader');
    expect(formatRole('contributeur')).toBe('Contributeur');
    expect(formatRole('observateur')).toBe('Observateur');
  });
});

describe('classes de badge', () => {
  // Ces fonctions decident d'une couleur. Le contrat qui compte : une valeur
  // inconnue ne doit jamais rendre `undefined`, sinon le badge perd tout style
  // et devient illisible.
  it('donnent toujours une classe, même pour une valeur inconnue', () => {
    for (const f of [getEtatBadgeClass, getStatusBadgeClass, getRoleBadgeClass]) {
      expect(f('valeur-inattendue')).toMatch(/^badge-/);
      expect(f(null)).toMatch(/^badge-/);
    }
  });

  it('distinguent le résolu, l’accepté et le leader', () => {
    expect(getEtatBadgeClass('resolved')).toBe('badge-success');
    expect(getStatusBadgeClass('rejected')).toBe('badge-danger');
    expect(getRoleBadgeClass('leader')).toBe('badge-warning');
  });
});
