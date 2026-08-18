// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BandeauErreur } from './BandeauErreur';

afterEach(cleanup);

describe('bandeau d’erreur réseau', () => {
  it('reste invisible tant qu’il n’y a pas d’erreur', () => {
    // La page l'appelle sans condition : c'est lui qui décide de s'afficher.
    // Si ce contrat cassait, chaque page afficherait une alerte permanente.
    const { container } = render(<BandeauErreur erreur={null} onReessayer={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('s’annonce comme une alerte quand le chargement a échoué', () => {
    render(<BandeauErreur erreur={new Error('réseau')} onReessayer={() => {}} />);
    // role="alert" : un lecteur d'écran doit annoncer la panne sans que
    // l'utilisateur ait à parcourir la page pour la découvrir.
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('affiche le message de la page quand il est fourni', () => {
    render(
      <BandeauErreur
        erreur={new Error('réseau')}
        onReessayer={() => {}}
        message="Impossible de charger les organisations."
      />,
    );
    expect(screen.getByText('Impossible de charger les organisations.')).toBeTruthy();
  });

  it('affiche un message générique à défaut', () => {
    render(<BandeauErreur erreur={new Error('réseau')} onReessayer={() => {}} />);
    expect(screen.getByText(/Impossible de contacter le serveur/)).toBeTruthy();
  });

  it('relance le chargement quand on appuie sur Réessayer', () => {
    const reessayer = vi.fn();
    render(<BandeauErreur erreur={new Error('réseau')} onReessayer={reessayer} />);
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(reessayer).toHaveBeenCalledTimes(1);
  });

  it('n’offre pas de bouton quand la page ne sait pas relancer', () => {
    // Un bouton qui ne fait rien est pire que pas de bouton : il fait croire
    // que la situation est reprise en main.
    render(<BandeauErreur erreur={new Error('réseau')} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
