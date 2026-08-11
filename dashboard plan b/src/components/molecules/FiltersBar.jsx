import { SearchNormal1, ArrowDown2, CloseCircle } from 'iconsax-react';
import './filters-bar.css';

/**
 * Barre de filtres commune a toutes les listes.
 *
 * Chaque page avait la sienne : des delais de frappe differents, un seul
 * bouton « Effacer » dans toute l'application, aucun rappel du nombre de
 * resultats. Le meme geste ne repondait donc pas pareil selon l'ecran.
 *
 * Trois principes, tenus ici une seule fois :
 *
 * 1. Un filtre actif se voit sans qu'on lise son contenu. Sinon on oublie
 *    qu'on filtre et on croit la liste plus courte qu'elle n'est.
 * 2. « Effacer » n'apparait que lorsqu'il y a quelque chose a effacer. Un
 *    bouton toujours present mais inerte apprend a l'utilisateur a l'ignorer.
 * 3. Le nombre de resultats est annonce des qu'un filtre est actif : c'est la
 *    reponse a la question qu'on vient de poser.
 *
 * @param {string}   recherche    valeur affichee dans le champ (la saisie brute)
 * @param {Function} onRecherche  appele a chaque frappe
 * @param {string}   placeholder  doit decrire ce que la recherche sait trouver
 * @param {Array}    selects      [{ id, valeur, onChange, ariaLabel, tousLabel, options: [{value,label}] }]
 * @param {Function} onEffacer    remet tous les filtres a zero
 * @param {number}   [resultats]  nombre de resultats, ou undefined pour ne rien annoncer
 * @param {string}   [nomResultat] singulier du mot compte, ex. « signalement »
 * @param {node}     [children]   controles supplementaires (bascule de vue…)
 */
export const FiltersBar = ({
  recherche = '',
  onRecherche,
  placeholder = 'Rechercher…',
  selects = [],
  onEffacer,
  resultats,
  nomResultat = 'résultat',
  children,
}) => {
  const filtreActif = Boolean(recherche) || selects.some((s) => Boolean(s.valeur));

  return (
    <div className="am-filtres">
      <div className="am-filtres-controles">
        <div className={`am-filtres-recherche${recherche ? ' is-active' : ''}`}>
          <SearchNormal1 size={16} variant="Linear" color="currentColor" />
          <input
            type="search"
            autoComplete="off"
            placeholder={placeholder}
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
          />
        </div>

        {selects.map((s) => (
          <div key={s.id} className={`am-filtres-select${s.valeur ? ' is-active' : ''}`}>
            <select
              value={s.valeur}
              onChange={(e) => s.onChange(e.target.value)}
              aria-label={s.ariaLabel}
            >
              <option value="">{s.tousLabel}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ArrowDown2 size={14} variant="Linear" color="currentColor" aria-hidden="true" />
          </div>
        ))}

        {filtreActif && onEffacer && (
          <button type="button" className="am-filtres-effacer" onClick={onEffacer}>
            <CloseCircle size={15} variant="Linear" color="currentColor" aria-hidden="true" />
            Effacer
          </button>
        )}

        {children}
      </div>

      {/* aria-live : la liste se met a jour sans rechargement, donc un lecteur
          d'ecran n'a aucun autre moyen d'apprendre le nouveau nombre. */}
      {filtreActif && typeof resultats === 'number' && (
        <p className="am-filtres-resultats" role="status" aria-live="polite">
          {resultats === 0 && `Aucun ${nomResultat} ne correspond à vos critères`}
          {resultats === 1 && <>
            <strong>1</strong> {nomResultat} correspond à vos critères
          </>}
          {resultats > 1 && <>
            <strong>{resultats}</strong> {nomResultat}s correspondent à vos critères
          </>}
        </p>
      )}
    </div>
  );
};

export default FiltersBar;
