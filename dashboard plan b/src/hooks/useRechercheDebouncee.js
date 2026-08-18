import { useState, useMemo, useEffect } from 'react';
import debounce from 'lodash.debounce';

/**
 * Delai unique pour toutes les recherches de l'application.
 *
 * Il y en avait trois : 200 ms sur Collaborations, Agents, Organisations et
 * Signalements, 300 ms sur Mes interventions, et aucun sur Demandes de
 * collaboration, Suggestions et Corbeille — ces trois-la relancaient le rendu
 * a chaque frappe. Un chiffre unique evite que la meme action reponde a des
 * vitesses differentes selon la page.
 *
 * 250 ms : assez court pour ne pas se sentir en retard, assez long pour qu'un
 * mot tape normalement ne parte qu'une fois.
 */
export const DELAI_RECHERCHE = 250;

/**
 * Separe ce que l'utilisateur tape de ce qu'on interroge.
 *
 * `saisie` suit le clavier et alimente le champ — il doit rester instantane,
 * sinon la frappe accroche. `recherche` ne bouge qu'apres la pause et sert de
 * cle de requete.
 *
 * @param {string} valeurInitiale
 * @returns {{saisie: string, setSaisie: (v: string) => void, recherche: string, reinitialiser: () => void}}
 */
export const useRechercheDebouncee = (valeurInitiale = '') => {
  const [saisie, setSaisieBrute] = useState(valeurInitiale);
  const [recherche, setRecherche] = useState(valeurInitiale);

  const propager = useMemo(
    () => debounce((valeur) => setRecherche(valeur), DELAI_RECHERCHE),
    []
  );

  // Sans cette annulation, une frappe en attente s'appliquerait apres le
  // demontage du composant.
  useEffect(() => () => propager.cancel(), [propager]);

  const setSaisie = (valeur) => {
    setSaisieBrute(valeur);
    propager(valeur);
  };

  const reinitialiser = () => {
    propager.cancel();
    setSaisieBrute('');
    setRecherche('');
  };

  return { saisie, setSaisie, recherche, reinitialiser };
};

export default useRechercheDebouncee;
