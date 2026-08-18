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
 * @param {Function} onOuvrirRapports (signalement) => void
 * @param {Function} RenduEquipe      composant affichant les agents assignes
 */
export const creerColonnesInterventions = ({ onOuvrirRapports, RenduEquipe }) => [
  {
    id: 'signalement', entete: 'Signalement', priorite: 'titre',
    rendu: (signalement) => (
      <>
          <div className="mes-interventions-main-cell">
            <BlurryImage
              src={signalement.image}
              alt={signalement.title}
              className="mes-interventions-img"
            />
            <div>
              <span className="mes-interventions-row-title">
                {signalement.title || 'Sans titre'}
              </span>
              <span className="mes-interventions-row-desc">
                {signalement.description
                  ? signalement.description.substring(0, 80) +
                  (signalement.description.length > 80 ? '...' : '')
                  : 'Aucune description disponible.'}
              </span>
            </div>
          </div>
      </>
    ),
    renduCarte: (signalement) => (
      <>
        <span className="mes-interventions-row-title">
          {signalement.title || 'Sans titre'}
        </span>
        {signalement.description && (
          <span className="mes-interventions-row-desc">
            {signalement.description.substring(0, 80)}
            {signalement.description.length > 80 ? '…' : ''}
          </span>
        )}
      </>
    ),
  },
  {
    id: 'localisation', entete: 'Localisation', priorite: 'sousTitre',
    rendu: (signalement) => (
      <>
          {signalement.location || 'Inconnue'}
      </>
    ),
  },
  {
    id: 'mode', entete: 'Mode', priorite: 'detail',
    rendu: (signalement) => (
      <>
          {signalement.take_in_charge_mode && (
            <span className={`take-in-charge-tag ${signalement.take_in_charge_mode}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: 'var(--font-size-micro)',
              fontWeight: '600',
              backgroundColor: (signalement.take_in_charge_mode === 'internal' || signalement.take_in_charge_mode === 'interne') ? 'rgba(var(--rgb-primary), 0.12)' : 'rgba(var(--rgb-accent), 0.12)',
              color: (signalement.take_in_charge_mode === 'internal' || signalement.take_in_charge_mode === 'interne') ? 'var(--color-primary)' : 'var(--color-accent)',
              border: (signalement.take_in_charge_mode === 'internal' || signalement.take_in_charge_mode === 'interne') ? '1px solid rgba(var(--rgb-primary), 0.3)' : '1px solid rgba(var(--rgb-accent), 0.3)'
            }}>
              {(signalement.take_in_charge_mode === 'internal' || signalement.take_in_charge_mode === 'interne') ? 'Interne' : 'Collaboratif'}
            </span>
          ) || (
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Non spécifié</span>
            )}
      </>
    ),
  },
  {
    id: 'declaration', entete: 'Date de déclaration', priorite: 'detail',
    rendu: (signalement) => (
      <>
          {signalement.startDate}
      </>
    ),
  },
  {
    id: 'resolution', entete: 'Date de résolution', priorite: 'detail',
    rendu: (signalement) => (
      <>
          {signalement.endDate === 'En cours' ? (
            <span className="mes-interventions-date-badge is-pending">En cours</span>
          ) : (
            <span className="mes-interventions-date-badge is-resolved">{signalement.endDate}</span>
          )}
      </>
    ),
  },
  {
    id: 'progression', entete: 'Progression', priorite: 'marquant',
    rendu: (signalement) => (
      <>
          <div className="mes-interventions-progress-container">
            <div className="mes-interventions-progress-bar-bg">
              <div
                className="mes-interventions-progress-bar-fill"
                style={{ width: `${signalement.progressValue}%` }}
              />
            </div>
            <span className="mes-interventions-progress-label">
              {signalement.progressValue}%
            </span>
          </div>
      </>
    ),
  },
  {
    id: 'equipe', entete: 'Équipe terrain', priorite: 'detail',
    rendu: (signalement) => (
      <>
          <RenduEquipe signalement={signalement} />
      </>
    ),
  },
  {
    id: 'rapports', entete: 'Rapports', priorite: 'detail',
    rendu: (signalement) => (
      <>
          {(() => {
            const reportsCount = signalement?.reports_count || 0;
            return (
              <button
                type="button"
                className="rapport-count-btn"
                onClick={(e) => { e.stopPropagation(); onOuvrirRapports(signalement); }}
                disabled={reportsCount === 0}
                title={reportsCount > 0 ? `Voir les ${reportsCount} rapport(s)` : 'Aucun rapport'}
              >
                <DocumentText size={16} variant={reportsCount > 0 ? 'Bold' : 'Linear'} color={reportsCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
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
    rendu: (signalement) => (
      <>
          <span className={`mes-interventions-badge-glow variant-${signalement.badge?.variant ?? 'in-progress'}`}
            style={{ width: "max-content" }}
          >
            {signalement.badge?.label ?? 'EN COURS'}
          </span>
      </>
    ),
  },
];

/** Le bandeau de carte : la photo du signalement. */
export const mediaIntervention = (signalement) =>
  (signalement.image ? <BlurryImage src={signalement.image} alt={signalement.title || 'Photo du signalement'} /> : null);
