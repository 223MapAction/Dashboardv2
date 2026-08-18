import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseCircle, Add, Minus, Maximize4 } from 'iconsax-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import './image-viewer.css';

const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const PAS_BOUTON = 0.5;

const borner = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Visualiseur d'image plein écran, avec zoom et déplacement.
 *
 * Conçu d'abord pour le tactile : les agents consultent les photos d'signalement
 * depuis un téléphone. Le pincement, le glissé et le double-tap sont donc
 * traités au même titre que la molette et le clavier.
 *
 * Le déplacement est borné à l'image : au-delà, on relâche dans le vide et on
 * perd de vue ce qu'on regardait.
 */
export const ImageViewer = ({ src, alt = '', onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [glisse, setGlisse] = useState(false);

  const cadreRef = useRef(null);
  const imgRef = useRef(null);
  const depart = useRef(null);
  const pincement = useRef(null);

  useEscapeKey(true, onClose);

  /** Empêche l'image de sortir du cadre : au-delà, on regarde du vide. */
  const bornerPosition = useCallback((p, z = zoom) => {
    const cadre = cadreRef.current, img = imgRef.current;
    if (!cadre || !img) return p;
    const debordeX = Math.max(0, (img.offsetWidth * z - cadre.clientWidth) / 2);
    const debordeY = Math.max(0, (img.offsetHeight * z - cadre.clientHeight) / 2);
    return { x: borner(p.x, -debordeX, debordeX), y: borner(p.y, -debordeY, debordeY) };
  }, [zoom]);

  const appliquerZoom = useCallback((nouveau, ancre) => {
    const z = borner(nouveau, ZOOM_MIN, ZOOM_MAX);
    setZoom(z);
    setPos((p) => {
      if (z === ZOOM_MIN) return { x: 0, y: 0 };
      // Zoom centré sur le pointeur : sans ça, on perd le détail visé.
      if (ancre) {
        const cadre = cadreRef.current.getBoundingClientRect();
        const dx = ancre.x - cadre.left - cadre.width / 2;
        const dy = ancre.y - cadre.top - cadre.height / 2;
        const facteur = z / zoom;
        return bornerPosition({ x: p.x - dx * (facteur - 1), y: p.y - dy * (facteur - 1) }, z);
      }
      return bornerPosition(p, z);
    });
  }, [zoom, bornerPosition]);

  const reinitialiser = () => { setZoom(1); setPos({ x: 0, y: 0 }); };

  // ── Molette ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const cadre = cadreRef.current;
    if (!cadre) return undefined;
    // `passive: false` est requis pour pouvoir annuler le défilement de la page.
    const surMolette = (e) => {
      e.preventDefault();
      appliquerZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), { x: e.clientX, y: e.clientY });
    };
    cadre.addEventListener('wheel', surMolette, { passive: false });
    return () => cadre.removeEventListener('wheel', surMolette);
  }, [zoom, appliquerZoom]);

  // ── Clavier ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const surTouche = (e) => {
      const pas = 40;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); appliquerZoom(zoom + PAS_BOUTON); }
      else if (e.key === '-') { e.preventDefault(); appliquerZoom(zoom - PAS_BOUTON); }
      else if (e.key === '0') { e.preventDefault(); reinitialiser(); }
      else if (zoom > 1 && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = { ArrowLeft: [pas, 0], ArrowRight: [-pas, 0], ArrowUp: [0, pas], ArrowDown: [0, -pas] }[e.key];
        if (d) setPos((p) => bornerPosition({ x: p.x + d[0], y: p.y + d[1] }));
      }
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [zoom, appliquerZoom, bornerPosition]);

  // ── Souris ────────────────────────────────────────────────────────────────
  const debutGlisse = (e) => {
    if (zoom === 1) return;
    setGlisse(true);
    depart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const pendantGlisse = (e) => {
    if (!glisse || !depart.current) return;
    setPos(bornerPosition({ x: e.clientX - depart.current.x, y: e.clientY - depart.current.y }));
  };
  const finGlisse = () => { setGlisse(false); depart.current = null; };

  // ── Tactile : glissé à un doigt, pincement à deux ─────────────────────────
  const ecart = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const debutTactile = (e) => {
    const t = e.touches;
    if (t.length === 2) {
      pincement.current = { ecart: ecart(t), zoom };
      depart.current = null;
    } else if (t.length === 1 && zoom > 1) {
      depart.current = { x: t[0].clientX - pos.x, y: t[0].clientY - pos.y };
    }
  };

  const pendantTactile = (e) => {
    const t = e.touches;
    if (t.length === 2 && pincement.current) {
      e.preventDefault();
      const centre = { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
      appliquerZoom(pincement.current.zoom * (ecart(t) / pincement.current.ecart), centre);
    } else if (t.length === 1 && depart.current) {
      e.preventDefault();
      setPos(bornerPosition({ x: t[0].clientX - depart.current.x, y: t[0].clientY - depart.current.y }));
    }
  };

  const finTactile = () => { pincement.current = null; depart.current = null; };

  const surDoubleClic = (e) => {
    appliquerZoom(zoom > 1 ? 1 : 2.5, { x: e.clientX, y: e.clientY });
  };

  return createPortal(
    <div className="visionneuse" role="dialog" aria-modal="true" aria-label={alt || 'Image en plein écran'}>
      <div className="visionneuse-fond" onClick={onClose} />

      <div className="visionneuse-barre">
        <button type="button" onClick={() => appliquerZoom(zoom - PAS_BOUTON)}
                disabled={zoom <= ZOOM_MIN} aria-label="Dézoomer" title="Dézoomer (−)">
          <Minus size={20} variant="Linear" color="currentColor" />
        </button>

        <span className="visionneuse-niveau" aria-live="polite">{Math.round(zoom * 100)} %</span>

        <button type="button" onClick={() => appliquerZoom(zoom + PAS_BOUTON)}
                disabled={zoom >= ZOOM_MAX} aria-label="Zoomer" title="Zoomer (+)">
          <Add size={20} variant="Linear" color="currentColor" />
        </button>

        <button type="button" onClick={reinitialiser} disabled={zoom === 1 && pos.x === 0 && pos.y === 0}
                aria-label="Taille d’origine" title="Taille d’origine (0)">
          <Maximize4 size={18} variant="Linear" color="currentColor" />
        </button>
      </div>

      <button type="button" className="visionneuse-fermer" onClick={onClose}
              aria-label="Fermer" title="Fermer (Échap)">
        <CloseCircle size={30} variant="Bold" color="currentColor" />
      </button>

      <div
        ref={cadreRef}
        className={`visionneuse-cadre${zoom > 1 ? ' est-zoome' : ''}${glisse ? ' est-glisse' : ''}`}
        onMouseDown={debutGlisse}
        onMouseMove={pendantGlisse}
        onMouseUp={finGlisse}
        onMouseLeave={finGlisse}
        onTouchStart={debutTactile}
        onTouchMove={pendantTactile}
        onTouchEnd={finTactile}
        onDoubleClick={surDoubleClic}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="visionneuse-image"
          draggable="false"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})` }}
        />
      </div>

      <p className="visionneuse-aide">
        Molette ou pincement pour zoomer · double-clic pour basculer · glisser pour déplacer
      </p>
    </div>,
    document.body
  );
};

export default ImageViewer;
