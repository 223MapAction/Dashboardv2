import React from 'react';
import { Danger, Refresh } from 'iconsax-react';
import { logger } from '../../utils/logger';

/**
 * Rattrape l'echec de chargement d'une page.
 *
 * Les pages du dashboard sont chargees a la demande (React.lazy) : leur code
 * n'arrive qu'au moment ou l'utilisateur y navigue. Trois situations tout a
 * fait ordinaires font echouer cette recuperation :
 *
 * - un deploiement vient d'avoir lieu. Les fichiers de l'application portent un
 *   nom qui change a chaque version ; celui que le navigateur s'apprete a
 *   demander n'existe plus sur le serveur.
 * - la connexion tombe au mauvais moment. C'est le quotidien sur le terrain.
 * - en developpement, un fichier est reecrit pendant que le serveur le sert.
 *
 * Sans frontiere, le resultat est le pire possible : React.lazy MEMORISE la
 * promesse rejetee. La page reste donc definitivement morte — re-naviguer n'y
 * change rien — et l'erreur remonte non rattrapee, laissant un ecran blanc.
 * L'utilisateur n'a aucune indication de ce qui s'est passe ni de quoi faire.
 *
 * Cette frontiere transforme cela en un message comprehensible et un bouton.
 * Recharger, et non re-essayer : c'est le seul geste qui vide la promesse
 * memorisee par React.lazy.
 */
export class FrontiereChargementPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { enEchec: false };
  }

  static getDerivedStateFromError() {
    return { enEchec: true };
  }

  componentDidCatch(erreur, infos) {
    // Une frontiere silencieuse transforme un bug en mystere. On laisse une
    // trace exploitable, prefixee pour etre retrouvable dans la console.
    logger.error('[Chargement de page] échec du chargement du code de la page', erreur, infos);
  }

  render() {
    if (!this.state.enEchec) return this.props.children;

    const recharger = this.props.onRecharger || (() => window.location.reload());

    return (
      <div className="frontiere-chargement" role="alert">
        <Danger size={40} variant="Bold" color="var(--color-danger-text)" aria-hidden="true" />
        <h1 className="frontiere-chargement-titre">Cette page n’a pas pu être chargée</h1>
        <p className="frontiere-chargement-texte">
          Votre connexion a peut-être été interrompue, ou l’application vient d’être
          mise à jour. Rechargez pour réessayer.
        </p>
        <button type="button" className="frontiere-chargement-action" onClick={recharger}>
          <Refresh size={18} variant="Linear" color="currentColor" aria-hidden="true" />
          Recharger l’application
        </button>
      </div>
    );
  }
}

export default FrontiereChargementPage;
