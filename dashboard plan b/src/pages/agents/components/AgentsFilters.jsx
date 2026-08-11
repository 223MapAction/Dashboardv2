import { SearchNormal1, ArrowDown2, CloseCircle } from 'iconsax-react';
import { ROLES } from '../roles';
import { AgentsViewToggle } from './AgentsViewToggle';

const STATUTS = [
  { id: 'active', label: 'Actif' },
  { id: 'inactive', label: 'Inactif' },
];

/**
 * Barre de filtres de l'équipe.
 *
 * Le champ de recherche annonce ce que l'API sait réellement chercher — le nom
 * et l'e-mail. Il promettait « organisation », qui n'est ni cherchable ni
 * affichée depuis la refonte ; il ne promet pas non plus le code d'accès, que
 * le serveur n'indexe pas.
 */
export const AgentsFilters = ({
  recherche, onRecherche,
  role, onRole,
  statut, onStatut,
  vue, onVue,
  onEffacer,
  filtreActif,
}) => (
  <div className="agents-toolbar">
    <div className={`agents-search${recherche ? ' is-active' : ''}`}>
      <SearchNormal1 size={16} variant="Linear" color="currentColor" />
      <input
        type="search"
        id="agents-search-input"
        name="agents-search-query"
        autoComplete="off"
        placeholder="Rechercher un nom ou un e-mail…"
        value={recherche}
        onChange={(e) => onRecherche(e.target.value)}
      />
    </div>

    <div className={`agents-select-wrap${role ? ' is-active' : ''}`}>
      <select value={role} onChange={(e) => onRole(e.target.value)} aria-label="Filtrer par rôle">
        <option value="">Tous les rôles</option>
        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <ArrowDown2 size={14} variant="Linear" color="currentColor" />
    </div>

    <div className={`agents-select-wrap${statut ? ' is-active' : ''}`}>
      <select value={statut} onChange={(e) => onStatut(e.target.value)} aria-label="Filtrer par statut">
        <option value="">Tous les statuts</option>
        {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <ArrowDown2 size={14} variant="Linear" color="currentColor" />
    </div>

    {/* N'apparaît que lorsqu'il y a quelque chose à effacer : un bouton
        toujours présent mais inerte apprend à l'utilisateur à l'ignorer. */}
    {filtreActif && (
      <button type="button" className="agents-effacer" onClick={onEffacer}>
        <CloseCircle size={15} variant="Linear" color="currentColor" />
        Effacer
      </button>
    )}

    <AgentsViewToggle vue={vue} onChange={onVue} />
  </div>
);

export default AgentsFilters;
