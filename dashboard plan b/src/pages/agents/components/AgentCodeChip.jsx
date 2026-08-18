import { useEffect, useRef, useState } from 'react';
import { Copy, TickCircle } from 'iconsax-react';

/**
 * Code d'accès de l'agent, copiable d'un clic.
 *
 * C'est l'identifiant que l'agent saisit pour se connecter à l'application
 * mobile. Il n'apparaissait nulle part dans le dashboard : un coordinateur
 * appelé par un agent bloqué à la connexion n'avait aucun moyen de le
 * retrouver. C'est l'objet le plus utile de la page, d'où son traitement —
 * chasse fixe, capitales espacées, comme un indicatif d'appel.
 */
export const AgentCodeChip = ({ code }) => {
  const [copie, setCopie] = useState(false);
  const minuterie = useRef(null);

  useEffect(() => () => clearTimeout(minuterie.current), []);

  if (!code) {
    return <span className="agent-code agent-code--vide">Aucun code</span>;
  }

  const copier = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Repli pour les contextes sans accès au presse-papiers (http, permission
      // refusée) : on sélectionne le texte pour que l'utilisateur copie à la main.
      const plage = document.createRange();
      plage.selectNodeContents(e.currentTarget.querySelector('.agent-code-valeur'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(plage);
      return;
    }
    setCopie(true);
    clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => setCopie(false), 1800);
  };

  return (
    <button
      type="button"
      className={`agent-code${copie ? ' is-copie' : ''}`}
      onClick={copier}
      title={copie ? 'Code copié' : 'Copier le code d’accès'}
      aria-label={`Code d’accès ${code.split('').join(' ')}. Copier.`}
    >
      <span className="agent-code-valeur">{code}</span>
      {copie
        ? <TickCircle size={14} variant="Bold" color="currentColor" />
        : <Copy size={14} variant="Linear" color="currentColor" />}
      {/* Annonce le succès aux lecteurs d'écran sans déplacer le focus. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copie ? 'Code copié' : ''}
      </span>
    </button>
  );
};

export default AgentCodeChip;
