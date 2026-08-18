import { useState, useRef, useEffect } from 'react';
import { useReinitialisationSurChangement } from '../../../../hooks/useReinitialisationSurChangement';

/**
 * Lecture de l'enregistrement vocal joint a un signalement.
 *
 * isPlaying suit les evenements play/pause de l'element plutot que d'etre
 * devine a l'appui du bouton : l'etat reste juste meme quand la lecture
 * s'arrete sans passer par nous.
 *
 * @param {number|string|undefined} signalementId remet le lecteur a zero quand
 *        on passe d'un signalement a un autre
 */
export function useLecteurAudio(signalementId) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const onAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const onAudioLoaded = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seekAudio = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(duration, ratio * duration));
  };

  // La barre s'annoncait comme un curseur (role="slider") mais n'ecoutait que
  // la souris : au clavier, elle prenait le focus puis ne repondait a rien.
  // Les fleches deplacent de 5 s, Debut/Fin sautent aux extremites.
  const seekAudioClavier = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pas = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -5, ArrowUp: 5 };
    let cible = null;
    if (e.key in pas) cible = audio.currentTime + pas[e.key];
    else if (e.key === 'Home') cible = 0;
    else if (e.key === 'End') cible = duration;
    if (cible === null) return;
    e.preventDefault();
    audio.currentTime = Math.max(0, Math.min(duration, cible));
  };

  // Repartir de zero quand on passe d'un signalement a un autre.
  //
  // Les compteurs sont des valeurs derivees de la piste affichee : on les remet
  // a zero pendant le rendu, sinon le nouveau signalement s'affiche un instant
  // avec la duree et la position de l'ancien.
  useReinitialisationSurChangement([signalementId], () => {
    setCurrentTime(0);
    setDuration(0);
  });

  // L'arret de la piste precedente, lui, touche un systeme exterieur a React —
  // l'element <audio> — et reste donc dans un effet. On ne remet pas isPlaying
  // a false ici : pause() emet un evenement 'pause', deja ecoute par le rendu.
  // Une seule source de verite, et l'etat reste juste meme quand la lecture
  // s'arrete sans passer par nous.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, [signalementId]);

  return {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    togglePlay,
    onAudioTimeUpdate,
    onAudioLoaded,
    onAudioEnded,
    seekAudio,
    seekAudioClavier,
  };
}
