/**
 * Active les « gestes coopératifs » de MapLibre sur écran tactile.
 *
 * Le comportement obtenu :
 *   un doigt    → la page défile, la carte ne bouge pas
 *   deux doigts → la carte se déplace et se zoome
 *
 * Pourquoi ce détour. MapLibre expose une option `cooperativeGestures` qui
 * fait exactement cela, mais react-map-gl v8 ne la transmet pas : son bundle
 * n'en contient aucune occurrence, là où `scrollZoom`, `dragPan` et les
 * autres y sont. On active donc le gestionnaire nous-mêmes, après création.
 *
 * Contrairement à mapbox-gl (qui n'exposait qu'un drapeau interne
 * `_cooperativeGestures`), MapLibre en fait un gestionnaire public :
 * `carte.cooperativeGestures.enable()`. Les garde-fous ci-dessous font que si
 * sa forme change dans une version ultérieure, on retombe sur le comportement
 * d'avant plutôt que de casser.
 *
 * Par defaut, uniquement sur pointeur grossier (tactile) : le mode coopératif
 * impose aussi Ctrl+molette pour zoomer, ce qui n'a pas toujours de sens avec
 * une souris. Le test porte sur `pointer` et non `any-pointer` : c'est le
 * pointeur PRINCIPAL qui compte, sans quoi un portable à écran tactile
 * perdrait son zoom à la molette.
 *
 * Passer `{ touchOnly: false }` pour l'activer aussi au clavier/souris (page
 * scrollable en dessous d'une petite carte, ex. dashboard) : molette seule
 * scrolle la page, Ctrl+molette zoome la carte.
 *
 * @param {object} carte instance MapLibre (via `ref.current.getMap()`)
 * @param {object} [options]
 * @param {boolean} [options.touchOnly=true]
 * @returns {boolean} true si le mode a pu être activé
 */
export const activerGestesCooperatifs = (carte, { touchOnly = true } = {}) => {
  if (!carte || typeof window === 'undefined') return false;
  if (touchOnly && !window.matchMedia('(pointer: coarse)').matches) return false;

  const gestionnaire = carte.cooperativeGestures;

  // Absent ? Cette version de MapLibre ne fonctionne plus ainsi : on ne touche
  // à rien plutôt que d'inventer un comportement.
  if (!gestionnaire || typeof gestionnaire.enable !== 'function') return false;
  if (gestionnaire.isEnabled?.()) return true; // déjà actif

  gestionnaire.enable();

  // MapLibre écrit son message en anglais ; le reste de l'application est en
  // français. Le passer par l'option `locale` supposerait que react-map-gl la
  // transmette — ce qu'on ne peut pas tenir pour acquis, vu le reste.
  const voile = carte
    .getContainer?.()
    ?.querySelector('.maplibregl-cooperative-gesture-screen, .mapboxgl-cooperative-gesture-screen');
  if (voile) voile.textContent = 'Utilisez deux doigts pour déplacer la carte';

  return true;
};

export default activerGestesCooperatifs;
