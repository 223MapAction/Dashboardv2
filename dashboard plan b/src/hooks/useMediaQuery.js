import { useState, useEffect } from 'react';

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
 * @param {string} requete ex. '(max-width: 899.98px)'
 * @returns {boolean}
 */
export const useMediaQuery = (requete) => {
  const [correspond, setCorrespond] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(requete).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(requete);
    // Resynchronise a l'abonnement : la largeur a pu changer entre le premier
    // rendu et l'effet (rotation de l'ecran, ouverture du clavier).
    setCorrespond(mql.matches);

    const surChangement = (e) => setCorrespond(e.matches);
    mql.addEventListener('change', surChangement);
    return () => mql.removeEventListener('change', surChangement);
  }, [requete]);

  return correspond;
};

/**
 * Le point de rupture des listes : au-dela, un tableau ; en deca, des cartes.
 * Meme valeur que le repli des lignes d'Agents (agents-roster.css) — on ne
 * cree pas un nouveau palier dans le systeme pour le meme besoin.
 */
export const REQUETE_LISTE_COMPACTE = '(max-width: 899.98px)';

export const useListeCompacte = () => useMediaQuery(REQUETE_LISTE_COMPACTE);

export default useMediaQuery;
