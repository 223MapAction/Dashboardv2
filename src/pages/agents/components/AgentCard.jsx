import { Call, Calendar } from 'iconsax-react';
import { AgentIdentity, AgentRoleBadge } from './AgentIdentity';
import { AgentCodeChip } from './AgentCodeChip';
import { TableActionsMenu } from '../../../components/molecules/TableActionsMenu';
import { formatTelephone, telLien, formatDateLongue } from '../format';

/**
 * Fiche d'un agent : identité, rôle, code d'accès, moyen de le joindre.
 *
 * Le téléphone est une ACTION et non une donnée — un lien `tel:` qui lance
 * l'appel. Pour des agents de terrain au Mali, c'est le canal réel ; l'e-mail
 * reste affiché sous le nom mais ne prétend pas être un moyen de contact.
 */
export const AgentCard = ({ agent, actions = [] }) => {
  const tel = formatTelephone(agent.phone);

  return (
    <article className={`agent-card${agent.status === 'inactive' ? ' is-inactive' : ''}`}>
      <div className="agent-card-tete">
        <AgentIdentity agent={agent} taille={44} />
        {actions.length > 0 && (
          <TableActionsMenu
            ariaLabel={`Actions sur ${agent.fullName}`}
            actions={actions}
          />
        )}
      </div>

      <AgentRoleBadge role={agent.role} />

      <AgentCodeChip code={agent.agentCode} />

      <dl className="agent-card-meta">
        {tel && (
          <div className="agent-meta-ligne">
            <dt><Call size={14} variant="Linear" color="currentColor" /><span className="sr-only">Téléphone</span></dt>
            <dd>
              <a href={telLien(agent.phone)} onClick={(e) => e.stopPropagation()}>
                {tel}
              </a>
            </dd>
          </div>
        )}
        {agent.joinedAt && (
          <div className="agent-meta-ligne">
            <dt><Calendar size={14} variant="Linear" color="currentColor" /><span className="sr-only">Dans l’équipe depuis</span></dt>
            <dd>{formatDateLongue(agent.joinedAt)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
};

export default AgentCard;
