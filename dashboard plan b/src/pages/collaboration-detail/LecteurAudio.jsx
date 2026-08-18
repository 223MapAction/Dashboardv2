import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'iconsax-react';

// Lecteur audio des messages de la discussion. Il ne partage rien avec la page
// qui l'accueille en dehors de ses quatre proprietes : `activeAudioId` sert a
// ce qu'un seul enregistrement joue a la fois.
export const CustomAudioPlayer = ({ id, src, activeAudioId, setActiveAudioId }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Éviter les coupures d'audio lors des rafraîchissements SWR
  // Si le token change mais que c'est le même fichier, on ne met pas à jour la source.
  const [stableSrc, setStableSrc] = useState(src);

  // Ajuste pendant le rendu, pas dans un effet : sinon le <audio> est monte une
  // premiere fois avec l'ancienne source, puis remonte avec la nouvelle — ce
  // qui coupe la lecture, exactement ce que ce code cherche a eviter.
  const memeFichier = src && stableSrc && src.split('?')[0] === stableSrc.split('?')[0];
  if (src && stableSrc !== src && !memeFichier) {
    setStableSrc(src);
  }

  // Si un autre audio démarre, on met celui-ci en pause.
  // On ne touche plus a isPlaying ici : l'element emet un evenement 'pause',
  // ecoute plus bas. Une seule source de verite, et l'etat reste juste meme
  // quand la lecture s'arrete sans passer par nous (fin de piste, coupure).
  useEffect(() => {
    if (activeAudioId && activeAudioId !== id && isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [activeAudioId, id, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const onAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      audio.currentTime = 0;
      if (setActiveAudioId && activeAudioId === id) setActiveAudioId(null);
    };

    const onLecture = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onAudioEnd);
    audio.addEventListener('play', onLecture);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onAudioEnd);
      audio.removeEventListener('play', onLecture);
      audio.removeEventListener('pause', onPause);
    };
  }, [id, activeAudioId, setActiveAudioId]);

  const togglePlayPause = () => {
    const prevValue = isPlaying;
    if (!prevValue) {
      if (setActiveAudioId) setActiveAudioId(id);
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    const newTime = (e.target.value / 100) * duration;
    audio.currentTime = newTime;
    setProgress(e.target.value);
  };

  const formatTime = (time) => {
    if (time && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const formatMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const seconds = Math.floor(time % 60);
      const formatSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${formatMinutes}:${formatSeconds}`;
    }
    return '00:00';
  };

  return (
    <div className="custom-audio-player" style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
      <audio ref={audioRef} src={stableSrc} preload="metadata" />
      <button
        onClick={togglePlayPause}
        style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: 'var(--color-primary)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,

          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(var(--rgb-ombre),0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(var(--rgb-ombre),0.15)'; }}
      >
        {isPlaying ? <Pause size={20} variant="Bold" color="var(--color-surface)" /> : <Play size={20} variant="Bold" color="var(--color-surface)" style={{ marginLeft: '2px' }} />}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ position: 'relative', width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--color-primary)', width: `${progress || 0}%`, borderRadius: '3px', transition: 'width 0.1s linear' }} />
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleProgressChange}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer', margin: 0, padding: 0
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', fontWeight: '600', fontFamily: 'monospace' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
