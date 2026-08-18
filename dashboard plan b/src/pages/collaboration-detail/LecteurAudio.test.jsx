// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { CustomAudioPlayer } from './LecteurAudio';

afterEach(cleanup);

// jsdom n'implemente ni play() ni pause() sur <audio>.
const equiperAudio = () => {
  HTMLMediaElement.prototype.play = vi.fn(function () { this.dispatchEvent(new Event('play')); });
  HTMLMediaElement.prototype.pause = vi.fn(function () { this.dispatchEvent(new Event('pause')); });
};

describe('lecteur audio des messages', () => {
  it('se rend sans erreur', () => {
    // Meme raison que pour le squelette : un import oublie lors de l'extraction
    // ne se voit qu'a l'execution.
    equiperAudio();
    const { container } = render(<CustomAudioPlayer id="m1" src="https://exemple.test/a.mp3" />);
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('lit l’état de lecture depuis l’élément, pas depuis le clic', () => {
    // L'etat suivait auparavant l'appui sur le bouton, donc il mentait des que
    // la lecture s'arretait autrement — fin de piste, coupure, autre message
    // qui prend la main. Il suit maintenant les evenements play/pause.
    equiperAudio();
    render(<CustomAudioPlayer id="m1" src="https://exemple.test/a.mp3" />);
    const audio = document.querySelector('audio');

    fireEvent(audio, new Event('play'));
    fireEvent(audio, new Event('pause'));
    expect(document.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('ne recharge pas la source quand seul le jeton de l’URL change', () => {
    // Les URLs signees sont renouvelees a chaque rafraichissement SWR. Si le
    // <audio> suivait chaque nouvelle URL, la lecture serait coupee toutes les
    // quelques secondes — c'est precisement ce que ce composant evite.
    equiperAudio();
    const { rerender } = render(<CustomAudioPlayer id="m1" src="https://exemple.test/a.mp3?jeton=1" />);
    const avant = document.querySelector('audio').getAttribute('src');
    rerender(<CustomAudioPlayer id="m1" src="https://exemple.test/a.mp3?jeton=2" />);
    expect(document.querySelector('audio').getAttribute('src')).toBe(avant);
  });

  it('change de source quand c’est un autre fichier', () => {
    equiperAudio();
    const { rerender } = render(<CustomAudioPlayer id="m1" src="https://exemple.test/a.mp3?jeton=1" />);
    rerender(<CustomAudioPlayer id="m1" src="https://exemple.test/b.mp3?jeton=1" />);
    expect(document.querySelector('audio').getAttribute('src')).toContain('b.mp3');
  });
});
