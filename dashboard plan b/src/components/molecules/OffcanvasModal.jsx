import { useCallback, useState } from 'react';
import { CloseCircle } from 'iconsax-react';
import { EscapeToClose } from '../atoms/EscapeToClose';
import '../../styles/modals.css';

/** Durée de l'animation de sortie, alignée sur `am-offcanvas-panel--closing`. */
const DUREE_FERMETURE = 280;

/**
 * Coquille commune à toutes les modales latérales du dashboard.
 *
 * Les 21 modales du projet répétaient chacune le même échafaudage : un état
 * `isClosing`, un `handleClose` temporisé sur l'animation, le calcul des
 * classes du panneau et du fond, le fond cliquable, la fermeture au clavier et
 * un en-tête avec bouton de fermeture. Cette duplication est la raison pour
 * laquelle une correction devait être appliquée vingt et une fois.
 *
 * @param {() => void}  onClose      appelé APRÈS l'animation de sortie
 * @param {string}      title        titre affiché dans l'en-tête
 * @param {string}     [subtitle]    ligne secondaire sous le titre
 * @param {string}     [ariaLabel]   libellé accessible ; défaut : `title`
 * @param {'sm'|'md'}  [size]        largeur du panneau
 * @param {'danger'}   [tone]        teinte de l'en-tête
 * @param {'dialog'|'alertdialog'} [role]
 * @param {boolean}    [dismissible] false verrouille fond, Échap et bouton
 * @param {React.ReactNode} [footer]
 * @param {React.ReactNode | ({ close }) => React.ReactNode} children
 *        Sous forme de fonction, reçoit `close` pour fermer depuis l'intérieur
 *        (bouton « Annuler ») en conservant l'animation.
 */
export const OffcanvasModal = ({
  onClose,
  title,
  subtitle,
  ariaLabel,
  size = 'md',
  tone,
  role = 'dialog',
  dismissible = true,
  footer,
  children,
}) => {
  const [enFermeture, setEnFermeture] = useState(false);

  const close = useCallback(() => {
    if (!dismissible || enFermeture) return;
    setEnFermeture(true);
    setTimeout(() => {
      onClose();
      setEnFermeture(false);
    }, DUREE_FERMETURE);
  }, [dismissible, enFermeture, onClose]);

  const classePanneau = [
    'am-offcanvas-panel',
    size === 'sm' ? 'am-offcanvas-panel--sm' : '',
    enFermeture ? 'am-offcanvas-panel--closing' : 'am-offcanvas-panel--opening',
  ].filter(Boolean).join(' ');

  const classeFond = [
    'am-offcanvas-backdrop',
    enFermeture ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  const classeEntete = [
    'am-offcanvas-header',
    tone === 'danger' ? 'am-offcanvas-header--danger' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={classeFond} onClick={close} />
      {dismissible && <EscapeToClose onClose={close} />}

      <aside
        className={classePanneau}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel || title}
      >
        <header className={classeEntete}>
          <div className="am-offcanvas-heading">
            <h3 className="am-offcanvas-title">{title}</h3>
            {subtitle && <p className="am-offcanvas-subtitle">{subtitle}</p>}
          </div>

          {dismissible && (
            <button
              type="button"
              className="am-offcanvas-close"
              onClick={close}
              aria-label="Fermer"
            >
              <CloseCircle size={22} variant="Linear" color="currentColor" />
            </button>
          )}
        </header>

        {typeof children === 'function' ? children({ close }) : children}

        {footer && <footer className="am-offcanvas-footer">{footer}</footer>}
      </aside>
    </>
  );
};

export default OffcanvasModal;
