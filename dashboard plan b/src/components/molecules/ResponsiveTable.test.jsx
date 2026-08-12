// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within, act, cleanup } from '@testing-library/react';
import { ResponsiveTable } from './ResponsiveTable';

/**
 * jsdom n'implemente pas matchMedia. On le remplace par un faux pilotable :
 * `largeurCompacte(true|false)` bascule la valeur ET previent les abonnes,
 * ce qui reproduit exactement ce que fait une rotation de telephone.
 */
let abonnes = [];
let compact = false;

const installerMatchMedia = () => {
  abonnes = [];
  window.matchMedia = (requete) => ({
    media: requete,
    get matches() { return compact; },
    addEventListener: (_, cb) => abonnes.push(cb),
    removeEventListener: (_, cb) => { abonnes = abonnes.filter((a) => a !== cb); },
  });
};

const largeurCompacte = (valeur) => {
  compact = valeur;
  act(() => { abonnes.forEach((cb) => cb({ matches: valeur })); });
};

const DONNEES = [
  {
    id: 'a1',
    nom: 'Eaux très sales',
    lieu: 'Faladie Sema',
    statut: 'Déclaré',
    periode: '11 août 2026 → En cours',
    priseEnCharge: 'Disponible',
    gravite: 'medium',
  },
  {
    id: 'b2',
    nom: 'Décharge sauvage',
    lieu: 'Kolébougou',
    statut: 'Pris en compte',
    periode: '10 juil. 2026 → En cours',
    priseEnCharge: 'DRACPN (Bandiagara)',
    gravite: 'high',
  },
];

const COLONNES = [
  { id: 'nom', entete: 'Signalement', priorite: 'titre', rendu: (d) => <span>{d.nom}</span> },
  { id: 'lieu', entete: 'Localisation', priorite: 'sousTitre', rendu: (d) => <span>{d.lieu}</span> },
  { id: 'periode', entete: 'Période', priorite: 'detail', rendu: (d) => <span>{d.periode}</span> },
  { id: 'statut', entete: 'État', priorite: 'marquant', rendu: (d) => <span>{d.statut}</span> },
  { id: 'pec', entete: 'Prise en charge', priorite: 'bloc', rendu: (d) => <p>{d.priseEnCharge}</p> },
];

const rendre = (props = {}) =>
  render(
    <ResponsiveTable
      colonnes={COLONNES}
      donnees={DONNEES}
      cleDe={(d) => d.id}
      libelleListe="Signalements"
      {...props}
    />
  );

beforeEach(() => { compact = false; installerMatchMedia(); });
afterEach(() => cleanup());

describe('au-dessus du point de rupture', () => {
  it('rend un tableau portant toutes les en-têtes, dans l’ordre déclaré', () => {
    rendre();
    expect(document.querySelector('table')).toBeTruthy();
    expect(screen.getAllByRole('columnheader').map((t) => t.textContent)).toEqual([
      'Signalement', 'Localisation', 'Période', 'État', 'Prise en charge',
    ]);
  });

  it('ajoute une colonne Actions seulement si des actions sont fournies', () => {
    rendre();
    expect(screen.queryByText('Actions')).toBeNull();
    cleanup();
    rendre({ actions: (d) => <button>Menu {d.id}</button> });
    expect(screen.getByText('Actions')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Menu/ })).toHaveLength(2);
  });

  it('ne rend aucune carte', () => {
    rendre();
    expect(document.querySelectorAll('.rt-carte')).toHaveLength(0);
  });
});

