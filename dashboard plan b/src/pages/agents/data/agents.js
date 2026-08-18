// La palette d'avatars est partagee avec les pages signalements et
// interventions : elle vit desormais dans src/utils.
export { AVATAR_COLORS } from '../../../utils/couleursAvatar';

// Fake data — liste des agents

export const ROLES = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'Accès complet à toute la plateforme',
    color: '#EF4444',
    mobileOnly: false,
  },
  {
    id: 'bureau',
    label: 'Agent de bureau',
    description: 'Gère les collaborateurs — accès dashboard uniquement',
    color: '#3AA2DD',
    mobileOnly: false,
  },
  {
    id: 'terrain',
    label: 'Agent de terrain',
    description: 'Accès mobile uniquement — aucun accès administration',
    color: '#22C55E',
    mobileOnly: true,
  },
];


