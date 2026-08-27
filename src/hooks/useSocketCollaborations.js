import { useEffect, useRef } from 'react';
import { API_URL_BASE } from '../config/api_url_base';
import { authService } from '../pages/auth/services/authService';

/** Codes de fermeture sur lesquels il ne faut PAS retenter :
 *  1000 est une fermeture normale, 4001/4003/4004 sont des refus
 *  d'authentification ou d'autorisation. Reessayer sur ceux-la boucle
 *  indefiniment sans jamais aboutir. */
const CODES_SANS_RETENTATIVE = [1000, 4001, 4003, 4004];

const DELAI_INITIAL = 3000;
const DELAI_MAX = 30000;

/**
 * Maintient la connexion au canal `/ws/collaborations/` : creation d'une
 * demande, acceptation, refus. Meme logique de reconnexion a delai croissant
 * que `useSocketIncident`, mais sur un canal global et non par incident.
 *
 * Le code vivait en clair dans la page « Demandes de collaboration ». La page
 * « Mes collaborations » en a besoin aussi : une acceptation doit y faire
 * apparaitre la collaboration sans rechargement, sur une route qui met 8 a 12
 * secondes. Deux copies d'un mecanisme de reprise reseau, c'est une de trop.
 *
 * @param {Function} onMessage appelee avec l'objet JSON deja parse
 * @param {boolean} [actif] permet de suspendre la connexion
 */
export function useSocketCollaborations(onMessage, actif = true) {
  // La fonction de reception est souvent recreee a chaque rendu par
  // l'appelant. La lire via une ref evite de rouvrir la connexion a chaque
  // frappe au clavier.
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!actif) return undefined;

    const baseWs =
      window.location.protocol === 'https:' || API_URL_BASE.startsWith('https')
        ? API_URL_BASE.replace(/^https/, 'wss')
        : API_URL_BASE.replace(/^http/, 'ws');
    const token = authService.getAccessToken();
    const requete = token ? `?token=${token}` : '';

    let socket = null;
    let minuteur = null;
    let arrete = false;
    let delai = DELAI_INITIAL;

    const connecter = () => {
      if (arrete) return;
      socket = new WebSocket(`${baseWs}/ws/collaborations/${requete}`);

      socket.onopen = () => {
        delai = DELAI_INITIAL;
      };
      socket.onmessage = (event) => {
        try {
          const donnees = JSON.parse(event.data);
          if (donnees) onMessageRef.current?.(donnees, event);
        } catch {
          // Un message illisible ne doit pas casser la connexion : les
          // suivants restent exploitables.
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = (e) => {
        if (arrete || CODES_SANS_RETENTATIVE.includes(e.code)) return;
        minuteur = setTimeout(connecter, delai);
        delai = Math.min(delai * 2, DELAI_MAX);
      };
    };

    // Fermer proprement au dechargement de la page evite de laisser une socket
    // ouverte cote serveur le temps de son propre delai d'inactivite.
    const auDechargement = () => {
      arrete = true;
      socket?.close(1000, 'Page unloading');
    };
    window.addEventListener('beforeunload', auDechargement);

    connecter();

    return () => {
      arrete = true;
      window.removeEventListener('beforeunload', auDechargement);
      // Le minuteur doit etre annule, pas seulement ignore : sans cela une
      // reconnexion programmee ouvre une socket que plus personne ne fermera.
      if (minuteur) clearTimeout(minuteur);
      socket?.close(1000, 'Component unmounting');
    };
  }, [actif]);
}

export default useSocketCollaborations;
