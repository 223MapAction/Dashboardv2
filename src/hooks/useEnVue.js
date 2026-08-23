import { useEffect, useRef, useState } from 'react';

/**
 * Détecte quand un élément entre dans (ou approche de) la zone visible, pour
 * différer le chargement de ce qu'il affiche — typiquement une image posée en
 * `background-image`, que `loading="lazy"` ne peut pas viser puisqu'il ne
 * s'applique qu'à `<img>`/`<iframe>`.
 *
 * Une fois vu, reste vu : on ne veut pas décharger une image déjà affichée
 * quand elle ressort de l'écran.
 *
 * @param {object} [options]
 * @param {string} [options.rootMargin='200px'] commence a charger un peu
 *   avant que l'element n'atteigne l'ecran, pour eviter un flash a vide.
 * @returns {[React.RefObject, boolean]} la ref a poser sur l'element, et si
 *   ses fils peuvent commencer a charger leur image.
 */
export const useEnVue = ({ rootMargin = '200px' } = {}) => {
  const ref = useRef(null);
  // Environnement sans IntersectionObserver (tres vieux navigateur) : on
  // charge tout de suite plutot que de ne jamais afficher l'image. Decide au
  // premier rendu, pas dans l'effet : un effet qui se contente d'activer un
  // etat des le montage n'est qu'un rendu masque en deux passes.
  const [enVue, setEnVue] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (enVue) return;
    const element = ref.current;
    if (!element) return;

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (entree.isIntersecting) {
          setEnVue(true);
          observateur.disconnect();
        }
      },
      { rootMargin }
    );

    observateur.observe(element);
    return () => observateur.disconnect();
  }, [enVue, rootMargin]);

  return [ref, enVue];
};

export default useEnVue;
