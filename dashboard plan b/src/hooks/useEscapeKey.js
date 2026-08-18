import { useEffect, useRef } from 'react';

/** Surfaces actuellement ouvertes, dans leur ordre de montage. */
const pile = [];

/**
 * Ferme une surface flottante (modale, panneau, feuille) à l'appui sur Échap.
 *
 * Seule la surface la plus récemment MONTÉE réagit, afin qu'une modale
 * imbriquée dans une autre ne ferme pas les deux d'un seul appui.
 *
 * Le rappel est conservé dans une ref et l'effet ne dépend que de `actif`.
 * C'est essentiel : si l'effet dépendait de `onFermer`, il se relancerait à
 * chaque rendu — la plupart des modales passent un gestionnaire recréé à
 * chaque fois — et le jeton serait dépilé puis réempilé au sommet. Sur une
 * page agitée (WebSockets, revalidation SWR), une modale d'arrière-plan qui
 * se re-rend volerait alors le sommet de la pile et intercepterait Échap à la
 * place de la modale visible.
 *
 * @param {boolean} actif - true quand la surface est ouverte
 * @param {() => void} onFermer - appelé à l'appui sur Échap
 */
export function useEscapeKey(actif, onFermer) {
  const rappel = useRef(onFermer);

  // Maintient le rappel à jour sans provoquer de réinscription.
  useEffect(() => {
    rappel.current = onFermer;
  });

  useEffect(() => {
    if (!actif) return undefined;

    const jeton = {};
    pile.push(jeton);

    const gerer = (e) => {
      if (e.key !== 'Escape') return;
      if (pile[pile.length - 1] !== jeton) return;
      if (typeof rappel.current !== 'function') return;
      e.stopPropagation();
      rappel.current();
    };

    document.addEventListener('keydown', gerer, true);

    return () => {
      document.removeEventListener('keydown', gerer, true);
      const i = pile.indexOf(jeton);
      if (i !== -1) pile.splice(i, 1);
    };
  }, [actif]);
}

export default useEscapeKey;
