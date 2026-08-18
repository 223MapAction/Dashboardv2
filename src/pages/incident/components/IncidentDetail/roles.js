import { Crown1, People, Eye } from 'iconsax-react';

// Les trois roles qu'une organisation peut tenir sur un signalement.
export const ROLE_OPTIONS = [
  {
    id: 'leader',
    label: 'Leader',
    description: 'Pilote l\'action et coordonne les autres organisations',
    icon: Crown1,
    color: 'var(--color-warning-text)'
  },
  {
    id: 'contributeur',
    label: 'Contributeur',
    description: 'Participe activement à la réalisation des tâches',
    icon: People,
    color: 'var(--color-primary-text)'
  },
  {
    id: 'observateur',
    label: 'Observateur',
    description: 'Suit l\'avancement sans participer directement',
    icon: Eye,
    color: 'var(--color-text-secondary)'
  }
];

// Rôles disponibles pour les organisations invitées (sans Leader)
export const ORG_ROLE_OPTIONS = ROLE_OPTIONS.filter(role => role.id !== 'leader');
