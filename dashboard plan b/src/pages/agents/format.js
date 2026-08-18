/**
 * Formatage partagé par les deux vues, pour qu'une même donnée s'affiche de la
 * même façon en fiches et en liste.
 */

/** Numéro affiché par groupes de deux, plus lisible qu'une suite continue. */
export const formatTelephone = (tel) => {
  if (!tel) return null;
  const net = String(tel).replace(/\s/g, '');
  const m = net.match(/^(\+\d{3})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : net;
};

/** Numéro nettoyé pour un lien `tel:`. */
export const telLien = (tel) => (tel ? `tel:${String(tel).replace(/\s/g, '')}` : undefined);

export const formatDateLongue = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatDateCourte = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};
