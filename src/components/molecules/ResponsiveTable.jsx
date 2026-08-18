import { useListeCompacte } from '../../hooks/useMediaQuery';
import './responsive-table.css';

/**
 * Une liste, deux formes : tableau sur grand ecran, cartes sur telephone.
 *
 * Le probleme qu'il resout : nos tables demandaient un defilement horizontal
 * sur mobile. On aurait pu ecrire deux fois le rendu — un <tr> et une carte —
 * mais les deux auraient derive des la premiere modification d'un badge.
 *
 * Ici chaque page decrit ses colonnes UNE fois. La fonction `rendu` d'une
 * colonne sert aux deux formes ; ce qui change, c'est ou elle est posee. Le
 * champ `priorite` porte cette information :
 *
 *   titre       le nom de la chose — titre de la carte
 *   sousTitre   ce qui le qualifie immediatement (un lieu, un secteur)
 *   marquant    ce qui doit se voir sans lire : statuts, gravite, progression
 *   detail      le reste, en paires libelle / valeur
 *   bloc        un contenu de plusieurs lignes, qui prend toute la largeur
 *
 * `bloc` existe parce que tout ne rentre pas dans une paire : la prise en
 * charge d'un signalement, c'est un nom d'organisation, un badge et une phrase.
 * Aligne a droite dans un <dd>, ce pave devenait illisible.
 *
 * Une colonne sans `priorite` est traitee comme un detail.
 *
 * Trois reglages permettent a une colonne de differer sur la carte, quand la
 * forme change vraiment de nature : `renduCarte`, `enteteCarte`, et la prop
 * `media` ci-dessous. Une vignette de 48px dans un tableau et un bandeau photo
 * pleine largeur ne sont pas le meme objet — les confondre serait pire que de
 * les declarer separement.
 *
 * @param {Array}    colonnes  [{ id, entete, enteteCarte, priorite, rendu, renduCarte, classeEntete }]
 * @param {Array}    donnees
 * @param {Function} cleDe     (item) => string — la cle React
 * @param {Function} [actions] (item) => node — menu place a droite
 * @param {Function} [media]   (item) => node — bandeau en tete de carte (photo)
 * @param {Function} [onLigneClick]
 * @param {Function} [classeLigne]  (item) => string
 * @param {Function} [accentDe] (item) => string | null — couleur du lisere de carte
 * @param {boolean}  [chargement] affiche un squelette a la forme de la vue
 * @param {number}   [lignesSquelette]
 * @param {string}   [libelleListe] nom de la liste pour les lecteurs d'ecran
 */
