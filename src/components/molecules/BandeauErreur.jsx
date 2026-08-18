import React from 'react';
import { Danger, Refresh } from 'iconsax-react';
import './bandeau-erreur.css';

/**
 * Signale a l'utilisateur qu'un chargement a echoue, et lui propose de
 * reessayer.
 *
 * Pourquoi un bandeau et non un ecran d'erreur : SWR est configure avec
 * `keepPreviousData`, donc en cas de panne reseau la page continue d'afficher
 * les dernieres donnees connues. Remplacer tout l'ecran ferait perdre a
 * l'utilisateur ce qu'il avait sous les yeux, alors que ces donnees restent
 * utiles — simplement plus forcement a jour. Le bandeau dit exactement cela.
 *
 * Il ne s'affiche pas quand `erreur` est absent, ce qui permet de l'appeler
 * sans condition depuis la page.
 *
 * @param {any} erreur l'erreur remontee par useSWR
 * @param {Function} onReessayer en general la fonction `mutate` de useSWR
 * @param {string} [message] formulation adaptee a la page
 */
export const BandeauErreur = ({ erreur, onReessayer, message }) => {
  if (!erreur) return null;

  return (
    <div className="bandeau-erreur" role="alert">
      <Danger size={20} variant="Bold" color="currentColor" aria-hidden="true" />
      <p className="bandeau-erreur-texte">
        {message || "Impossible de contacter le serveur. Les informations affichées peuvent ne plus être à jour."}
      </p>
      {onReessayer && (
        <button type="button" className="bandeau-erreur-action" onClick={() => onReessayer()}>
          <Refresh size={16} variant="Linear" color="currentColor" aria-hidden="true" />
          Réessayer
        </button>
      )}
    </div>
  );
};

export default BandeauErreur;
