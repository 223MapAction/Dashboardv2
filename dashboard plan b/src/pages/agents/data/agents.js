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


export const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#3AA2DD', '#1E40AF', '#A855F7', '#EC4899',
  '#10B981', '#6366F1',
];
