// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { lazy, Suspense } from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { FrontiereChargementPage } from './FrontiereChargementPage';

let erreursConsole;

beforeEach(() => {
  // React journalise toute erreur rattrapee par une frontiere. C'est attendu
  // ici : on le fait taire pour garder la sortie des tests lisible.
  erreursConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  erreursConsole.mockRestore();
});

// Declarees hors rendu : un composant cree pendant le rendu repart de zero a
// chaque passage, et React.lazy perdrait justement la memorisation qu'on veut
// eprouver ici.
const PageOk = lazy(() => Promise.resolve({ default: () => <p>Contenu de la page</p> }));
const PageIntrouvable = lazy(() =>
  Promise.reject(new TypeError('Failed to fetch dynamically imported module')),
);

const PageQuiCharge = ({ echoue }) => (
  <FrontiereChargementPage>
    <Suspense fallback={<p>Chargement…</p>}>
      {echoue ? <PageIntrouvable /> : <PageOk />}
    </Suspense>
  </FrontiereChargementPage>
);

describe('frontière de chargement des pages', () => {
  it('laisse passer une page qui se charge normalement', async () => {
    render(<PageQuiCharge echoue={false} />);
    expect(await screen.findByText('Contenu de la page')).toBeTruthy();
  });

  it('affiche un recours quand le fichier de la page ne peut pas être récupéré', async () => {
    // Sans frontiere, React.lazy laisse remonter un TypeError non rattrape et
    // l'utilisateur reste devant un ecran blanc, sans rien a faire.
    render(<PageQuiCharge echoue />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Recharger/ })).toBeTruthy();
  });

  it('explique la panne sans jargon technique', async () => {
    // Le message s'adresse a un agent de terrain, pas a un developpeur :
    // « Failed to fetch dynamically imported module » ne lui dit rien.
    render(<PageQuiCharge echoue />);
    const alerte = await screen.findByRole('alert');
    expect(alerte.textContent).not.toMatch(/dynamically imported|TypeError|chunk/i);
    expect(alerte.textContent).toMatch(/page/i);
  });

  it('recharge l’application quand on le demande', async () => {
    // React.lazy retient la promesse rejetee : re-rendre ne suffit pas, il faut
    // vraiment recharger. Le bouton doit donc faire exactement cela.
    const recharger = vi.fn();
    render(
      <FrontiereChargementPage onRecharger={recharger}>
        <Suspense fallback={null}>
          <PageIntrouvable />
        </Suspense>
      </FrontiereChargementPage>,
    );
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: /Recharger/ }));
    expect(recharger).toHaveBeenCalledTimes(1);
  });

  it('n’avale pas les erreurs : elle les journalise', async () => {
    // Une frontiere silencieuse transforme un bug en mystere. Celle-ci laisse
    // une trace exploitable dans la console.
    render(<PageQuiCharge echoue />);
    await screen.findByRole('alert');
    await waitFor(() => {
      const messages = erreursConsole.mock.calls.flat().map(String).join(' ');
      expect(messages).toMatch(/\[Chargement de page\]/);
    });
  });
});
