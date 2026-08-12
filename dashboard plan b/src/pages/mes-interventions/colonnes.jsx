import { BlurryImage } from '../../components/atoms/BlurryImage';
import { DocumentText } from 'iconsax-react';

/**
 * Description des colonnes de « Mes interventions ».
 *
 * C'est une fabrique et non une constante : deux cellules ont besoin de la
 * page. Elles sont passees en parametres plutot qu'importees, ce qui garde ce
 * module sans SWR ni contexte — donc verifiable sans echafaudage.
 *
 * Neuf colonnes : c'est la liste qui souffrait le plus du defilement
 * horizontal sur telephone. ResponsiveTable en fait un tableau au-dessus de
 * 900px et des cartes en dessous ; `priorite` dit ou chacune se pose.
 *
 * @param {Function} onOuvrirRapports (incident) => void
 * @param {Function} RenduEquipe      composant affichant les agents assignes
 */
export const creerColonnesInterventions = ({ onOuvrirRapports, RenduEquipe }) => [
  {
    id: 'signalement', entete: 'Signalement', priorite: 'titre',
    rendu: (incident) => (
      <>
          <div className="mes-interventions-main-cell">
            <BlurryImage
              src={incident.image}
              alt={incident.title}
              className="mes-interventions-img"
            />
            <div>
              <span className="mes-interventions-row-title">
                {incident.title || 'Sans titre'}
              </span>
              <span className="mes-interventions-row-desc">
                {incident.description
                  ? incident.description.substring(0, 80) +
                  (incident.description.length > 80 ? '...' : '')
                  : 'Aucune description disponible.'}
              </span>
            </div>
          </div>
      </>
    ),
    renduCarte: (incident) => (
      <>
        <span className="mes-interventions-row-title">
          {incident.title || 'Sans titre'}
        </span>
        {incident.description && (
          <span className="mes-interventions-row-desc">
            {incident.description.substring(0, 80)}
            {incident.description.length > 80 ? '…' : ''}
          </span>
        )}
      </>
    ),
  },
  {
    id: 'localisation', entete: 'Localisation', priorite: 'sousTitre',
    rendu: (incident) => (
      <>
          {incident.location || 'Inconnue'}
      </>
    ),
  },
  {
    id: 'mode', entete: 'Mode', priorite: 'detail',
    rendu: (incident) => (
      <>
          {incident.take_in_charge_mode && (
            <span className={`take-in-charge-tag ${incident.take_in_charge_mode}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              backgroundColor: (incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? 'rgba(58, 162, 221, 0.12)' : 'rgba(168, 85, 247, 0.12)',
              color: (incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? 'var(--color-primary)' : '#A855F7',
              border: (incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? '1px solid rgba(58, 162, 221, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              {(incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? 'Interne' : 'Collaboratif'}
            </span>
          ) || (
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Non spécifié</span>
            )}
      </>
    ),
  },
  {
    id: 'declaration', entete: 'Date de déclaration', priorite: 'detail',
    rendu: (incident) => (
      <>
          {incident.startDate}
      </>
    ),
  },
  {
    id: 'resolution', entete: 'Date de résolution', priorite: 'detail',
    rendu: (incident) => (
      <>
          {incident.endDate === 'En cours' ? (
            <span className="mes-interventions-date-badge is-pending">En cours</span>
          ) : (
            <span className="mes-interventions-date-badge is-resolved">{incident.endDate}</span>
          )}
      </>
    ),
  },
  {
    id: 'progression', entete: 'Progression', priorite: 'marquant',
    rendu: (incident) => (
      <>
          <div className="mes-interventions-progress-container">
            <div className="mes-interventions-progress-bar-bg">
              <div
                className="mes-interventions-progress-bar-fill"
                style={{ width: `${incident.progressValue}%` }}
              />
            </div>
            <span className="mes-interventions-progress-label">
              {incident.progressValue}%
            </span>
          </div>
      </>
    ),
  },
  {
    id: 'equipe', entete: 'Équipe terrain', priorite: 'detail',
    rendu: (incident) => (
      <>
          <RenduEquipe incident={incident} />
      </>
    ),
  },
  {
    id: 'rapports', entete: 'Rapports', priorite: 'detail',
    rendu: (incident) => (
      <>
          {(() => {
            const reportsCount = incident?.reports_count || 0;
            return (
              <button
                type="button"
                className="rapport-count-btn"
                onClick={(e) => { e.stopPropagation(); onOuvrirRapports(incident); }}
                disabled={reportsCount === 0}
                title={reportsCount > 0 ? `Voir les ${reportsCount} rapport(s)` : 'Aucun rapport'}
              >
                <DocumentText size={16} variant={reportsCount > 0 ? 'Bold' : 'Linear'} color={reportsCount > 0 ? '#3AA2DD' : '#9CA3AF'} />
                <span>{reportsCount}</span>
              </button>
            );
          })()}
      </>
    ),
  },
  {
    id: 'statut', entete: 'Statut', priorite: 'marquant',
    // L'adaptateur fournit toujours un badge aujourd'hui. Le garde-fou est
    // la parce qu'une cellule qui leve fait disparaitre la liste entiere :
    // un champ manquant ne doit couter qu'un libelle par defaut.
    rendu: (incident) => (
      <>
          <span className={`mes-interventions-badge-glow variant-${incident.badge?.variant ?? 'in-progress'}`}
            style={{ width: "max-content" }}
          >
            {incident.badge?.label ?? 'EN COURS'}
          </span>
      </>
    ),
  },
];

/** Le bandeau de carte : la photo du signalement. */
export const mediaIntervention = (incident) =>
  (incident.image ? <BlurryImage src={incident.image} alt={incident.title || 'Photo du signalement'} /> : null);
