import { useEffect, useRef } from 'react';
import { API_URL_BASE } from '../config/api_url_base';
import { authService } from '../pages/auth/services/authService';

/** Codes de fermeture sur lesquels il ne faut PAS retenter :
 *  1000 est une fermeture normale, 4001/4003/4004 sont des refus
 *  d'authentification ou d'autorisation. Reessayer sur ceux-la boucle
 *  indefiniment sans jamais aboutir, en consommant les donnees mobiles de
 *  l'agent. */
const CODES_SANS_RETENTATIVE = [1000, 4001, 4003, 4004];

const DELAI_INITIAL = 3000;
const DELAI_MAX = 30000;

/**
 * Maintient une connexion WebSocket sur un canal d'incident, avec
 * reconnexion automatique a delai croissant.
 *
 * Ce code existait en double dans la page de detail de collaboration — une
 * copie pour la discussion, une pour les taches — avec la meme logique de
 * reconnexion ecrite deux fois. Deux copies d'un mecanisme de reprise reseau,
 * c'est une de trop : la correction d'un defaut n'atteint qu'une moitie.
 *
 * @param {number|string|null} incidentId aucune connexion tant qu'il est absent
 * @param {string} canal segment d'URL, par exemple 'discussion' ou 'tasks'
 * @param {Function} onMessage appelee a chaque message recu
 * @param {{ socketRef?: object }} [options] ref optionnelle exposant la socket
 *        courante a du code appelant qui veut emettre
 */
export function useSocketIncident(incidentId, canal, onMessage, options = {}) {
  const { socketRef } = options;

  // La fonction de reception est souvent recreee a chaque rendu par
  // l'appelant. La lire via une ref evite de rouvrir la connexion a chaque
  // frappe au clavier — sans quoi la discussion se reconnecterait en boucle.
  //
  // La mise a jour se fait dans un effet et non pendant le rendu : ecrire dans
  // une ref pendant le rendu casse les rendus que React peut abandonner ou
  // rejouer. La valeur initiale est deja bonne des le premier rendu, et un
  // message ne peut arriver qu'apres la connexion, donc apres les effets.
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!incidentId) return undefined;

    const baseWs = API_URL_BASE.replace(/^http/, 'ws');
    const token = authService.getAccessToken();
    const requete = token ? `?token=${token}` : '';

    let socket = null;
    let minuteur = null;
    let arrete = false;
    let delai = DELAI_INITIAL;

    const connecter = () => {
      if (arrete) return;
      socket = new WebSocket(`${baseWs}/ws/incidents/${incidentId}/${canal}/${requete}`);
      if (socketRef) socketRef.current = socket;

      socket.onopen = () => {
        delai = DELAI_INITIAL;
      };
      socket.onmessage = (event) => onMessageRef.current?.(event);
      socket.onerror = () => socket.close();
      socket.onclose = (e) => {
        if (arrete || CODES_SANS_RETENTATIVE.includes(e.code)) return;
        minuteur = setTimeout(connecter, delai);
        delai = Math.min(delai * 2, DELAI_MAX);
      };
    };

    connecter();

    return () => {
      arrete = true;
      // Le minuteur doit etre annule, pas seulement ignore : sans cela une
      // reconnexion programmee se declenche apres le demontage et ouvre une
      // socket que plus personne ne fermera.
      if (minuteur) clearTimeout(minuteur);
      socket?.close();
      if (socketRef) socketRef.current = null;
    };
  }, [incidentId, canal, socketRef]);
}
