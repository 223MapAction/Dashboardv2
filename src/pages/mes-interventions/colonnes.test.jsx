// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ResponsiveTable } from '../../components/molecules/ResponsiveTable';
import { creerColonnesInterventions, mediaIntervention } from './colonnes';

/**
 * Neuf colonnes : c'est la liste qui souffrait le plus du defilement
 * horizontal. Elle n'a aucune intervention assignee sur le compte de test,
 * donc elle ne se voit pas dans le navigateur ; c'est ici qu'elle se verifie.
 *
 * `RenduEquipe` est injecte plutot qu'importe : le vrai composant tire des
 * donnees et un contexte de modale. Un faux suffit a verifier qu'il est
 * appele avec le bon signalement.
 */

let compact = false;
window.matchMedia = (media) => ({
  media, get matches() { return compact; },
  addEventListener: () => {}, removeEventListener: () => {},
});

const EquipeFactice = ({ signalement }) => <span>équipe:{signalement.id}</span>;

const INTERVENTION = {
  id: 'i1',
  title: 'Berge polluée',
  description: 'Déchets plastiques accumulés sur la berge du fleuve.',
  location: 'Ségou',
  image: '/photo.jpg',
  startDate: '12 juil. 2026',
  endDate: 'En cours',
  progressValue: 60,
  take_in_charge_mode: 'internal',
  reports_count: 2,
  badge: { label: 'PRIS EN COMPTE', variant: 'taken' },
  badgeLabel: 'PRIS EN COMPTE',
  badgeVariant: 'taken',
};

const rendre = (donnees = [INTERVENTION], surRapports = () => {}) => {
  const colonnes = creerColonnesInterventions({
    onOuvrirRapports: surRapports,
    RenduEquipe: EquipeFactice,
  });
  return { colonnes, ...render(
    <ResponsiveTable
      colonnes={colonnes}
      donnees={donnees}
      cleDe={(i) => i.id}
      media={mediaIntervention}
      libelleListe="Mes interventions"
    />
  ) };
};

const colonnes = () => creerColonnesInterventions({ onOuvrirRapports: () => {}, RenduEquipe: EquipeFactice });

afterEach(() => { cleanup(); compact = false; });

describe('structure des colonnes', () => {
  it('décrit les neuf colonnes, avec des ids uniques', () => {
    const c = colonnes();
    expect(c).toHaveLength(9);
    const ids = c.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('donne à chacune une en-tête et un rendu', () => {
    for (const c of colonnes()) {
      expect(c.entete, `colonne ${c.id}`).toBeTruthy();
      expect(typeof c.rendu, `colonne ${c.id}`).toBe('function');
    }
  });

  it("n'utilise que des priorités connues de ResponsiveTable", () => {
    const connues = ['titre', 'sousTitre', 'marquant', 'detail', 'bloc'];
    for (const c of colonnes()) {
      expect(connues, `colonne ${c.id}`).toContain(c.priorite || 'detail');
    }
  });

  it('a exactement un titre — une carte n’en porte qu’un', () => {
    expect(colonnes().filter((c) => c.priorite === 'titre')).toHaveLength(1);
  });
});

describe('rendu en tableau', () => {
  it('affiche les neuf en-têtes', () => {
    rendre();
    expect(screen.getAllByRole('columnheader')).toHaveLength(9);
  });

  it('affiche le titre, le lieu et les dates', () => {
    rendre();
    const t = document.body.textContent;
    expect(t).toContain('Berge polluée');
    expect(t).toContain('Ségou');
    expect(t).toContain('12 juil. 2026');
  });
});

describe('rendu en cartes', () => {
  it('met le titre en tête et le lieu en sous-titre', () => {
    compact = true;
    rendre();
    const carte = document.querySelector('.rt-carte');
    expect(carte.textContent).toContain('Berge polluée');
    expect(carte.querySelector('.rt-carte-soustitre').textContent).toContain('Ségou');
  });

  it('ne montre pas la photo deux fois : bandeau OU vignette, pas les deux', () => {
    compact = true;
    rendre();
    const carte = document.querySelector('.rt-carte');
    // Le bandeau porte l'image ; le titre ne doit plus en porter une seconde.
    expect(carte.querySelectorAll('img')).toHaveLength(1);
    expect(carte.querySelector('.rt-carte-media img')).toBeTruthy();
  });

  it('affiche la progression chiffrée à côté de sa barre', () => {
    compact = true;
    rendre();
    expect(document.querySelector('.rt-carte-marquants').textContent).toContain('60%');
  });

  it('pose la photo en bandeau, et rien s’il n’y en a pas', () => {
    compact = true;
    rendre();
    expect(document.querySelector('.rt-carte-media')).toBeTruthy();

    cleanup();
    rendre([{ ...INTERVENTION, image: '' }]);
    expect(document.querySelector('.rt-carte-media')).toBeNull();
  });

  it('range les six colonnes secondaires en paires libellé/valeur', () => {
    compact = true;
    rendre();
    const libelles = [...document.querySelectorAll('.rt-paire dt')].map((t) => t.textContent);
    for (const attendu of ['Mode', 'Date de déclaration', 'Date de résolution', 'Équipe terrain', 'Rapports']) {
      expect(libelles, `« ${attendu} » absent de la carte`).toContain(attendu);
    }
  });

  it('garde progression et statut dans la rangée des badges', () => {
    compact = true;
    rendre();
    const marquants = document.querySelector('.rt-carte-marquants');
    expect(marquants).toBeTruthy();
    expect(marquants.children).toHaveLength(2);
  });
});

describe('cellules qui dépendent de la page', () => {
  it('affiche l’équipe via le composant fourni, avec le bon signalement', () => {
    rendre();
    expect(document.body.textContent).toContain('équipe:i1');
  });

  it('ouvre les rapports du bon signalement au clic', () => {
    let recu = null;
    compact = true;
    rendre([INTERVENTION], (i) => { recu = i.id; });

    const paires = [...document.querySelectorAll('.rt-paire')];
    const paireRapports = paires.find((p) => p.querySelector('dt').textContent === 'Rapports');
    fireEvent.click(paireRapports.querySelector('button'));
    expect(recu).toBe('i1');
  });
});

describe('données incomplètes', () => {
  it('ne casse sur aucune colonne quand les champs manquent', () => {
    const vide = { id: 'i2' };
    for (const c of colonnes()) {
      expect(() => c.rendu(vide), `colonne ${c.id}`).not.toThrow();
      if (c.renduCarte) expect(() => c.renduCarte(vide), `colonne ${c.id}`).not.toThrow();
    }
  });

  it('rend la liste entière sans lever, même sans données utiles', () => {
    compact = true;
    expect(() => rendre([{ id: 'i3' }])).not.toThrow();
    expect(document.querySelectorAll('.rt-carte')).toHaveLength(1);
  });
});

describe('conservation de l’information', () => {
  it('affiche les mêmes valeurs en tableau et en cartes', () => {
    const valeurs = ['Berge polluée', 'Ségou', '12 juil. 2026', 'équipe:i1'];

    compact = false;
    rendre();
    const enTableau = document.body.textContent;
    cleanup();

    compact = true;
    rendre();
    const enCartes = document.body.textContent;

    for (const v of valeurs) {
      expect(enTableau, `« ${v} » manque au tableau`).toContain(v);
      expect(enCartes, `« ${v} » manque aux cartes`).toContain(v);
    }
  });
});
