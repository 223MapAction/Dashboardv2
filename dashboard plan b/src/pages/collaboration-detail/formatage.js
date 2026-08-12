// Mise en forme et classes CSS des libelles de collaboration.
//
// Ces fonctions etaient declarees a l'interieur du composant alors qu'elles ne
// lisent aucun etat : elles etaient donc recreees a chaque rendu, et surtout
// elles gonflaient un fichier qu'on ne pouvait deja plus lire d'un bout a
// l'autre. Isolees ici, elles sont testables seules.


export const formatFailureReason = (reason) => {
  if (!reason) return '';
  try {
    let clean = reason;
    if (clean.includes("{'") || clean.includes('{"')) {
      clean = clean.replace(/'/g, '"');
      const parsed = JSON.parse(clean);
      if (parsed.failure_reason) return parsed.failure_reason;
      if (typeof parsed === 'object') {
        return Object.values(parsed).flat().join(', ');
      }
    }
    return reason;
  } catch {
    let clean = reason.replace(/\{'failure_reason':\s*'/g, '').replace(/'\}/g, '');
    clean = clean.replace(/\{"failure_reason":\s*"/g, '').replace(/"\}/g, '');
    return clean;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const dayAndMonth = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dayAndMonth} à ${time}`;
  } catch {
    return dateStr;
  }
};

export const formatEtat = (etat) => {
  if (!etat) return 'Inconnu';
  switch (etat) {
    case 'taken_into_account':
      return 'Pris en compte';
    case 'resolved':
      return 'Résolu';
    case 'pending':
      return 'En attente';
    default:
      return etat.charAt(0).toUpperCase() + etat.slice(1);
  }
};

export const getEtatBadgeClass = (etat) => {
  switch (etat) {
    case 'taken_into_account':
      return 'badge-primary';
    case 'resolved':
      return 'badge-success';
    case 'pending':
      return 'badge-warning';
    default:
      return 'badge-info';
  }
};

export const formatStatus = (status) => {
  if (!status) return 'Inconnu';
  switch (status) {
    case 'accepted':
      return 'Acceptée';
    case 'pending':
      return 'En attente';
    case 'rejected':
      return 'Refusée';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'accepted':
      return 'badge-success';
    case 'pending':
      return 'badge-warning';
    case 'rejected':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

export const formatRole = (role) => {
  if (!role) return 'Membre';
  switch (role) {
    case 'leader':
      return 'Leader';
    case 'contributeur':
      return 'Contributeur';
    case 'observateur':
      return 'Observateur';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'leader':
      return 'badge-warning';
    case 'contributeur':
      return 'badge-primary';
    case 'observateur':
      return 'badge-info';
    default:
      return 'badge-primary';
  }
};
