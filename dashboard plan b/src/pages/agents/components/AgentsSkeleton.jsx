import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';

/**
 * Squelette de chargement de l'équipe.
 *
 * Il reproduit la vue réellement affichée. L'ancien squelette dessinait le
 * tableau d'avant la refonte : le contenu sautait d'une mise en page à l'autre
 * une fois chargé. Un squelette qui ment sur ce qui arrive est pire que pas de
 * squelette du tout.
 */
export const AgentsSkeleton = ({ vue = 'fiches' }) => (
  <section className="agents-groupe" aria-hidden="true">
    <div className="agents-squelette-titre">
      <ShimmerThumbnail height={14} width={110} rounded />
    </div>

    {vue === 'fiches' ? (
      <div className="agents-grille">
        {[0, 1, 2].map((i) => (
          <div className="agent-card agents-squelette-carte" key={i}>
            <div className="agent-card-tete">
              <div className="agent-identity">
                <ShimmerCircularImage size={44} />
                <div className="agent-identity-texte" style={{ flex: 1 }}>
                  <ShimmerTitle line={1} gap={4} width={130} />
                  <ShimmerText line={1} width={150} />
                </div>
              </div>
            </div>
            <ShimmerThumbnail height={20} width={104} rounded />
            <ShimmerThumbnail height={34} rounded />
            <div className="agent-card-meta">
              <ShimmerText line={2} gap={8} />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <ul className="agents-liste">
        {[0, 1, 2].map((i) => (
          <li className="agent-ligne" key={i}>
            <div className="agent-ligne-identite">
              <div className="agent-identity">
                <ShimmerCircularImage size={36} />
                <div className="agent-identity-texte" style={{ flex: 1 }}>
                  <ShimmerTitle line={1} gap={4} width={120} />
                  <ShimmerText line={1} width={140} />
                </div>
              </div>
            </div>
            <div className="agent-ligne-role"><ShimmerThumbnail height={20} width={100} rounded /></div>
            <div className="agent-ligne-code"><ShimmerThumbnail height={30} width={120} rounded /></div>
            <div className="agent-ligne-tel"><ShimmerText line={1} width={110} /></div>
            <div className="agent-ligne-date"><ShimmerText line={1} width={70} /></div>
            <div className="agent-ligne-actions"><ShimmerThumbnail height={30} width={30} rounded /></div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default AgentsSkeleton;
