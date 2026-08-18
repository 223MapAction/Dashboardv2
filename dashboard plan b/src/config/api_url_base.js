/**
 * Adresse de l'API Map Action.
 *
 * Aucune valeur par défaut, volontairement. Une valeur de repli pointant vers
 * la production ferait qu'un poste de développement, un test ou un déploiement
 * mal configuré écrirait dans les données réelles sans que personne ne s'en
 * aperçoive. Mieux vaut un démarrage qui échoue et se corrige en une ligne de
 * `.env` qu'une écriture silencieuse dans la base de production.
 *
 * Sert aussi de base aux WebSocket : les pages dérivent leur URL `ws(s)://` de
 * cette constante, il n'y a donc rien d'autre à configurer.
 */

const brut = import.meta.env.VITE_API_BASE_URL;

if (!brut || !String(brut).trim()) {
  throw new Error(
    "VITE_API_BASE_URL n'est pas définie.\n" +
    "Copiez .env.example vers .env et renseignez l'adresse de VOTRE instance " +
    "de l'API Map Action, par exemple http://localhost:8000.\n" +
    "Aucune valeur par défaut n'est fournie : cela éviterait de se connecter " +
    "à la production sans le vouloir."
  );
}

// La barre oblique finale est retirée : tout le code concatène des chemins
// commençant par `/` (`${API_URL_BASE}/MapApi/...`), et une adresse saisie
// avec une barre finale produirait sinon des URLs en `//MapApi`.
export const API_URL_BASE = String(brut).trim().replace(/\/+$/, '');

export default API_URL_BASE;
