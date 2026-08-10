import { useEffect } from 'react';

/**
 * Ferme une surface flottante (modale, panneau, feuille) à l'appui sur Échap.
 *
 * Aucune des modales du projet ne se fermait au clavier : combiné à l'absence
 * d'anneau de focus, un utilisateur clavier s'y retrouvait piégé.
 *
 * Le gestionnaire est posé en phase de capture et n'agit que sur la surface la
 * plus récemment ouverte, afin qu'une modale imbriquée dans une autre ne ferme
 * pas les deux d'un seul appui.
 *
 * @param {boolean} actif - true quand la surface est ouverte
 * @param {() => void} onFermer - appelé à l'appui sur Échap
 */
export function useEscapeKey(actif, onFermer) {
  useEffect(() => {
    if (!actif || typeof onFermer !== 'function') return undefined;

    const pile = useEscapeKey._pile;
    const jeton = {};
    pile.push(jeton);

    const gerer = (e) => {
      if (e.key !== 'Escape') return;
      // Seule la surface au sommet de la pile réagit.
      if (pile[pile.length - 1] !== jeton) return;
      e.stopPropagation();
      onFermer();
    };

    document.addEventListener('keydown', gerer, true);

    return () => {
      document.removeEventListener('keydown', gerer, true);
      const i = pile.indexOf(jeton);
      if (i !== -1) pile.splice(i, 1);
    };
  }, [actif, onFermer]);
}

// Pile partagée entre toutes les instances du hook.
useEscapeKey._pile = [];

export default useEscapeKey;
