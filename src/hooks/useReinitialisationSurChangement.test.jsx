// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useState, useEffect } from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { useReinitialisationSurChangement } from './useReinitialisationSurChangement';

afterEach(cleanup);

/**
 * Reproduit le montage reel : une page paginee dont la requete part avec la
 * page et le filtre courants.
 *
 * L'enregistrement se fait dans un effet, et non dans le corps du rendu, parce
 * que c'est la que se declenche une vraie requete. Quand le hook reinitialise
 * pendant le rendu, React jette ce rendu et recommence : le corps s'execute,
 * mais aucun effet ne part. C'est exactement le gaspillage qu'on veut mesurer.
 */
const PageFiltree = ({ requetes }) => {
  const [page, setPage] = useState(1);
  const [filtre, setFiltre] = useState('tous');

  useReinitialisationSurChangement([filtre], () => setPage(1));

  useEffect(() => {
    requetes.push({ page, filtre });
  }, [page, filtre, requetes]);

  return (
    <>
      <span data-testid="page">{page}</span>
      <button type="button" onClick={() => setPage((p) => p + 1)}>Page suivante</button>
      <button type="button" onClick={() => setFiltre('resolus')}>Filtrer</button>
    </>
  );
};

describe('réinitialisation sur changement', () => {
  it('ne touche à rien tant que les valeurs surveillées ne bougent pas', () => {
    const requetes = [];
    render(<PageFiltree requetes={requetes} />);
    fireEvent.click(screen.getByText('Page suivante'));
    fireEvent.click(screen.getByText('Page suivante'));
    expect(screen.getByTestId('page').textContent).toBe('3');
  });

  it('remet la page à 1 quand le filtre change', () => {
    const requetes = [];
    render(<PageFiltree requetes={requetes} />);
    fireEvent.click(screen.getByText('Page suivante'));
    fireEvent.click(screen.getByText('Filtrer'));
    expect(screen.getByTestId('page').textContent).toBe('1');
  });

  it('n’expose jamais le nouveau filtre avec l’ancienne page', () => {
    // C'est tout l'interet du hook. En reinitialisant depuis un useEffect, une
    // requete partait sur la page 3 d'un filtre qui venait de changer, avant
    // qu'une seconde ne parte sur la page 1 — un aller-retour reseau
    // entierement gaspille, a chaque frappe.
    const requetes = [];
    render(<PageFiltree requetes={requetes} />);
    fireEvent.click(screen.getByText('Page suivante'));
    fireEvent.click(screen.getByText('Page suivante'));
    fireEvent.click(screen.getByText('Filtrer'));

    const incoherentes = requetes.filter((r) => r.filtre === 'resolus' && r.page !== 1);
    expect(incoherentes).toEqual([]);
  });

  it('réagit à chaque nouveau changement, pas seulement au premier', () => {
    const reinitialiser = vi.fn();
    const Sonde = ({ valeur }) => {
      useReinitialisationSurChangement([valeur], reinitialiser);
      return null;
    };
    const { rerender } = render(<Sonde valeur="a" />);
    expect(reinitialiser).not.toHaveBeenCalled();
    rerender(<Sonde valeur="b" />);
    rerender(<Sonde valeur="c" />);
    expect(reinitialiser).toHaveBeenCalledTimes(2);
  });

  it('compare les valeurs, pas les références', () => {
    // Les pages lui passent des tableaux littéraux, recréés à chaque rendu.
    // Comparer les références déclencherait une réinitialisation permanente.
    const reinitialiser = vi.fn();
    const Sonde = () => {
      useReinitialisationSurChangement([['a', 'b'], { c: 1 }], reinitialiser);
      return null;
    };
    const { rerender } = render(<Sonde />);
    rerender(<Sonde />);
    rerender(<Sonde />);
    expect(reinitialiser).not.toHaveBeenCalled();
  });
});
