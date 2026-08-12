/* eslint-disable react-refresh/only-export-components --
   Ce module decrit des donnees, pas des composants : il exporte un tableau de
   colonnes et trois traductions. Il porte l'extension .jsx uniquement parce
   que les fonctions `rendu` retournent du JSX. */
import { BlurryImage } from '../../components/atoms/BlurryImage';
import { SECTORS, TYPES, COUNTRIES } from './data/organisations';

/**
 * Description des colonnes de la liste des organisations.
 *
 * Sortie du composant pour deux raisons : elle n'a besoin d'aucun etat — les
 * trois traductions ci-dessous sont des fonctions pures qui n'etaient dans le
 * composant que par habitude — et une fois dehors, elle se teste.
 *
 * ResponsiveTable en fait un tableau au-dessus de 900px et des cartes en
 * dessous ; `priorite` dit ou chaque colonne se pose sur la carte.
 */

const traduire = (liste, valeur) => {
  if (!valeur) return '';
  const trouve = liste.find((o) => o.en === valeur || o.fr === valeur);
  return trouve ? trouve.fr : valeur;
};

export const libelleSecteur = (v) => traduire(SECTORS, v);
export const libelleType = (v) => traduire(TYPES, v);
export const libellePays = (v) => traduire(COUNTRIES, v);

const secondaire = {
  fontSize: 'var(--font-size-body-small)',
  color: 'var(--color-text-secondary)',
};

export const COLONNES_ORGANISATIONS = [
  {
    id: 'organisation',
    entete: 'Organisation',
    priorite: 'titre',
    rendu: (org) => (
      <div className="orgs-table-org">
        {org.logo_url ? (
          <BlurryImage
            src={org.logo_url}
            alt={org.name}
            className="orgs-avatar"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="orgs-avatar" style={{ backgroundColor: org.color }}>
            {(org.acronym || org.name || '?').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <span className="orgs-table-org-name">{org.name}</span>
          <span className="orgs-table-org-type">{libelleType(org.type)}</span>
        </div>
      </div>
    ),
    // Sur la carte, le logo passe en bandeau : le titre n'a plus a le porter.
    renduCarte: (org) => (
      <>
        <span className="orgs-table-org-name">{org.name}</span>
        <span className="orgs-table-org-type">{libelleType(org.type)}</span>
      </>
    ),
  },
  {
    id: 'secteur',
    entete: 'Secteur',
    priorite: 'detail',
    rendu: (org) => <span style={secondaire}>{libelleSecteur(org.sector)}</span>,
  },
  {
    id: 'localisation',
    entete: 'Localisation',
    priorite: 'sousTitre',
    rendu: (org) => (
      <span style={secondaire}>
        {[org.city, libellePays(org.country)].filter(Boolean).join(', ')}
      </span>
    ),
  },
  {
    id: 'signalements',
    entete: 'Signalements prise en compte',
    // Le libelle complet tient dans une en-tete de colonne, pas dans la
    // largeur d'un libelle de carte.
    enteteCarte: 'Signalements',
    priorite: 'detail',
    rendu: (org) => (
      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{org.activeProjects}</span>
    ),
  },
  {
    id: 'membres',
    entete: 'Membres',
    priorite: 'detail',
    rendu: (org) => (
      <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
        {Number(org.membersCount || 0).toLocaleString('fr')}
      </span>
    ),
  },
  {
    id: 'statut',
    entete: 'Statut',
    priorite: 'marquant',
    rendu: (org) => (
      <span className={`orgs-status orgs-status-${org.status}`}>
        <span className="orgs-status-dot" />
        {org.status === 'active' ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

/** Le bandeau de carte : le logo, quand il y en a un. */
export const mediaOrganisation = (org) =>
  (org.logo_url ? <BlurryImage src={org.logo_url} alt={org.name} /> : null);

export default COLONNES_ORGANISATIONS;
