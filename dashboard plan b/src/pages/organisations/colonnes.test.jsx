// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ResponsiveTable } from '../../components/molecules/ResponsiveTable';
import { COLONNES_ORGANISATIONS, mediaOrganisation, libelleSecteur, libelleType, libellePays } from './colonnes';

/**
 * Ces colonnes n'etaient pas testables tant qu'elles vivaient dans le
 * composant — et la page n'est visible qu'avec un compte super_admin, ce qui
 * la rendait aussi invisible au navigateur. C'est le trou de couverture que
 * l'extraction ferme.
 */

let compact = false;
window.matchMedia = (media) => ({
  media, get matches() { return compact; },
  addEventListener: () => {}, removeEventListener: () => {},
});

const ORG = {
  id: 'o1',
  name: 'DRACPN Bandiagara',
  acronym: 'DRACPN',
  type: 'ngo',
  sector: 'environment',
  city: 'Bandiagara',
  country: 'mali',
  activeProjects: 7,
  membersCount: 1234,
  status: 'active',
  color: '#3AA2DD',
  logo_url: '',
};

const rendre = (donnees = [ORG]) =>
  render(
    <ResponsiveTable
      colonnes={COLONNES_ORGANISATIONS}
      donnees={donnees}
      cleDe={(o) => o.id}
      media={mediaOrganisation}
      libelleListe="Organisations"
    />
  );

afterEach(() => { cleanup(); compact = false; });

describe('structure des colonnes', () => {
  it('donne à chaque colonne un id unique, une en-tête et un rendu', () => {
    const ids = COLONNES_ORGANISATIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of COLONNES_ORGANISATIONS) {
      expect(c.entete, `colonne ${c.id}`).toBeTruthy();
      expect(typeof c.rendu, `colonne ${c.id}`).toBe('function');
    }
  });

  it("n'utilise que des priorités connues de ResponsiveTable", () => {
    const connues = ['titre', 'sousTitre', 'marquant', 'detail', 'bloc'];
    for (const c of COLONNES_ORGANISATIONS) {
      expect(connues, `colonne ${c.id}`).toContain(c.priorite || 'detail');
    }
  });

  it('a exactement un titre — une carte n’en porte qu’un', () => {
    expect(COLONNES_ORGANISATIONS.filter((c) => c.priorite === 'titre')).toHaveLength(1);
  });
});

describe('rendu en tableau', () => {
  it('affiche les six colonnes et les valeurs de l’organisation', () => {
    rendre();
    expect(screen.getAllByRole('columnheader')).toHaveLength(6);
    const texte = document.body.textContent;
    expect(texte).toContain('DRACPN Bandiagara');
    expect(texte).toContain('Bandiagara');
    expect(texte).toContain('7');
    expect(texte).toContain('Active');
  });

  it('sépare les milliers du nombre de membres', () => {
    rendre();
    // « 1 234 », jamais « 1234 ». L'espace du francais est insecable (U+202F
    // ou U+00A0 selon le moteur), donc on exige un caractere entre les deux
    // groupes plutot qu'un espace ordinaire — et on refuse explicitement la
    // forme collee, qu'une expression avec `\s?` laisserait passer.
    expect(document.body.textContent).not.toContain('1234');
    expect(document.body.textContent).toMatch(/1[\s  ]234/);
  });
});

describe('rendu en cartes', () => {
  it('place le nom en titre, la ville en sous-titre et le statut en badge', () => {
    compact = true;
    rendre();
    const carte = document.querySelector('.rt-carte');
    expect(carte.querySelector('.orgs-table-org-name').textContent).toBe('DRACPN Bandiagara');
    expect(carte.querySelector('.rt-carte-soustitre').textContent).toContain('Bandiagara');
    expect(carte.querySelector('.rt-carte-marquants').textContent).toContain('Active');
  });

  it('raccourcit le libellé « Signalements prise en compte » sur la carte', () => {
    compact = true;
    rendre();
    const libelles = [...document.querySelectorAll('.rt-paire dt')].map((t) => t.textContent);
    expect(libelles).toContain('Signalements');
    expect(libelles).not.toContain('Signalements prise en compte');
  });

  it('ne pose un bandeau que si l’organisation a un logo', () => {
    compact = true;
    rendre();
    expect(document.querySelector('.rt-carte-media')).toBeNull();

    cleanup();
    rendre([{ ...ORG, logo_url: '/logo.png' }]);
    expect(document.querySelector('.rt-carte-media')).toBeTruthy();
  });

  it('perd aucune valeur par rapport au tableau', () => {
    const valeurs = ['DRACPN Bandiagara', 'Bandiagara', 'Active'];

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

describe('traductions', () => {
  it('rend le libellé français d’un code connu', () => {
    expect(libellePays('mali')).toBe('Mali');
    expect(libelleType('ngo')).toBeTruthy();
    expect(libelleSecteur('environment')).toBeTruthy();
  });

  it('laisse passer une valeur inconnue plutôt que de la vider', () => {
    expect(libellePays('atlantide')).toBe('atlantide');
  });

  it('rend une chaîne vide pour une valeur absente', () => {
    expect(libellePays('')).toBe('');
    expect(libellePays(undefined)).toBe('');
  });
});

describe('données incomplètes', () => {
  it('ne casse sur aucune colonne quand les champs manquent', () => {
    const vide = { id: 'o2', status: 'inactive' };
    for (const c of COLONNES_ORGANISATIONS) {
      expect(() => c.rendu(vide), `colonne ${c.id}`).not.toThrow();
      if (c.renduCarte) expect(() => c.renduCarte(vide), `colonne ${c.id}`).not.toThrow();
    }
  });

  it('affiche la carte sans ville ni pays sans laisser de virgule orpheline', () => {
    compact = true;
    rendre([{ ...ORG, city: '', country: '' }]);
    expect(document.querySelector('.rt-carte-soustitre').textContent.trim()).toBe('');
  });
});
