/**
 * Palette des pastilles d'avatar.
 *
 * Ces dix couleurs ne portent aucun sens : elles servent uniquement a
 * distinguer une personne d'une autre quand aucune photo n'est disponible. La
 * couleur est choisie en indexant cette liste par l'identifiant de l'agent, ce
 * qui garantit que la meme personne garde toujours la meme pastille.
 *
 * Elles restent litterales, et c'est volontaire : une couleur tiree par
 * hachage doit etre une vraie valeur, pas un var() que le calcul ne peut pas
 * comparer. C'est aussi pour cela qu'elles ne suivent pas la palette
 * semantique — un avatar rouge ne signale pas un probleme.
 *
 * Cette liste existait a l'identique dans six fichiers. Elle n'existe plus
 * qu'ici.
 */
export const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#3AA2DD', '#1E40AF', '#A855F7', '#EC4899',
  '#10B981', '#6366F1',
];

/** Couleur de repli quand aucun identifiant n'est exploitable. */
export const AVATAR_COULEUR_DEFAUT = '#3AA2DD';

/** Pastille stable pour un identifiant donne. */
export const couleurAvatarPour = (id) => {
  const n = Number(id);
  if (!Number.isFinite(n)) return AVATAR_COULEUR_DEFAUT;
  return AVATAR_COLORS[Math.abs(Math.trunc(n)) % AVATAR_COLORS.length];
};
