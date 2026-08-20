// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useSocketSignalement } from './useSocketSignalement';

/** Fausse WebSocket : retient chaque instance et laisse le test declencher
 *  ouverture, message et fermeture a la main. */
class SocketFactice {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.close = vi.fn(() => { this.ferme = true; });
    SocketFactice.instances.push(this);
  }
  simulerOuverture() { this.onopen?.(); }
  simulerMessage(data) { this.onmessage?.({ data }); }
  simulerFermeture(code) { this.onclose?.({ code }); }
}

const Sonde = ({ incidentId, canal = 'discussion', onMessage = () => {}, socketRef }) => {
  useSocketSignalement(incidentId, canal, onMessage, { socketRef });
  return null;
};

beforeEach(() => {
  SocketFactice.instances = [];
  vi.stubGlobal('WebSocket', SocketFactice);
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('connexion', () => {
  it('n’ouvre rien tant que l’incident est inconnu', () => {
    render(<Sonde incidentId={null} />);
    expect(SocketFactice.instances).toHaveLength(0);
  });

  it('ouvre le canal demandé en ws, pas en http', () => {
    render(<Sonde incidentId={7} canal="tasks" />);
    expect(SocketFactice.instances).toHaveLength(1);
    expect(SocketFactice.instances[0].url).toMatch(/^wss?:\/\//);
    expect(SocketFactice.instances[0].url).toContain('/ws/incidents/7/tasks/');
  });

  it('transmet les messages reçus', () => {
    const onMessage = vi.fn();
    render(<Sonde incidentId={7} onMessage={onMessage} />);
    SocketFactice.instances[0].simulerMessage('coucou');
    expect(onMessage).toHaveBeenCalledWith({ data: 'coucou' });
  });

  it('expose la socket courante quand une ref est fournie', () => {
    const socketRef = { current: null };
    render(<Sonde incidentId={7} socketRef={socketRef} />);
    expect(socketRef.current).toBe(SocketFactice.instances[0]);
  });
});

describe('reconnexion', () => {
  it('retente après une coupure, avec un délai qui double', () => {
    render(<Sonde incidentId={7} />);
    SocketFactice.instances[0].simulerFermeture(1006); // coupure anormale

    vi.advanceTimersByTime(2999);
    expect(SocketFactice.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(SocketFactice.instances).toHaveLength(2);

    // Deuxieme coupure : le delai a double, 3 s ne suffisent plus.
    SocketFactice.instances[1].simulerFermeture(1006);
    vi.advanceTimersByTime(3000);
    expect(SocketFactice.instances).toHaveLength(2);
    vi.advanceTimersByTime(3000);
    expect(SocketFactice.instances).toHaveLength(3);
  });

  it('repart d’un délai court après une reconnexion réussie', () => {
    render(<Sonde incidentId={7} />);
    SocketFactice.instances[0].simulerFermeture(1006);
    vi.advanceTimersByTime(3000);
    SocketFactice.instances[1].simulerOuverture();

    SocketFactice.instances[1].simulerFermeture(1006);
    vi.advanceTimersByTime(3000);
    expect(SocketFactice.instances).toHaveLength(3);
  });

  it.each([1000, 4001, 4003, 4004])('ne retente pas sur le code %i', (code) => {
    // 1000 est une fermeture normale, les 400x sont des refus d'accès.
    // Reessayer boucle sans jamais aboutir, en consommant les données mobiles.
    render(<Sonde incidentId={7} />);
    SocketFactice.instances[0].simulerFermeture(code);
    vi.advanceTimersByTime(60000);
    expect(SocketFactice.instances).toHaveLength(1);
  });
});

describe('démontage', () => {
  it('ferme la socket', () => {
    const { unmount } = render(<Sonde incidentId={7} />);
    const socket = SocketFactice.instances[0];
    unmount();
    expect(socket.close).toHaveBeenCalled();
  });

  it('annule une reconnexion déjà programmée', () => {
    // Sans annulation du minuteur, la reconnexion se declenche apres le
    // demontage et ouvre une socket que plus personne ne fermera.
    const { unmount } = render(<Sonde incidentId={7} />);
    SocketFactice.instances[0].simulerFermeture(1006);
    unmount();
    vi.advanceTimersByTime(60000);
    expect(SocketFactice.instances).toHaveLength(1);
  });

  it('libère la ref exposée', () => {
    const socketRef = { current: null };
    const { unmount } = render(<Sonde incidentId={7} socketRef={socketRef} />);
    unmount();
    expect(socketRef.current).toBeNull();
  });
});