describe('sous le point de rupture', () => {
  beforeEach(() => { compact = true; });

  it('rend une carte par ligne, et plus aucun tableau', () => {
    rendre();
    expect(document.querySelector('table')).toBeNull();
    expect(document.querySelectorAll('.rt-carte')).toHaveLength(2);
    expect(screen.getByRole('list', { name: 'Signalements' })).toBeTruthy();
  });

  it('place chaque colonne selon sa priorité', () => {
    rendre({ onLigneClick: () => {} });
    const carte = document.querySelectorAll('.rt-carte')[0];

    // titre : cliquable, donc un bouton
    expect(within(carte).getByRole('button', { name: 'Eaux très sales' })).toBeTruthy();
    expect(carte.querySelector('.rt-carte-soustitre').textContent).toBe('Faladie Sema');
    expect(carte.querySelector('.rt-carte-marquants').textContent).toBe('Déclaré');
    expect(carte.querySelector('.rt-carte-bloc-titre').textContent).toBe('Prise en charge');
    expect(carte.querySelector('.rt-carte-bloc').textContent).toContain('Disponible');
  });

  it('apparie libellé et valeur dans un dl/dt/dd', () => {
    rendre();
    const paire = document.querySelector('.rt-carte-details .rt-paire');
    expect(paire.closest('dl')).toBeTruthy();
    expect(paire.querySelector('dt').textContent).toBe('Période');
    expect(paire.querySelector('dd').textContent).toBe('11 août 2026 → En cours');
  });

  it('traite une colonne sans priorité comme un détail', () => {
    rendre({
      colonnes: [
        ...COLONNES,
        { id: 'extra', entete: 'Sans priorité', rendu: () => <span>valeur</span> },
      ],
    });
    const libelles = [...document.querySelectorAll('.rt-paire dt')].map((t) => t.textContent);
    expect(libelles).toContain('Sans priorité');
  });

  it('pose la couleur d’accent fournie sur la carte', () => {
    rendre({ accentDe: (d) => (d.gravite === 'high' ? 'red' : 'orange') });
    const cartes = document.querySelectorAll('.rt-carte');
    expect(cartes[0].style.getPropertyValue('--rt-accent')).toBe('orange');
    expect(cartes[1].style.getPropertyValue('--rt-accent')).toBe('red');
  });

  it('rend les actions sur chaque carte', () => {
    rendre({ actions: (d) => <button>Menu {d.id}</button> });
    expect(document.querySelectorAll('.rt-carte-actions')).toHaveLength(2);
  });
});

describe('conservation de l’information', () => {
  /**
   * Le test qui compte. La bascule table/carte n'a de valeur que si elle ne
   * fait rien disparaitre : c'etait la contrainte posee des le depart —
   * fusionner, jamais supprimer. On compare donc le texte rendu par CHAQUE
   * colonne dans les deux formes.
   */
  const texteDesColonnes = () =>
    COLONNES.map((c) => DONNEES.map((d) => c.rendu(d).props.children));

  it('affiche les mêmes valeurs en tableau et en cartes', () => {
    const attendus = texteDesColonnes().flat();

    compact = false;
    rendre();
    const enTableau = document.body.textContent;
    cleanup();

    compact = true;
    rendre();
    const enCartes = document.body.textContent;

    for (const valeur of attendus) {
      expect(enTableau, `« ${valeur} » manque dans le tableau`).toContain(valeur);
      expect(enCartes, `« ${valeur} » manque dans les cartes`).toContain(valeur);
    }
  });

  it('conserve les libellés de colonnes en cartes, sous forme de dt ou de titre de bloc', () => {
    compact = true;
    rendre();
    const vus = [
      ...[...document.querySelectorAll('.rt-paire dt')].map((t) => t.textContent),
      ...[...document.querySelectorAll('.rt-carte-bloc-titre')].map((t) => t.textContent),
    ];
    // Titre, sous-titre et marquant se passent d'etiquette : leur sens vient de
    // leur place. Les autres doivent rester nommes.
    expect(vus).toContain('Période');
    expect(vus).toContain('Prise en charge');
  });
});

describe('changement de largeur', () => {
  it('passe du tableau aux cartes et revient, sans perdre les lignes', () => {
    rendre();
    expect(document.querySelector('table')).toBeTruthy();

    largeurCompacte(true);
    expect(document.querySelector('table')).toBeNull();
    expect(document.querySelectorAll('.rt-carte')).toHaveLength(2);

    largeurCompacte(false);
    expect(document.querySelector('table')).toBeTruthy();
    expect(document.querySelectorAll('tbody tr')).toHaveLength(2);
  });
});

