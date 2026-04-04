import { useState, useRef, useCallback, useEffect } from "react";

const SETTINGS_KEY = "pizza-tycoon-audio";

const BGM_TRACKS = [
  "コーヒーの昼下がり.mp3",
  "Good_afternoon_cafe.mp3",
  "真昼のうたた寝.mp3",
  "ハミング.mp3",
  "街角の風景.mp3",
  "いっしょにあそぼう.mp3",
  "潮風と渚(Coast,sea_breeze).mp3",
  "光差し込む海辺で.mp3",
  "Calendula.mp3",
  "Secret_field.mp3",
  "カノジョは雨女_2.mp3",
  "海風の通り道.mp3",
  "up_to_scratch.mp3",
  "みどりの公園.mp3",
];

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

function shuffleTracks(lastPlayed) {
  const arr = [...BGM_TRACKS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (lastPlayed && arr[0] === lastPlayed && arr.length > 1) {
    [arr[0], arr[arr.length - 1]] = [arr[arr.length - 1], arr[0]];
  }
  return arr;
}

export default function useAudio() {
  const saved = loadSettings();
  const [bgmVolume, setBgmVolume] = useState(saved?.bgmVolume ?? 0.7);
  const [seVolume, setSeVolume] = useState(saved?.seVolume ?? 0.85);
  const [muted, setMuted] = useState(saved?.muted ?? false);
  const [bgmStarted, setBgmStarted] = useState(false);

  // Refs for latest values — solves stale closure in ended callback
  const bgmVolRef = useRef(bgmVolume);
  const mutedRef = useRef(muted);
  const currentRef = useRef(null);
  const queueRef = useRef([]);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { bgmVolRef.current = bgmVolume; }, [bgmVolume]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Persist settings
  useEffect(() => {
    saveSettings({ bgmVolume, seVolume, muted });
  }, [bgmVolume, seVolume, muted]);

  // Update volume on current track immediately when settings change
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.volume = muted ? 0 : bgmVolume;
    }
  }, [bgmVolume, muted]);

  // Play next track — reads from refs so always gets latest volume/muted
  const playNext = useCallback(() => {
    if (indexRef.current >= queueRef.current.length) {
      const lastTrack = queueRef.current[queueRef.current.length - 1];
      queueRef.current = shuffleTracks(lastTrack);
      indexRef.current = 0;
    }

    const trackFile = queueRef.current[indexRef.current];
    indexRef.current++;

    const vol = mutedRef.current ? 0 : bgmVolRef.current;
    const newAudio = new Audio(`/audio/${trackFile}`);
    newAudio.volume = 0;

    // Crossfade
    if (currentRef.current && !currentRef.current.paused) {
      const oldAudio = currentRef.current;
      const oldVol = oldAudio.volume;
      let step = 0;
      const fade = setInterval(() => {
        step++;
        const curVol = mutedRef.current ? 0 : bgmVolRef.current;
        oldAudio.volume = Math.max(0, oldVol * (1 - step / 15));
        newAudio.volume = Math.min(curVol, curVol * (step / 15));
        if (step >= 15) {
          clearInterval(fade);
          oldAudio.pause();
          oldAudio.src = "";
        }
      }, 100);
    } else {
      newAudio.volume = vol;
    }

    newAudio.play().catch(() => {});
    newAudio.addEventListener("ended", () => {
      if (!pausedRef.current) playNext();
    });

    currentRef.current = newAudio;
  }, []); // No deps — reads from refs

  const startBgm = useCallback(() => {
    if (bgmStarted) return;
    queueRef.current = shuffleTracks(null);
    indexRef.current = 0;
    pausedRef.current = false;
    setBgmStarted(true);
    playNext();
  }, [bgmStarted, playNext]);

  const pauseBgm = useCallback(() => {
    pausedRef.current = true;
    if (currentRef.current) currentRef.current.pause();
  }, []);

  const resumeBgm = useCallback(() => {
    pausedRef.current = false;
    if (currentRef.current) {
      currentRef.current.volume = mutedRef.current ? 0 : bgmVolRef.current;
      currentRef.current.play().catch(() => {});
    } else if (bgmStarted) {
      playNext();
    }
  }, [bgmStarted, playNext]);

  const playSe = useCallback((src) => {
    if (!src || mutedRef.current) return;
    const audio = new Audio(src);
    audio.volume = seVolume;
    audio.play().catch(() => {});
  }, [seVolume]);

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const newMuted = !m;
      mutedRef.current = newMuted;
      if (currentRef.current) {
        currentRef.current.volume = newMuted ? 0 : bgmVolRef.current;
      }
      return newMuted;
    });
  }, []);

  return {
    bgmVolume, setBgmVolume,
    seVolume, setSeVolume,
    muted, toggleMute,
    bgmStarted, startBgm,
    pauseBgm, resumeBgm, playSe,
  };
}
