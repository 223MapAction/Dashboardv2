import { Grid2, HambergerMenu } from 'iconsax-react';

const VUES = [
  { id: 'fiches', libelle: 'Fiches', icone: Grid2 },
  { id: 'liste', libelle: 'Liste', icone: HambergerMenu },
];

/**
 * Bascule fiches / liste.
 *
 * `role="radiogroup"` plutôt qu'un groupe de boutons : il s'agit d'un choix
 * exclusif entre deux états persistants, pas de deux actions.
 */
export const AgentsViewToggle = ({ vue, onChange }) => (
  <div className="agents-vue-toggle" role="radiogroup" aria-label="Affichage de l’équipe">
    {VUES.map(({ id, libelle, icone: Icone }) => (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={vue === id}
        className={`agents-vue-btn${vue === id ? ' is-active' : ''}`}
        onClick={() => onChange(id)}
        title={`Affichage en ${libelle.toLowerCase()}`}
      >
        <Icone size={16} variant={vue === id ? 'Bold' : 'Linear'} color="currentColor" />
        <span>{libelle}</span>
      </button>
    ))}
  </div>
);

export default AgentsViewToggle;
