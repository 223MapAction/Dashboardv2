import { useSyncExternalStore, useMemo } from 'react';

/**
 * Suit une media query depuis JavaScript.
 *
 * Pourquoi ne pas se contenter de CSS : pour basculer entre un tableau et des
 * cartes, le reflexe est de rendre les deux et d'en masquer un en
 * `display: none`. Mais un navigateur telecharge quand meme les `<img>` d'un
 * sous-arbre masque. Chaque vignette partirait deux fois, ce qui annulerait le
 * `loading="lazy"` pose sur BlurryImage. En passant par JS, une seule des deux
 * vues existe.
 *
 * `useSyncExternalStore` plutot qu'un useState + useEffect : matchMedia est
 * exactement ce que cette API adresse — une source de verite exterieure a
 * React. Elle lit la valeur au moment du rendu, donc pas de premier rendu a
 * la mauvaise largeur, et pas de setState dans un effet.
 *
 * @param {string} requete ex. '(max-width: 899.98px)'
 * @returns {boolean}
 */
export const useMediaQuery = (requete) => {
  const mql = useMemo(
    () => (typeof window === 'undefined' ? null : window.matchMedia(requete)),
    [requete]
  );

  return useSyncExternalStore(
    (surChangement) => {
      if (!mql) return () => {};
      mql.addEventListener('change', surChangement);
      return () => mql.removeEventListener('change', surChangement);
    },
    () => (mql ? mql.matches : false),
    // Cote serveur, on part du tableau : c'est la forme la plus riche, et le
    // client corrige des le premier rendu.
    () => false
  );
};

/**
 * Le point de rupture des listes : au-dela, un tableau ; en deca, des cartes.
 * Meme valeur que le repli des lignes d'Agents (agents-roster.css) — on ne
 * cree pas un nouveau palier dans le systeme pour le meme besoin.
 */
export const REQUETE_LISTE_COMPACTE = '(max-width: 899.98px)';

export const useListeCompacte = () => useMediaQuery(REQUETE_LISTE_COMPACTE);

export default useMediaQuery;
