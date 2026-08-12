// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BlurryImage } from './BlurryImage';

/**
 * jsdom ne charge aucune image : `complete` y vaut toujours false et aucun
 * evenement `load` ne part. On pilote donc les deux a la main, ce qui permet
 * justement de reproduire le cas qui posait probleme.
 */
const simulerDejaChargee = (largeurNaturelle = 320) => {
  Object.defineProperty(HTMLImageElement.prototype, 'complete', {
    configurable: true,
    get() { return true; },
  });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    configurable: true,
    get() { return largeurNaturelle; },
  });
};

const restaurer = () => {
  delete HTMLImageElement.prototype.complete;
  delete HTMLImageElement.prototype.naturalWidth;
};

afterEach(() => { cleanup(); restaurer(); });

describe('image deja en cache', () => {
  /**
   * Le bug d'origine : le composant n'ecoutait que l'evenement `load`. Une
   * image deja en cache finit de charger AVANT que React n'attache son
   * gestionnaire ; l'evenement passait inapercu et l'image restait
   * indefiniment invisible derriere son scintillement. Symptome cote
   * utilisateur : certaines vignettes s'affichaient, d'autres non, sans
   * logique apparente — les seules a echouer etaient celles deja vues.
   */
  it('se revele sans attendre un evenement load qui ne viendra pas', () => {
    simulerDejaChargee(320);
    render(<BlurryImage src="/photo.jpg" alt="Berge polluée" />);

    expect(screen.getByAltText('Berge polluée').className).toContain('loaded');
    expect(document.querySelector('.blurry-image-placeholder')).toBeNull();
  });

  it('bascule en échec si l’image en cache est cassée', () => {
    // Une image terminee mais de largeur nulle est une image qui a echoue.
    simulerDejaChargee(0);
    render(<BlurryImage src="/cassee.jpg" alt="Berge polluée" />);

    expect(document.querySelector('.blurry-image-echec')).toBeTruthy();
  });
});

describe('image chargée normalement', () => {
  it('montre le scintillement puis l’image', () => {
    render(<BlurryImage src="/photo.jpg" alt="Berge polluée" />);
    expect(document.querySelector('.blurry-image-placeholder')).toBeTruthy();

    fireEvent.load(screen.getByAltText('Berge polluée'));
    expect(screen.getByAltText('Berge polluée').className).toContain('loaded');
    expect(document.querySelector('.blurry-image-placeholder')).toBeNull();
  });

  it('passe en échec et propose de réessayer', () => {
    render(<BlurryImage src="/photo.jpg" alt="Berge polluée" />);
    fireEvent.error(screen.getByAltText('Berge polluée'));

    const bouton = document.querySelector('.blurry-image-echec');
    expect(bouton).toBeTruthy();
    expect(bouton.title).toContain('réessayer');
  });

  it('diffère le chargement des vignettes hors écran', () => {
    render(<BlurryImage src="/photo.jpg" alt="Berge polluée" />);
    expect(screen.getByAltText('Berge polluée').getAttribute('loading')).toBe('lazy');
  });
});

describe('sans photo', () => {
  it('affiche un état « aucune photo », distinct d’un échec', () => {
    render(<BlurryImage src="" alt="Signalement sans photo" />);
    expect(document.querySelector('.blurry-image-vide')).toBeTruthy();
    expect(document.querySelector('.blurry-image-echec')).toBeNull();
    expect(document.querySelector('.blurry-image-placeholder')).toBeNull();
  });
});

describe('gestionnaires du parent', () => {
  it('appelle onLoad du parent sans se laisser écraser par lui', () => {
    let appele = false;
    render(<BlurryImage src="/photo.jpg" alt="Berge polluée" onLoad={() => { appele = true; }} />);

    fireEvent.load(screen.getByAltText('Berge polluée'));
    expect(appele).toBe(true);
    // Le parent est prevenu, ET le composant a bien change d'etat : les deux,
    // pas l'un au detriment de l'autre.
    expect(screen.getByAltText('Berge polluée').className).toContain('loaded');
  });
});
