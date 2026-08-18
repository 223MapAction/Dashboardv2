import React from 'react';
import { Briefcase, ClipboardTick, Crown1, Danger, Eye, People, ShieldTick } from 'iconsax-react';

// Libelles, couleurs et icones des badges d'un signalement. Ces fonctions ne
// lisent que le signalement qu'on leur passe : elles etaient declarees dans le
// corps du composant, ou elles se melaient a la logique de la page sans jamais
// en dependre.

export const getStatusBadge = (safeSignalement) => {
  switch (safeSignalement.etat) {
    case 'resolved':
      return safeSignalement.isOwner
        ? {
          label: 'Résolu (Moi)',
          color: 'var(--color-success-text)',
          bg: 'rgba(var(--rgb-success), 0.12)',
          border: 'rgba(var(--rgb-success), 0.3)',
          icon: <ShieldTick size={14} variant="Bold" color="var(--color-success)" style={{ marginRight: '6px' }} />
        }
        : {
          label: 'Résolu (Autre)',
          color: 'var(--color-text-secondary)',
          bg: 'rgba(var(--rgb-text-muted), 0.12)',
          border: 'rgba(var(--rgb-text-muted), 0.3)',
          icon: <ShieldTick size={14} variant="Bold" color="var(--color-text-secondary)" style={{ marginRight: '6px' }} />
        };
    case 'taken_into_account':
      return safeSignalement.isOwner
        ? {
          label: 'Pris en compte (Moi)',
          color: 'var(--color-primary-text)',
          bg: 'rgba(var(--rgb-primary), 0.12)',
          border: 'rgba(var(--rgb-primary), 0.3)',
          icon: <ClipboardTick size={14} variant="Bold" color="var(--color-primary)" style={{ marginRight: '6px' }} />
        }
        : {
          label: 'Pris en compte (Autre)',
          color: 'var(--color-warning-text)',
          bg: 'rgba(var(--rgb-warning), 0.12)',
          border: 'rgba(var(--rgb-warning), 0.3)',
          icon: <ClipboardTick size={14} variant="Bold" color="var(--color-warning)" style={{ marginRight: '6px' }} />
        };
    case 'declared':
    default:
      return {
        label: 'Déclaré',
        color: 'var(--color-danger-text)',
        bg: 'rgba(var(--rgb-danger), 0.12)',
        border: 'rgba(var(--rgb-danger), 0.3)',
        icon: <Danger size={14} variant="Bold" color="var(--color-danger)" style={{ marginRight: '6px' }} />
      };
  }
};


export const getModeBadge = (safeSignalement) => {
  if (!safeSignalement?.take_in_charge_mode) return null;
  const isInternal = safeSignalement.take_in_charge_mode === 'internal' || safeSignalement.take_in_charge_mode === 'interne';
  return isInternal
    ? {
      label: 'Interne',
      color: 'var(--color-danger-text)',
      bg: 'rgba(var(--rgb-danger), 0.12)',
      border: 'rgba(var(--rgb-danger), 0.3)',
      icon: <Briefcase size={14} variant="Bold" color="var(--color-danger)" style={{ marginRight: '6px' }} />
    }
    : {
      label: 'Collaboratif',
      color: 'var(--color-primary-text)',
      bg: 'rgba(var(--rgb-primary), 0.12)',
      border: 'rgba(var(--rgb-primary), 0.3)',
      icon: <People size={14} variant="Bold" color="var(--color-primary)" style={{ marginRight: '6px' }} />
    };
};

export const getUserRoleBadge = (safeSignalement) => {
  const roleVal = safeSignalement?.role || safeSignalement?.userRole;
  if (!roleVal) return null;

  const normalizedRole = roleVal.toLowerCase();
  if (normalizedRole === 'observer' || normalizedRole === 'observateur') {
    return {
      label: 'Observateur',
      color: 'var(--color-text-secondary)',
      bg: 'rgba(var(--rgb-text-secondary), 0.12)',
      border: 'rgba(var(--rgb-text-secondary), 0.3)',
      icon: <Eye size={14} variant="Bold" color="var(--color-text-secondary)" style={{ marginRight: '6px' }} />
    };
  }
  if (normalizedRole === 'contributor' || normalizedRole === 'contributeur') {
    return {
      label: 'Contributeur',
      color: 'var(--color-primary-text)',
      bg: 'rgba(var(--rgb-primary), 0.12)',
      border: 'rgba(var(--rgb-primary), 0.3)',
      icon: <People size={14} variant="Bold" color="var(--color-primary)" style={{ marginRight: '6px' }} />
    };
  }
  if (normalizedRole === 'leader') {
    return {
      label: 'Leader',
      color: 'var(--color-warning-text)',
      bg: 'rgba(var(--rgb-warning), 0.12)',
      border: 'rgba(var(--rgb-warning), 0.3)',
      icon: <Crown1 size={14} variant="Bold" color="var(--color-warning)" style={{ marginRight: '6px' }} />
    };
  }
  return null;
};

export const getCollabBadgeStyle = (status) => {
  const norm = status?.toLowerCase();
  const isAccepted = norm === 'accepted' || norm === 'in-progress';
  const isPending = norm === 'pending';
  const isRejected = norm === 'rejected' || norm === 'refused';

  if (isAccepted) {
    return {
      color: 'var(--color-success-text)',
      bg: 'rgba(var(--rgb-success), 0.12)',
      border: 'rgba(var(--rgb-success), 0.3)'
    };
  } else if (isPending) {
    return {
      color: 'var(--color-warning-text)',
      bg: 'rgba(var(--rgb-warning), 0.12)',
      border: 'rgba(var(--rgb-warning), 0.3)'
    };
  } else if (isRejected) {
    return {
      color: 'var(--color-danger-text)',
      bg: 'rgba(var(--rgb-danger), 0.12)',
      border: 'rgba(var(--rgb-danger), 0.3)'
    };
  }
  return {
    color: 'var(--color-text-secondary)',
    bg: 'rgba(var(--rgb-text-secondary), 0.12)',
    border: 'rgba(var(--rgb-text-secondary), 0.3)'
  };
};

export const getRoleLabel = (r) => {
  if (!r) return '';
  const norm = r.toLowerCase();
  if (norm === 'leader') return 'Leader';
  if (norm === 'contributor' || norm === 'contributeur') return 'Contributeur';
  if (norm === 'observer' || norm === 'observateur') return 'Observateur';
  return r;
};

export const getStatusLabel = (s) => {
  if (!s) return '';
  const norm = s.toLowerCase();
  if (norm === 'accepted' || norm === 'in-progress') return 'Acceptée';
  if (norm === 'pending') return 'En attente';
  if (norm === 'rejected' || norm === 'refused') return 'Refusée';
  return s;
};
