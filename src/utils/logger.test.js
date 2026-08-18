import { describe, it, expect } from 'vitest';
import { _nettoyerPourTest as nettoyer } from './logger';

describe('masquage des champs sensibles', () => {
  it('masque un mot de passe', () => {
    const sortie = nettoyer({ email: 'a@b.com', password: 'secret-du-compte' });
    expect(JSON.stringify(sortie)).not.toContain('secret-du-compte');
  });

  it('masque les jetons, quel que soit le nom du champ', () => {
    const sortie = nettoyer({
      access: 'eyJhbGciOiJIUzI1NiJ9.charge-utile',
      refresh_token: 'jeton-de-rafraichissement',
      apiKey: 'cle-api-privee',
    });
    const texte = JSON.stringify(sortie);
    expect(texte).not.toContain('charge-utile');
    expect(texte).not.toContain('jeton-de-rafraichissement');
    expect(texte).not.toContain('cle-api-privee');
  });

  it('masque les coordonnées GPS d’un signalement', () => {
    const sortie = nettoyer({ id: 42, lat: 12.6392, lng: -8.0029 });
    const texte = JSON.stringify(sortie);
    expect(texte).not.toContain('12.6392');
    expect(texte).not.toContain('-8.0029');
    expect(sortie.id).toBe(42); // l'identifiant reste lisible
  });

  it('masque en profondeur, pas seulement au premier niveau', () => {
    const sortie = nettoyer({ data: { user: { profile: { email: 'x@y.z' } } } });
    expect(JSON.stringify(sortie)).not.toContain('x@y.z');
  });

  it('ne masque pas un champ dont le nom contient par hasard une clé courte', () => {
    // `lat` est cherché en correspondance exacte : `translated` et `related`
    // ne doivent pas être touchés.
    const sortie = nettoyer({ translated: 'bonjour', related: 'signalement-3' });
    expect(sortie.translated).toBe('bonjour');
    expect(sortie.related).toBe('signalement-3');
  });
});

describe('robustesse', () => {
  it('ne boucle pas sur une référence circulaire', () => {
    const noeud = { nom: 'a' };
    noeud.soi = noeud;
    expect(() => nettoyer(noeud)).not.toThrow();
    expect(nettoyer(noeud).soi).toBe('[Circulaire]');
  });

  it('réduit une erreur à son diagnostic, sans le contexte HTTP', () => {
    const erreur = new Error('Requête refusée');
    erreur.response = {
      status: 401,
      data: { detail: 'contenu utilisateur confidentiel' },
      headers: { Authorization: 'Bearer jeton-secret' },
    };

    const sortie = nettoyer(erreur);

    expect(sortie.message).toBe('Requête refusée');
    expect(sortie.status).toBe(401);
    const texte = JSON.stringify(sortie);
    expect(texte).not.toContain('contenu utilisateur confidentiel');
    expect(texte).not.toContain('jeton-secret');
  });

  it('tronque un long tableau au lieu de tout déverser', () => {
    const sortie = nettoyer(Array.from({ length: 500 }, (_, i) => i));
    expect(sortie).toHaveLength(11); // 10 éléments + la mention du reste
    expect(sortie[10]).toContain('490');
  });

  it('s’arrête au-delà de la profondeur maximale', () => {
    const profond = { a: { b: { c: { d: { e: 'trop loin' } } } } };
    expect(JSON.stringify(nettoyer(profond))).not.toContain('trop loin');
  });

  it('laisse passer les valeurs simples', () => {
    expect(nettoyer('message')).toBe('message');
    expect(nettoyer(7)).toBe(7);
    expect(nettoyer(null)).toBe(null);
    expect(nettoyer(undefined)).toBe(undefined);
  });
});
