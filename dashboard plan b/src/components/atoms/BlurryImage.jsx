import React, { useState, useCallback } from 'react';
import { Gallery, GallerySlash } from 'iconsax-react';

/**
 * BlurryImage — affiche une image en la faisant apparaitre en fondu, avec un
 * scintillement pendant le chargement.
 *
 * Le point important est qu'il y a **trois** etats a distinguer, pas deux :
 *
 *   vide       il n'y a pas de photo pour ce signalement — c'est normal
 *   chargement la photo arrive
 *   echec      la photo existe mais n'a pas pu etre recuperee
 *
 * Les afficher tous les trois comme un carre gris identique rendait un echec
 * indiscernable d'un chargement qui n'en finit pas : sans `onError`, l'etat
 * « charge » ne basculait jamais et le carre gris restait indefiniment.
 * Chaque etat a maintenant son propre visuel, et un echec se reessaie d'un clic.
 */
export const BlurryImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  placeholderColor,
  onClick,
  // Extraits explicitement : laisses dans `...props`, ils etaient repandus
  // apres nos propres gestionnaires et les ecrasaient — un parent passant
  // son `onLoad` empechait l'image de sortir de l'etat « chargement ».
  onLoad: onLoadParent,
  onError: onErrorParent,
  loading: loadingParent,
  style: styleParent,
  ...props
}) => {
  const [etat, setEtat] = useState('chargement');
  const [essai, setEssai] = useState(0);

  // Reinitialisation quand la source change, faite pendant le rendu plutot
  // que dans un effet. Un effet se serait declenche aussi au montage, et
  // aurait donc annule l'etat calcule juste avant par le rappel de ref
  // ci-dessous. Ce couplage a l'ordre des effets etait invisible dans le
  // navigateur — il se rattrapait au rendu suivant — mais bien reel.
  const [srcPrecedente, setSrcPrecedente] = useState(src);
  if (src !== srcPrecedente) {
    setSrcPrecedente(src);
    setEtat('chargement');
    setEssai(0);
  }

  // Une image deja en cache peut finir de charger AVANT que React n'attache
  // son gestionnaire : l'evenement `load` passe alors inapercu et l'image
  // reste indefiniment a opacite zero, derriere son scintillement. C'est ce
  // qui faisait que certaines vignettes s'affichaient et d'autres non, sans
  // logique apparente — les seules a echouer etaient celles deja vues.
  // `complete` est la seule facon de rattraper un chargement deja termine ;
  // on le lit au moment ou React nous donne l'element.
  const attacherImage = useCallback((img) => {
    if (img && img.complete) {
      setEtat(img.naturalWidth > 0 ? 'charge' : 'echec');
    }
  }, []);

  const handleLoad = (e) => {
    setEtat('charge');
    onLoadParent?.(e);
  };

  const handleError = (e) => {
    setEtat('echec');
    onErrorParent?.(e);
  };

  // Un clic sur une image en echec la reessaie. Le parametre de cache-busting
  // force le navigateur a redemander plutot que de resservir son echec.
  const reessayer = useCallback((e) => {
    e.stopPropagation();
    setEtat('chargement');
    setEssai((n) => n + 1);
  }, []);

  const fond = placeholderColor ? { backgroundColor: placeholderColor } : undefined;

  // Pas de source : ce n'est pas une erreur, c'est un signalement sans photo.
  if (!src) {
    return (
      <div
        className={`blurry-image-container blurry-image-vide ${className}`}
        style={{ ...fond, ...style }}
        onClick={onClick}
        role="img"
        aria-label={alt || 'Aucune photo'}
        title="Aucune photo"
      >
        <Gallery size="45%" variant="Linear" color="currentColor" aria-hidden="true" />
      </div>
    );
  }

  const wrapperStyles = {
    position: style.position || 'relative',
    overflow: 'hidden',
    display: style.display || 'inline-block',
    ...fond,
    ...style,
  };

  const imgStyles = {
    width: '100%',
    height: '100%',
    objectFit: style.objectFit || 'cover',
    borderRadius: style.borderRadius,
    ...styleParent,
  };

  if (etat === 'echec') {
    return (
      <button
        type="button"
        className={`blurry-image-container blurry-image-echec ${className}`}
        style={wrapperStyles}
        onClick={reessayer}
        title="La photo n'a pas pu être chargée. Cliquez pour réessayer."
      >
        <GallerySlash size="45%" variant="Linear" color="currentColor" aria-hidden="true" />
        <span className="sr-only">
          {alt ? `${alt} : photo indisponible.` : 'Photo indisponible.'} Réessayer.
        </span>
      </button>
    );
  }

  return (
    <div className={`blurry-image-container ${className}`} style={wrapperStyles} onClick={onClick}>
      {etat !== 'charge' && <div className="blurry-image-placeholder" aria-hidden="true" />}
      <img
        ref={attacherImage}
        {...props}
        src={essai > 0 ? `${src}${src.includes('?') ? '&' : '?'}r=${essai}` : src}
        alt={alt}
        // Les vignettes hors ecran se disputaient les connexions avec celles
        // que l'utilisateur regarde. Elles attendent maintenant leur tour.
        loading={loadingParent || 'lazy'}
        decoding="async"
        className={`blurry-image-el ${etat === 'charge' ? 'loaded' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
        style={imgStyles}
      />
    </div>
  );
};

export default BlurryImage;
