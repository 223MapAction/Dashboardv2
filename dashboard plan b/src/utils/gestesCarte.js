/**
 * Active les « gestes coopératifs » de Mapbox sur écran tactile.
 *
 * Le comportement obtenu :
 *   un doigt    → la page défile, la carte ne bouge pas
 *   deux doigts → la carte se déplace et se zoome
 *
 * Pourquoi ce détour. Mapbox expose une option `cooperativeGestures` qui fait
 * exactement cela, et mapbox-gl v3 la connaît — elle figure dans les options
 * par défaut de son constructeur. Mais react-map-gl v8 ne la transmet pas :
 * son bundle n'en contient aucune occurrence, là où `scrollZoom`, `dragPan` et
 * les autres y sont. On pose donc le drapeau nous-mêmes, après création.
 *
 * Uniquement sur pointeur grossier : le mode coopératif impose aussi
 * Ctrl+molette pour zoomer, ce qui n'a pas de sens avec une souris. Le test
 * porte sur `pointer` et non `any-pointer` : c'est le pointeur PRINCIPAL qui
 * compte, sans quoi un portable à écran tactile perdrait son zoom à la molette.
 *
 * `_cooperativeGestures` est une propriété interne de Mapbox. Les garde-fous
 * ci-dessous font que si sa forme change dans une version ultérieure, on
 * retombe sur le comportement d'avant plutôt que de casser.
 *
 * @param {object} carte instance Mapbox (via `ref.current.getMap()`)
 * @returns {boolean} true si le mode a pu être activé
 */
export const activerGestesCooperatifs = (carte) => {
  if (!carte || typeof window === 'undefined') return false;
  if (!window.matchMedia('(pointer: coarse)').matches) return false;

  // Absente ? Cette version de Mapbox ne fonctionne plus ainsi : on ne touche
  // à rien plutôt que d'inventer un comportement.
  if (typeof carte._cooperativeGestures === 'undefined') return false;
  if (carte._cooperativeGestures) return true; // déjà actif

  carte._cooperativeGestures = true;

  // `enable()` SEUL, jamais `disable()` d'abord.
  //
  // Les gestionnaires ne lisent ce drapeau qu'à leur activation : c'est là que
  // Mapbox crée le voile « deux doigts » et cesse de réagir à un seul doigt.
  // Mais `disable()` suppose ce voile déjà présent et lève sinon
  // (`Cannot read properties of undefined (reading 'remove')`) — mesuré. Un
  // `enable()` sur un gestionnaire déjà actif est sans effet de bord.
  for (const nom of ['dragPan', 'touchZoomRotate', 'scrollZoom']) {
    carte[nom]?.enable?.();
  }

  // Mapbox écrit son message en anglais ; le reste de l'application est en
  // français. Le passer par l'option `locale` supposerait que react-map-gl la
  // transmette — ce qu'on ne peut pas tenir pour acquis, vu le reste.
  const voile = carte.getContainer?.()?.querySelector('.mapboxgl-touch-pan-blocker');
  if (voile) voile.textContent = 'Utilisez deux doigts pour déplacer la carte';

  return true;
};

export default activerGestesCooperatifs;
