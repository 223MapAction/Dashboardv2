import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { More } from 'iconsax-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import './table-actions-menu.css';

/** Marge entre le déclencheur et le menu. */
const ECART = 6;
/** Marge minimale avec le bord de la fenêtre. */
const BORD = 8;

/**
 * Menu d'actions condensé pour une ligne de tableau.
 *
 * Les quatre tableaux du projet plaçaient deux à trois boutons dans leur
 * dernière colonne. Comme ces tableaux mesurent jusqu'à 1000px, les boutons
 * n'étaient atteignables qu'après avoir défilé jusqu'au bout à droite — la
 * plainte des utilisateurs. Un seul déclencheur réduit la largeur nécessaire.
 *
 * Le menu est rendu en PORTAIL, positionné en `fixed`. C'est indispensable :
 * les tableaux vivent dans un conteneur `overflow-x: auto`, qui rognerait
 * tout menu positionné en absolu à l'intérieur.
 *
 * @param {Array<{
 *   id: string,
 *   label: string,
 *   icon?: React.ComponentType<{size?: number, variant?: string, color?: string}>,
 *   onSelect: () => void,
 *   tone?: 'danger',
 *   disabled?: boolean
 * }>} actions
 * @param {string} [ariaLabel] - libellé du déclencheur
 */
export const TableActionsMenu = ({ actions = [], ariaLabel = 'Actions' }) => {
  const [ouvert, setOuvert] = useState(false);
  const [position, setPosition] = useState(null);
  const [indexActif, setIndexActif] = useState(-1);
  const declencheurRef = useRef(null);
  const menuRef = useRef(null);
  const idMenu = useId();

  const disponibles = actions.filter(Boolean);

  const fermer = useCallback((rendreFocus = true) => {
    setOuvert(false);
    setIndexActif(-1);
    if (rendreFocus) declencheurRef.current?.focus();
  }, []);

  useEscapeKey(ouvert, fermer);

  const calculerPosition = useCallback(() => {
    const d = declencheurRef.current;
    if (!d) return;
    const r = d.getBoundingClientRect();
    const largeur = 210;
    // Aligné à droite du déclencheur, ramené dans la fenêtre si besoin.
    let gauche = Math.min(r.right - largeur, window.innerWidth - largeur - BORD);
    gauche = Math.max(BORD, gauche);
    // Bascule au-dessus s'il n'y a pas la place en dessous.
    const hauteurEstimee = disponibles.length * 42 + 12;
    const enDessous = r.bottom + ECART + hauteurEstimee <= window.innerHeight - BORD;
    setPosition({
      left: gauche,
      top: enDessous ? r.bottom + ECART : Math.max(BORD, r.top - ECART - hauteurEstimee),
      width: largeur,
    });
  }, [disponibles.length]);

  const basculer = (e) => {
    e.stopPropagation();
    if (ouvert) {
      fermer(false);
      return;
    }
    calculerPosition();
    setOuvert(true);
  };

  // Fermeture au clic extérieur, et repositionnement au défilement.
  useEffect(() => {
    if (!ouvert) return undefined;

    const auClic = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (declencheurRef.current?.contains(e.target)) return;
      fermer(false);
    };
    // Le menu est en position fixe : s'il n'était pas fermé au défilement, il
    // resterait accroché à l'écran pendant que sa ligne s'éloigne.
    const auDefilement = () => fermer(false);

    document.addEventListener('mousedown', auClic);
    window.addEventListener('scroll', auDefilement, true);
    window.addEventListener('resize', auDefilement);
    return () => {
      document.removeEventListener('mousedown', auClic);
      window.removeEventListener('scroll', auDefilement, true);
      window.removeEventListener('resize', auDefilement);
    };
  }, [ouvert, fermer]);

  // Focus sur le premier élément à l'ouverture au clavier.
  useEffect(() => {
    if (ouvert && indexActif >= 0) {
      menuRef.current?.querySelectorAll('[role="menuitem"]')[indexActif]?.focus();
    }
  }, [ouvert, indexActif]);

  const auClavierDeclencheur = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      calculerPosition();
      setOuvert(true);
      setIndexActif(0);
    }
  };

  const auClavierMenu = (e) => {
    const n = disponibles.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndexActif((i) => (i + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndexActif((i) => (i - 1 + n) % n); }
    else if (e.key === 'Home') { e.preventDefault(); setIndexActif(0); }
    else if (e.key === 'End') { e.preventDefault(); setIndexActif(n - 1); }
    else if (e.key === 'Tab') { fermer(false); }
  };

  const choisir = (action) => {
    if (action.disabled) return;
    fermer(false);
    action.onSelect();
  };

  if (disponibles.length === 0) return null;

  return (
    <>
      <button
        ref={declencheurRef}
        type="button"
        className={`table-actions-trigger${ouvert ? ' is-open' : ''}`}
        onClick={basculer}
        onKeyDown={auClavierDeclencheur}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? idMenu : undefined}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <More size={18} variant="Linear" color="currentColor" />
      </button>

      {ouvert && position && createPortal(
        <div
          ref={menuRef}
          id={idMenu}
          role="menu"
          aria-label={ariaLabel}
          className="table-actions-menu"
          style={{ left: position.left, top: position.top, width: position.width }}
          onKeyDown={auClavierMenu}
        >
          {disponibles.map((action, i) => {
            const Icone = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                tabIndex={i === indexActif ? 0 : -1}
                disabled={action.disabled}
                className={`table-actions-item${action.tone === 'danger' ? ' is-danger' : ''}`}
                onClick={(e) => { e.stopPropagation(); choisir(action); }}
                onMouseEnter={() => setIndexActif(i)}
              >
                {Icone && <Icone size={16} variant="Linear" color="currentColor" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

export default TableActionsMenu;
