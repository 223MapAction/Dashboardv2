import { AgentIdentity, AgentRoleBadge } from './AgentIdentity';
import { AgentCodeChip } from './AgentCodeChip';
import { TableActionsMenu } from '../../../components/molecules/TableActionsMenu';
import { formatTelephone, telLien, formatDateCourte } from '../format';

/**
 * Ligne dense, pour les équipes nombreuses.
 *
 * Ce n'est volontairement pas un <table> : une grille CSS se replie en deux
 * puis trois lignes sur écran étroit, alors qu'un tableau aurait imposé le
 * défilement horizontal que les utilisateurs nous ont justement reproché.
 */
export const AgentListRow = ({ agent, actions = [] }) => (
  <li className={`agent-ligne${agent.status === 'inactive' ? ' is-inactive' : ''}`}>
    <div className="agent-ligne-identite">
      <AgentIdentity agent={agent} taille={36} />
    </div>

    <div className="agent-ligne-role">
      <AgentRoleBadge role={agent.role} />
    </div>

    <div className="agent-ligne-code">
      <AgentCodeChip code={agent.agentCode} />
    </div>

    <div className="agent-ligne-tel">
      {agent.phone
        ? <a href={telLien(agent.phone)}>{formatTelephone(agent.phone)}</a>
        : <span className="agent-vide">—</span>}
    </div>

    <div className="agent-ligne-date">{formatDateCourte(agent.joinedAt)}</div>

    <div className="agent-ligne-actions">
      {actions.length > 0 && (
        <TableActionsMenu ariaLabel={`Actions sur ${agent.fullName}`} actions={actions} />
      )}
    </div>
  </li>
);

export default AgentListRow;
