// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SignalementDetailSkeleton } from './SqueletteDetail';

afterEach(cleanup);

describe('squelette de chargement du signalement', () => {
  it('se rend sans erreur', () => {
    // Ce test parait trivial, il ne l'est pas. Quand ce squelette a ete sorti
    // du gros fichier, une icone de la bibliotheque de shimmer n'a pas suivi
    // dans les imports. Rien ne le signalait : ni le lint, ni le build — un
    // composant JSX absent n'echoue qu'a l'execution, et seulement sur l'ecran
    // de chargement, que personne ne regarde longtemps. Le rendre une fois
    // suffit a fermer cette porte.
    const { container } = render(<SignalementDetailSkeleton />);
    expect(container.querySelector('.project-detail')).toBeTruthy();
  });
});
