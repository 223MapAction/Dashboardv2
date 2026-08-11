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
 * @param {Array}    colonnes  [{ id, entete, priorite, rendu, classeEntete }]
 * @param {Array}    donnees
 * @param {Function} cleDe     (item) => string — la cle React
 * @param {Function} [actions] (item) => node — menu place a droite
 * @param {Function} [onLigneClick]
 * @param {Function} [classeLigne]  (item) => string
 * @param {Function} [accentDe] (item) => string | null — couleur du lisere de carte
 * @param {string}   [libelleListe] nom de la liste pour les lecteurs d'ecran
 */
export const ResponsiveTable = ({
  colonnes,
  donnees = [],
  cleDe,
  actions,
  onLigneClick,
  classeLigne,
  accentDe,
  libelleListe,
  // Chaque page garde ses propres styles de tableau. Sans ca, une seule
  // feuille de style s'appliquerait aux trois listes et les toucherait
  // toutes des qu'on en ajuste une.
  classeTable = 'incident-table',
  classeWrap = 'incident-table-wrap',
  className = '',
}) => {
  const compacte = useListeCompacte();

  if (compacte) {
    return (
      <ul className={`rt-cartes ${className}`} aria-label={libelleListe}>
        {donnees.map((item) => (
          <CarteLigne
            key={cleDe(item)}
            item={item}
            colonnes={colonnes}
            actions={actions}
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
            {actions && <th className="incident-th-actions">Actions</th>}
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

const CarteLigne = ({ item, colonnes, actions, onClick, classeLigne, accent }) => {
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
      <div className="rt-carte-tete">
        {/* Le titre est cliquable, pas la carte entiere : sur une carte qui
            contient deja un menu et parfois un lien telephonique, un clic
            attrape-tout declenche la navigation quand on visait autre chose. */}
        <div className="rt-carte-identite">
          {onClick ? (
            <button type="button" className="rt-carte-lien" onClick={() => onClick(item)}>
              {titres.map((c) => <span key={c.id}>{c.rendu(item)}</span>)}
            </button>
          ) : (
            titres.map((c) => <span key={c.id}>{c.rendu(item)}</span>)
          )}
          {sousTitres.map((c) => (
            <div key={c.id} className="rt-carte-soustitre">{c.rendu(item)}</div>
          ))}
        </div>

        {actions && <div className="rt-carte-actions">{actions(item)}</div>}
      </div>

      {marquants.length > 0 && (
        <div className="rt-carte-marquants">
          {marquants.map((c) => <div key={c.id}>{c.rendu(item)}</div>)}
        </div>
      )}

      {details.length > 0 && (
        /* <dl> et non des <div> : c'est ce qui indique a un lecteur d'ecran que
           « Mode » et « Interne » vont ensemble. Deux <span> cote a cote ne le
           disent pas — on entendrait une suite de mots sans appariement. */
        <dl className="rt-carte-details">
          {details.map((c) => (
            <div key={c.id} className="rt-paire">
              <dt>{c.entete}</dt>
              <dd>{c.rendu(item)}</dd>
            </div>
          ))}
        </dl>
      )}

      {blocs.map((c) => (
        <section key={c.id} className="rt-carte-bloc">
          <h3 className="rt-carte-bloc-titre">{c.entete}</h3>
          {c.rendu(item)}
        </section>
      ))}
    </li>
  );
};

export default ResponsiveTable;