describe('bandeau photo', () => {
  beforeEach(() => { compact = true; });

  it('pose le media en tête de carte et y place le menu', () => {
    rendre({
      media: (d) => <img alt={`Photo de ${d.nom}`} src="x.jpg" />,
      actions: (d) => <button>Menu {d.id}</button>,
    });
    const carte = document.querySelectorAll('.rt-carte')[0];
    const bandeau = carte.querySelector('.rt-carte-media');
    expect(bandeau).toBeTruthy();
    expect(within(bandeau).getByAltText('Photo de Eaux très sales')).toBeTruthy();
    // Le menu vit sur le bandeau, et nulle part ailleurs : deux menus sur la
    // meme carte seraient deux cibles pour une seule action.
    expect(bandeau.querySelector('.rt-carte-actions')).toBeTruthy();
    expect(carte.querySelectorAll('.rt-carte-actions')).toHaveLength(1);
  });

  it('sans media, le menu revient dans la tête de carte', () => {
    rendre({ actions: (d) => <button>Menu {d.id}</button> });
    const carte = document.querySelectorAll('.rt-carte')[0];
    expect(carte.querySelector('.rt-carte-media')).toBeNull();
    expect(carte.querySelector('.rt-carte-tete .rt-carte-actions')).toBeTruthy();
  });

  it("n'ajoute aucun bandeau au tableau", () => {
    compact = false;
    rendre({ media: () => <img alt="x" src="x.jpg" /> });
    expect(document.querySelector('.rt-carte-media')).toBeNull();
  });
});

describe('rendus propres à la carte', () => {
  const AVEC_SURCHARGE = COLONNES.map((c) =>
    c.id === 'periode'
      ? { ...c, enteteCarte: 'Dates', renduCarte: (d) => <span>carte:{d.periode}</span> }
      : c
  );

  it('utilise renduCarte et enteteCarte sur la carte seulement', () => {
    compact = true;
    rendre({ colonnes: AVEC_SURCHARGE });
    const paire = document.querySelector('.rt-paire');
    expect(paire.querySelector('dt').textContent).toBe('Dates');
    expect(paire.querySelector('dd').textContent).toBe('carte:11 août 2026 → En cours');

    cleanup();
    compact = false;
    rendre({ colonnes: AVEC_SURCHARGE });
    expect(screen.getAllByRole('columnheader').map((t) => t.textContent)).toContain('Période');
    expect(document.body.textContent).toContain('11 août 2026 → En cours');
    expect(document.body.textContent).not.toContain('carte:');
  });
});

describe('chargement', () => {
  it('rend un squelette en forme de cartes sous le point de rupture', () => {
    compact = true;
    rendre({ chargement: true, lignesSquelette: 3, media: () => <img alt="x" src="x.jpg" /> });
    expect(document.querySelectorAll('.rt-squelette')).toHaveLength(3);
    expect(document.querySelector('table')).toBeNull();
    // Le bandeau est esquisse lui aussi, sinon la carte grandirait d'un coup
    // au moment ou la photo arrive.
    expect(document.querySelector('.rt-sq-media')).toBeTruthy();
    expect(screen.getByRole('list')).toHaveProperty('ariaBusy', 'true');
  });

  it('rend un squelette en forme de tableau au-dessus du point de rupture', () => {
    compact = false;
    rendre({ chargement: true, lignesSquelette: 4 });
    expect(document.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(document.querySelectorAll('.rt-carte')).toHaveLength(0);
    // Les en-tetes restent : elles ne dependent pas des donnees.
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
  });

  it("n'affiche aucune donnée pendant le chargement", () => {
    compact = true;
    rendre({ chargement: true });
    expect(document.body.textContent).not.toContain('Eaux très sales');
  });
});

describe('liste vide', () => {
  it('ne rend ni ligne ni carte, mais garde les en-têtes du tableau', () => {
    rendre({ donnees: [] });
    expect(document.querySelectorAll('tbody tr')).toHaveLength(0);
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);

    cleanup();
    compact = true;
    rendre({ donnees: [] });
    expect(document.querySelectorAll('.rt-carte')).toHaveLength(0);
  });
});
