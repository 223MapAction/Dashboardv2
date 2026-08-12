import { useState } from 'react';

/**
 * Remet un etat a zero quand les valeurs surveillees changent — pendant le
 * rendu, et non dans un useEffect.
 *
 * Le reflexe naturel est d'ecrire :
 *
 *   useEffect(() => { setPage(1); }, [recherche, filtre]);
 *
 * Mais un effet s'execute APRES le rendu. Quand le filtre change, le composant
 * se rend donc une premiere fois avec l'ancienne page, et tout ce qui en
 * decoule part avec cette mauvaise valeur — ici, une requete SWR sur la page 4
 * d'un filtre qui vient de changer. L'effet remet ensuite la page a 1, ce qui
 * declenche un second rendu et une seconde requete. Sur une connexion de
 * terrain, c'est un aller-retour reseau entier gaspille a chaque frappe.
 *
 * En reinitialisant pendant le rendu, React abandonne le rendu en cours et
 * recommence immediatement avec la bonne valeur, avant de toucher au DOM. La
 * requete inutile n'est jamais emise.
 *
 * @param {Array} surveillees valeurs dont le changement declenche la remise a zero
 * @param {Function} reinitialiser appelee pendant le rendu ; n'y faites que des setState
 */
export function useReinitialisationSurChangement(surveillees, reinitialiser) {
  const cle = JSON.stringify(surveillees);
  const [clePrecedente, setClePrecedente] = useState(cle);

  if (cle !== clePrecedente) {
    setClePrecedente(cle);
    reinitialiser();
  }
}
