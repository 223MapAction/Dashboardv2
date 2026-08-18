import { useState } from 'react';
import { getRoleConfig } from '../roles';

const initiales = (nom = '') =>
  nom.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() || '').join('');

/**
 * Une URL d'avatar n'est exploitable que si elle pointe vers un fichier.
 * L'API renvoie parfois l'URL de l'endpoint lui-même
 * (« …/MapApi/agents/ »), qui ne charge évidemment aucune image : on écarte
 * ces valeurs avant d'even tenter le rendu, plutôt que d'afficher une icône
 * cassée le temps que l'erreur remonte.
 */
const avatarExploitable = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.endsWith('/')) return false;
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url) || url.startsWith('data:image/');
};

/**
 * Avatar + nom + adresse e-mail. Partagé par la vue fiches et la vue liste,
 * pour qu'un agent se présente de la même façon dans les deux.
 */
export const AgentIdentity = ({ agent, taille = 40 }) => {
  const [echecImage, setEchecImage] = useState(false);
  const afficherImage = avatarExploitable(agent.avatar) && !echecImage;

  return (
    <div className="agent-identity">
      <span
        className="agent-avatar"
        style={{
          width: taille,
          height: taille,
          backgroundColor: afficherImage ? 'transparent' : agent.avatarColor,
        }}
      >
        {afficherImage
          ? <img src={agent.avatar} alt="" onError={() => setEchecImage(true)} />
          : <span aria-hidden="true">{initiales(agent.fullName)}</span>}
        <span
          className={`agent-presence agent-presence--${agent.status}`}
          title={agent.status === 'active' ? 'Compte actif' : 'Compte désactivé'}
        />
      </span>

      <span className="agent-identity-texte">
        <span className="agent-nom" title={agent.fullName}>{agent.fullName}</span>
        <span className="agent-email" title={agent.email}>{agent.email}</span>
      </span>
    </div>
  );
};

export const AgentRoleBadge = ({ role }) => {
  const config = getRoleConfig(role);
  return (
    <span className={`agent-role-badge agent-role-badge--${role}`}>
      {config.label}
    </span>
  );
};

export default AgentIdentity;
