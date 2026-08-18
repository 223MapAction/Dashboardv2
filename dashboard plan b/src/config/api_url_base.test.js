import { describe, it, expect, vi, afterEach } from 'vitest';

// Le module lit `import.meta.env` a son chargement et leve si la variable
// manque. Chaque cas doit donc repartir d'un module neuf : `resetModules()`
// avant chaque import dynamique, sinon le premier resultat serait mis en cache
// et les cas suivants ne testeraient rien.
const chargerAvec = async (valeur) => {
  vi.resetModules();
  if (valeur === undefined) vi.stubEnv('VITE_API_BASE_URL', '');
  else vi.stubEnv('VITE_API_BASE_URL', valeur);
  return import('./api_url_base.js');
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('adresse de l’API', () => {
  it('refuse de se charger si la variable est absente', async () => {
    await expect(chargerAvec(undefined)).rejects.toThrow(/VITE_API_BASE_URL/);
  });

  it('refuse une valeur qui n’est que des espaces', async () => {
    await expect(chargerAvec('   ')).rejects.toThrow(/VITE_API_BASE_URL/);
  });

  it('ne fournit aucune valeur de repli vers la production', async () => {
    // La garantie du point 5 : pas de repli silencieux. Le message d'erreur
    // ne doit donc jamais souffler une adresse de production.
    await expect(chargerAvec(undefined)).rejects.not.toThrow(/api\.map-action\.com/);
  });

  it('expose l’adresse fournie', async () => {
    const { API_URL_BASE } = await chargerAvec('http://localhost:8000');
    expect(API_URL_BASE).toBe('http://localhost:8000');
  });

  it('retire la barre oblique finale', async () => {
    // Sans cela, `${API_URL_BASE}/MapApi/...` produirait `//MapApi`.
    const { API_URL_BASE } = await chargerAvec('https://api.exemple.org/');
    expect(API_URL_BASE).toBe('https://api.exemple.org');
  });

  it('retire aussi des barres obliques finales multiples', async () => {
    const { API_URL_BASE } = await chargerAvec('https://api.exemple.org///');
    expect(API_URL_BASE).toBe('https://api.exemple.org');
  });

  it('ignore les espaces autour de la valeur', async () => {
    const { API_URL_BASE } = await chargerAvec('  http://localhost:8000  ');
    expect(API_URL_BASE).toBe('http://localhost:8000');
  });
});
