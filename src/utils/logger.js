/**
 * Journalisation sans fuite de données.
 *
 * Deux garanties, dans cet ordre :
 *   1. rien ne sort en production — les méthodes sont vides hors développement ;
 *   2. en développement, les champs sensibles sont masqués avant affichage.
 *
 * La seconde compte même si la première suffit en théorie : un poste de
 * développement affiche des données réelles, et une capture d'écran de la
 * console part vite dans un ticket ou une discussion d'équipe.
 *
 * `console` reste interdit ailleurs par la règle `no-console` d'ESLint. Ce
 * fichier est la seule exception, déclarée dans `eslint.config.js`.
 */

// Noms de champs masqués par correspondance EXACTE. Les noms courts ne peuvent
// pas être cherchés en sous-chaîne : `lat` apparaîtrait dans `translate` ou
// `related`, et masquerait des champs anodins.
const CLES_EXACTES = new Set([
  'lat', 'lng', 'long', 'latitude', 'longitude',
  'email', 'mail', 'tel', 'phone', 'telephone',
  'access', 'refresh', 'auth',
]);

// Noms de champs masqués par correspondance en SOUS-CHAÎNE. Réservé aux termes
// sans ambiguïté, pour attraper les variantes (`access_token`, `userPassword`…).
const FRAGMENTS_SENSIBLES = [
  'password', 'mot_de_passe', 'motdepasse', 'passwd',
  'token', 'secret', 'authorization', 'credential',
  'apikey', 'api_key', 'coordinate',
];

const estCleSensible = (cle) => {
  const c = String(cle).toLowerCase();
  return CLES_EXACTES.has(c) || FRAGMENTS_SENSIBLES.some((f) => c.includes(f));
};

// Une valeur masquée garde sa longueur et ses extrémités : assez pour vérifier
// « c'est bien le bon jeton » sans le divulguer.
const masquer = (valeur) => {
  if (typeof valeur === 'number') return '[MASQUÉ]';
  if (typeof valeur !== 'string' || valeur.length === 0) return '[MASQUÉ]';
  if (valeur.length <= 6) return '******';
  return `${valeur.slice(0, 2)}…${valeur.slice(-2)} (${valeur.length} car.)`;
};

// Au-delà de cette profondeur, on ne descend plus. Les erreurs axios imbriquent
// requête, réponse et configuration sur plusieurs niveaux : sans limite, un
// seul appel peut sérialiser des milliers de champs.
const PROFONDEUR_MAX = 4;

const nettoyer = (donnee, profondeur = 0, vus = new WeakSet()) => {
  if (donnee === null || donnee === undefined) return donnee;

  const type = typeof donnee;
  if (type === 'string' || type === 'number' || type === 'boolean') return donnee;
  if (type === 'function') return '[Function]';

  // Une erreur porte tout le contexte HTTP : en-têtes d'autorisation, corps de
  // la requête, réponse complète du serveur. On n'en garde que le diagnostic.
  if (donnee instanceof Error) {
    const resume = { name: donnee.name, message: donnee.message };
    const statut = donnee.response?.status;
    if (statut !== undefined) resume.status = statut;
    return resume;
  }

  if (profondeur >= PROFONDEUR_MAX) return '[…]';

  if (Array.isArray(donnee)) {
    if (vus.has(donnee)) return '[Circulaire]';
    vus.add(donnee);
    // Un tableau de 500 signalements n'apprend rien de plus que ses premiers
    // éléments, et son affichage noie le reste du message.
    const apercu = donnee.slice(0, 10).map((e) => nettoyer(e, profondeur + 1, vus));
    return donnee.length > 10
      ? [...apercu, `…et ${donnee.length - 10} autres`]
      : apercu;
  }

  if (type === 'object') {
    if (vus.has(donnee)) return '[Circulaire]';
    vus.add(donnee);
    const resultat = {};
    for (const [cle, valeur] of Object.entries(donnee)) {
      resultat[cle] = estCleSensible(cle)
        ? masquer(valeur)
        : nettoyer(valeur, profondeur + 1, vus);
    }
    return resultat;
  }

  return donnee;
};

const actif = import.meta.env.DEV;

const emettre = (methode, args) => {
  if (!actif) return;
  console[methode](...args.map((a) => nettoyer(a)));
};

export const logger = {
  log: (...args) => emettre('log', args),
  warn: (...args) => emettre('warn', args),
  error: (...args) => emettre('error', args),
};

// Exporté pour les tests : la logique de masquage doit pouvoir être vérifiée
// sans passer par la console.
export const _nettoyerPourTest = nettoyer;

export default logger;
