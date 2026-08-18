import { describe, it, expect } from 'vitest';
import { AVATAR_COLORS, AVATAR_COULEUR_DEFAUT, couleurAvatarPour } from './couleursAvatar';

describe('palette d’avatars', () => {
  it('ne contient que des couleurs littérales', () => {
    // Une couleur tiree par hachage doit etre une vraie valeur : un var() ne
    // serait pas exploitable la ou cette palette sert (canvas, export, calcul
    // de contraste). Ce test empeche une tokenisation zelee de la casser.
    for (const couleur of AVATAR_COLORS) {
      expect(couleur).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('ne contient aucun doublon', () => {
    // Deux entrees identiques donneraient la meme pastille a deux personnes
    // differentes, ce qui vide la palette de son seul role.
    expect(new Set(AVATAR_COLORS).size).toBe(AVATAR_COLORS.length);
  });
});

describe('couleurAvatarPour', () => {
  it('donne toujours la même pastille au même identifiant', () => {
    // C'est le contrat central : un agent doit etre reconnaissable d'un ecran
    // a l'autre et d'une session a l'autre.
    expect(couleurAvatarPour(42)).toBe(couleurAvatarPour(42));
    expect(couleurAvatarPour('42')).toBe(couleurAvatarPour(42));
  });

  it('rend une couleur de la palette', () => {
    for (const id of [0, 1, 7, 9, 10, 137, 2048]) {
      expect(AVATAR_COLORS).toContain(couleurAvatarPour(id));
    }
  });

  it('supporte les identifiants négatifs', () => {
    // Un modulo sur un nombre negatif rend un index negatif, donc `undefined`.
    expect(AVATAR_COLORS).toContain(couleurAvatarPour(-3));
  });

  it('retombe sur la couleur par défaut quand l’identifiant est inexploitable', () => {
    for (const id of [null, undefined, '', 'abc', NaN]) {
      expect(couleurAvatarPour(id)).toBe(AVATAR_COULEUR_DEFAUT);
    }
  });

  it('répartit les identifiants successifs sur toute la palette', () => {
    const vues = new Set(
      Array.from({ length: AVATAR_COLORS.length }, (_, i) => couleurAvatarPour(i)),
    );
    expect(vues.size).toBe(AVATAR_COLORS.length);
  });
});
