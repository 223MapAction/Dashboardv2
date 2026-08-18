import React from 'react';

/**
 * Attente pendant que le code d'une page est recupere.
 *
 * Le repli etait `null` : sur une connexion lente, l'utilisateur voyait un
 * ecran entierement vide, sans savoir si l'application travaillait ou si elle
 * avait cesse de repondre. Le seul recours evident dans ce cas est de
 * recharger, ce qui recommence le telechargement depuis zero.
 *
 * Le texte n'apparait qu'apres un delai, via une animation : sur une connexion
 * correcte la page arrive avant, et faire clignoter un message d'attente pour
 * deux dixiemes de seconde donne l'impression d'une application poussive.
 */
export const ChargementPage = () => (
  <div className="chargement-page" role="status" aria-live="polite">
    <span className="chargement-page-anneau" aria-hidden="true" />
    <span className="chargement-page-texte">Chargement de la page…</span>
  </div>
);

export default ChargementPage;