export const ResponsiveTable = ({
  colonnes,
  donnees = [],
  cleDe,
  actions,
  media,
  onLigneClick,
  classeLigne,
  accentDe,
  chargement = false,
  lignesSquelette = 5,
  libelleListe,
  // Chaque page garde ses propres styles de tableau. Sans ca, une seule
  // feuille de style s'appliquerait aux trois listes et les toucherait
  // toutes des qu'on en ajuste une.
  classeTable = 'signalement-table',
  classeWrap = 'signalement-table-wrap',
  className = '',
}) => {
  const compacte = useListeCompacte();

  // Le squelette suit la meme bascule que le contenu. Le laisser aux pages
  // aurait duplique la media query et, surtout, laisse la table charger en
  // forme de table pendant qu'on attend des cartes : la mise en page sautait.
  if (chargement) {
    return compacte
      ? <SqueletteCartes nombre={lignesSquelette} avecMedia={Boolean(media)} />
      : <SqueletteTable colonnes={colonnes} avecActions={Boolean(actions)}
          nombre={lignesSquelette} classeTable={classeTable} classeWrap={classeWrap} />;
  }

  if (compacte) {
    return (
      <ul className={`rt-cartes ${className}`} aria-label={libelleListe}>
        {donnees.map((item) => (
          <CarteLigne
            key={cleDe(item)}
            item={item}
            colonnes={colonnes}
            actions={actions}
            media={media}
            onClick={onLigneClick}
            classeLigne={classeLigne}
            accent={accentDe?.(item)}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className={classeWrap}>
      <table className={`${classeTable} has-sticky-actions ${className}`}>
        <thead>
          <tr>
            {colonnes.map((c) => (
              <th key={c.id} className={c.classeEntete}>{c.entete}</th>
            ))}
            {actions && <th className="signalement-th-actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {donnees.map((item) => (
            <tr
              key={cleDe(item)}
              onClick={onLigneClick ? () => onLigneClick(item) : undefined}
              className={classeLigne?.(item)}
            >
              {colonnes.map((c) => (
                <td key={c.id}>{c.rendu(item)}</td>
              ))}
              {actions && <td>{actions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CarteLigne = ({ item, colonnes, actions, media, onClick, classeLigne, accent }) => {
  // Sur la carte, une colonne peut fournir son propre rendu et son propre
  // libelle. `rendu` et `entete` restent la valeur par defaut.
  const rendreCarte = (c) => (c.renduCarte || c.rendu)(item);
  const libelle = (c) => c.enteteCarte || c.entete;
  const bandeau = media?.(item);
  const par = (p) => colonnes.filter((c) => (c.priorite || 'detail') === p);
  const titres = par('titre');
  const sousTitres = par('sousTitre');
  const marquants = par('marquant');
  const details = par('detail');
  const blocs = par('bloc');

  return (
    <li
      className={`rt-carte ${classeLigne?.(item) || ''}`}
      style={accent ? { '--rt-accent': accent } : undefined}
    >
      {bandeau && (
        <div className="rt-carte-media">
          {bandeau}
          {actions && <div className="rt-carte-actions rt-carte-actions--sur-media">{actions(item)}</div>}
        </div>
      )}

      <div className="rt-carte-tete">
        {/* Le titre est cliquable, pas la carte entiere : sur une carte qui
            contient deja un menu et parfois un lien telephonique, un clic
            attrape-tout declenche la navigation quand on visait autre chose. */}
        <div className="rt-carte-identite">
          {onClick ? (
            <button type="button" className="rt-carte-lien" onClick={() => onClick(item)}>
              {titres.map((c) => <span key={c.id}>{rendreCarte(c)}</span>)}
            </button>
          ) : (
            titres.map((c) => <span key={c.id}>{rendreCarte(c)}</span>)
          )}
          {sousTitres.map((c) => (
            <div key={c.id} className="rt-carte-soustitre">{rendreCarte(c)}</div>
          ))}
        </div>

        {/* Le menu passe sur le bandeau quand il y en a un : deux menus sur la
            meme carte seraient deux cibles pour une seule action. */}
        {actions && !bandeau && <div className="rt-carte-actions">{actions(item)}</div>}
      </div>

      {marquants.length > 0 && (
        <div className="rt-carte-marquants">
          {marquants.map((c) => <div key={c.id}>{rendreCarte(c)}</div>)}
        </div>
      )}

      {details.length > 0 && (
        /* <dl> et non des <div> : c'est ce qui indique a un lecteur d'ecran que
           « Mode » et « Interne » vont ensemble. Deux <span> cote a cote ne le
           disent pas — on entendrait une suite de mots sans appariement. */
        <dl className="rt-carte-details">
          {details.map((c) => (
            <div key={c.id} className="rt-paire">
              <dt>{libelle(c)}</dt>
              <dd>{rendreCarte(c)}</dd>
            </div>
          ))}
        </dl>
      )}

      {blocs.map((c) => (
        <section key={c.id} className="rt-carte-bloc">
          <h3 className="rt-carte-bloc-titre">{libelle(c)}</h3>
          {rendreCarte(c)}
        </section>
      ))}
    </li>
  );
};

/* ── Squelettes ──────────────────────────────────────────────────────────────
   Ils reprennent la geometrie du contenu reel — bandeau, titre, badges, paires
   — pour qu'aucun bloc ne se deplace au moment ou les donnees arrivent. */

const SqueletteCartes = ({ nombre, avecMedia }) => (
  <ul className="rt-cartes" aria-busy="true" aria-label="Chargement de la liste">
    {Array.from({ length: nombre }, (_, i) => (
      <li className="rt-carte rt-squelette" key={i}>
        {avecMedia && <div className="rt-sq rt-sq-media" />}
        <div className="rt-carte-tete">
          <div className="rt-carte-identite">
            <div className="rt-sq rt-sq-titre" />
            <div className="rt-sq rt-sq-soustitre" />
          </div>
        </div>
        <div className="rt-carte-marquants">
          <div className="rt-sq rt-sq-badge" />
          <div className="rt-sq rt-sq-badge" />
        </div>
        <div className="rt-carte-details">
          <div className="rt-paire"><div className="rt-sq rt-sq-dt" /><div className="rt-sq rt-sq-dd" /></div>
          <div className="rt-paire"><div className="rt-sq rt-sq-dt" /><div className="rt-sq rt-sq-dd" /></div>
        </div>
      </li>
    ))}
  </ul>
);

const SqueletteTable = ({ colonnes, avecActions, nombre, classeTable, classeWrap }) => (
  <div className={classeWrap}>
    <table className={`${classeTable} has-sticky-actions`} aria-busy="true">
      <thead>
        <tr>
          {colonnes.map((c) => <th key={c.id} className={c.classeEntete}>{c.entete}</th>)}
          {avecActions && <th className="signalement-th-actions">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: nombre }, (_, i) => (
          <tr key={i}>
            {colonnes.map((c) => <td key={c.id}><div className="rt-sq rt-sq-cellule" /></td>)}
            {avecActions && <td><div className="rt-sq rt-sq-menu" /></td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ResponsiveTable;
