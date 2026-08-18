import { useEscapeKey } from '../../hooks/useEscapeKey';

/**
 * Ferme la surface qui le contient à l'appui sur Échap. Ne rend rien.
 *
 * Pourquoi un composant plutôt qu'un hook appelé directement dans la modale :
 * toutes les modales du projet font `return null` quand elles sont fermées.
 * Un hook placé avant ce return serait appelé même modale fermée ; placé après,
 * il serait inatteignable — et dans les deux cas on violerait les règles des
 * hooks. Monté dans le JSX de la modale, ce composant n'existe que lorsque la
 * modale est ouverte, ce qui rend l'état « actif » implicite et toujours juste.
 *
 * Usage :
 *   <EscapeToClose onClose={handleClose} />
 */
export const EscapeToClose = ({ onClose, disabled = false }) => {
  useEscapeKey(!disabled, onClose);
  return null;
};

export default EscapeToClose;
