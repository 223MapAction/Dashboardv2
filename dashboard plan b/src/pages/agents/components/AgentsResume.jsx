/**
 * Ligne de synthèse au-dessus de la liste.
 *
 * Deux états, parce qu'ils répondent à deux questions différentes :
 *
 * — Sans filtre, la question est « de quoi mon équipe est-elle faite ? ».
 *   On donne la répartition.
 * — Avec un filtre, la question devient « qu'est-ce que ma recherche a
 *   ramené ? ». Afficher la répartition globale à ce moment-là induit en
 *   erreur : elle ne bouge pas alors que la liste, elle, a changé.
 */
export const AgentsResume = ({ filtreActif, nbResultats, total, actifs, terrain, admins }) => {
  if (filtreActif) {
    return (
      <p className="agents-effectifs agents-effectifs--filtre" role="status" aria-live="polite">
        {nbResultats === 0 ? (
          <>Aucun résultat sur <strong>{total}</strong> agent{total > 1 ? 's' : ''}</>
        ) : (
          <>
            <strong>{nbResultats}</strong> résultat{nbResultats > 1 ? 's' : ''}
            {' '}sur <strong>{total}</strong> agent{total > 1 ? 's' : ''}
          </>
        )}
      </p>
    );
  }

  return (
    <p className="agents-effectifs">
      <strong>{total}</strong> agent{total > 1 ? 's' : ''}
      <span className="agents-effectifs-sep" aria-hidden="true">·</span>
      <strong>{actifs}</strong> actif{actifs > 1 ? 's' : ''}
      <span className="agents-effectifs-sep" aria-hidden="true">·</span>
      <strong>{terrain}</strong> sur le terrain
      <span className="agents-effectifs-sep" aria-hidden="true">·</span>
      <strong>{admins}</strong> en administration
    </p>
  );
};

export default AgentsResume;
