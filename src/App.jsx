import { useState, useCallback, useRef, useEffect, Suspense, lazy } from 'react';
import Boot from './components/Boot';
import CrtOverlay from './components/CrtOverlay';
import NoiseOverlay from './components/NoiseOverlay';
import DesktopIcons from './components/DesktopIcons';
import Window from './components/Window';
import AboutWindow from './components/AboutWindow';
const BlogWindow = lazy(() => import('./components/BlogWindow'));
import MusicWindow from './components/MusicWindow';
import DumpWindow from './components/DumpWindow';
import TerminalWindow from './components/TerminalWindow';
import OscilloscopeWindow from './components/OscilloscopeWindow';
import GamesWindow, { preloadGamesCache } from './components/GamesWindow';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import Notification from './components/Notification';
import HomeWindow from './components/HomeWindow';
import useLanyard from './hooks/useLanyard';
import useScreenMode from './hooks/useScreenMode';
import MobileLayout from './components/MobileLayout';
import { commits, remote, buildDate } from 'virtual:git-info';
import { images as dumpImages } from 'virtual:dump-images';
import { posts } from './blog/posts';
import ambientSound from '../assets/ambient-sound.mp3';
import macSound from '../assets/mac-startup.mp3';
import { fadeIn, fadeOut } from './utils/audio';
import track0 from '../assets/Musica/akiba-kagami.mp3';
import track1 from '../assets/Musica/goreshit-fine-night.mp3';
import track2 from '../assets/Musica/machine-girl-ghost.mp3';
import track3 from '../assets/Musica/machine-girl-uzumaki.mp3';
import track4 from '../assets/Musica/sewerslvt-mr-kill-myself.mp3';
import cover0 from '../assets/covers/akiba-kagami.jpg';
import cover1 from '../assets/covers/goreshit-fine-night.jpg';
import cover2 from '../assets/covers/machine-girl-ghost.jpg';
import cover3 from '../assets/covers/machine-girl-uzumaki.jpg';
import cover4 from '../assets/covers/sewerslvt-mr-kill-myself.jpg';

const TASKBAR_H = 40;
const AMBIENT_VOL = 0.06;

const WIN_IDS = ['win-home', 'win-about', 'win-blog', 'win-music', 'win-dump', 'win-term', 'win-scope', 'win-games'];

const DEFAULT_SIZES = {
  'win-home':  { w: 500, h: 350 },
  'win-about': { w: 420, h: 500 },
  'win-blog':  { w: 600, h: 420 },
  'win-music': { w: 420, h: 320 },
  'win-dump':  { w: 500, h: 400 },
  'win-term':  { w: 640, h: 350 },
  'win-scope': { w: 420, h: 300 },
  'win-games': { w: 660, h: 480 },
};

function buildInitialWindows() {
  const result = {};
  for (const id of WIN_IDS) {
    const sz = DEFAULT_SIZES[id] || { w: 300, h: 200 };
    result[id] = { open: false, visible: false, focused: false, zIndex: 1, x: 0, y: 0, w: sz.w, h: sz.h };
  }
  return result;
}

const TRACKS = [
  { title: 'カガミ', artist: 'AKIBA',        src: track0, cover: cover0, duration: 138 },
  { title: 'Fine Night', artist: 'Goreshit',   src: track1, cover: cover1, duration: 316 },
  { title: 'Ghost', artist: 'Machine Girl',    src: track2, cover: cover2, duration: 185 },
  { title: 'うずまき', artist: 'Machine Girl', src: track3, cover: cover3, duration: 232 },
  { title: 'Mr. Kill Myself', artist: 'Sewerslvt', src: track4, cover: cover4, duration: 471 },
];

let zCounter = 10;

export default function App() {
  const [bootDone, setBootDone] = useState(false);
  const [windows, setWindows] = useState(buildInitialWindows);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [notif, setNotif] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const notifTimer = useRef(null);
  const ambientRef = useRef(null);
  const [desktopReveal, setDesktopReveal] = useState(false);
  const [mobileReveal, setMobileReveal] = useState(false);
  const audioRef = useRef(null);
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [noiseEnabled, setNoiseEnabled] = useState(true);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [glitchEnabled, setGlitchEnabled] = useState(true);
  const [lightMode, setLightMode] = useState(false);
  const [allMinimized, setAllMinimized] = useState(false);
  const lanyard = useLanyard();
  const mode = useScreenMode();
  const savedVisible = useRef(null);

  // Preload content during boot sequence
  useEffect(() => {
    preloadGamesCache();
    import('./components/BlogWindow');
    dumpImages.forEach(src => { const img = new Image(); img.src = src; });
  }, []);
  const [progress, setProgress] = useState(0);
  const [currentAudioTime, setCurrentAudioTime] = useState('00:00');
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [loopMode, setLoopMode] = useState(0); // 0=off, 1=repeat all, 2=repeat one

  const showNotif = useCallback((msg) => {
    setNotif(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotif(null), 2200);
  }, []);

  // ── Window management ──
  const focusWindow = useCallback((id) => {
    setWindows(prev => {
      zCounter++;
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], focused: key === id };
      }
      next[id].zIndex = zCounter;
      return next;
    });
  }, []);

  const openWindow = useCallback((id, pos) => {
    setWindows(prev => {
      const cur = prev[id];
      if (!cur) return prev;

      const winW = cur.w || 300;
      const winH = cur.h || 200;

      let nx = pos ? pos.x : cur.x, ny = pos ? pos.y : cur.y;

      if (!cur.open) {
        nx = Math.round((window.innerWidth - winW) / 2);
        ny = Math.round((window.innerHeight - TASKBAR_H - winH) / 2);
      }

      zCounter++;
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], focused: key === id };
      }
      next[id] = { ...cur, open: true, visible: true, focused: true, zIndex: zCounter, x: nx, y: ny };
      return next;
    });
    setStartMenuOpen(false);
  }, []);

  const closeWindow = useCallback((id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], open: false, visible: false } }));
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], visible: false } }));
  }, []);

  const moveWindow = useCallback((id, x, y) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], x, y },
    }));
  }, []);

  const resizeWindow = useCallback((id, x, y, w, h) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], x, y, w, h },
    }));
  }, []);

  // ── Music player ──
  const pickNextTrack = useCallback((prev) => {
    if (shuffle) {
      let next;
      do { next = Math.floor(Math.random() * TRACKS.length); }
      while (next === prev && TRACKS.length > 1);
      return next;
    }
    return (prev + 1) % TRACKS.length;
  }, [shuffle]);

  const pickPrevTrack = useCallback((prev) => {
    if (shuffle) {
      let next;
      do { next = Math.floor(Math.random() * TRACKS.length); }
      while (next === prev && TRACKS.length > 1);
      return next;
    }
    return (prev - 1 + TRACKS.length) % TRACKS.length;
  }, [shuffle]);

  const prevTrack = useCallback(() => {
    setCurrentTrack(prev => pickPrevTrack(prev));
    setProgress(0);
    setCurrentAudioTime('00:00');
  }, [pickPrevTrack]);
  const nextTrack = useCallback(() => {
    setCurrentTrack(prev => pickNextTrack(prev));
    setProgress(0);
    setCurrentAudioTime('00:00');
  }, [pickNextTrack]);
  const togglePlay = useCallback(() => setPlaying(prev => !prev), []);
  const handleVolumeChange = useCallback((v) => {
    setVolume(v);
  }, []);
  const toggleShuffle = useCallback(() => setShuffle(prev => !prev), []);
  const cycleLoop = useCallback(() => setLoopMode(prev => (prev + 1) % 3), []);
  const selectTrack = useCallback((i) => {
    setCurrentTrack(i);
    setProgress(0);
    setCurrentAudioTime('00:00');
    setPlaying(true);
  }, []);

  // ── Toggles ──
  const toggleCrt = useCallback(() => setCrtEnabled(prev => !prev), []);
  const toggleNoise = useCallback(() => setNoiseEnabled(prev => !prev), []);
  const toggleAmbient = useCallback(() => setAmbientEnabled(prev => !prev), []);
  const toggleGlitch = useCallback(() => setGlitchEnabled(prev => !prev), []);
  const toggleLightMode = useCallback(() => setLightMode(prev => !prev), []);

  // ── Desktop toggle (minimize/restore all) ──
  const toggleDesktop = useCallback(() => {
    setAllMinimized(prev => !prev);
  }, []);

  useEffect(() => {
    setWindows(prev => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key] };
      }
      if (allMinimized) {
        savedVisible.current = {};
        for (const key of Object.keys(prev)) {
          savedVisible.current[key] = prev[key].visible;
          next[key].visible = false;
        }
      } else {
        for (const key of Object.keys(prev)) {
          next[key].visible = savedVisible.current?.[key] || false;
        }
      }
      return next;
    });
  }, [allMinimized]);

  // ── Start menu ──
  const toggleStartMenu = useCallback(() => {
    setStartMenuOpen(prev => !prev);
  }, []);

  // Close start menu on desktop click
  const handleDesktopClick = useCallback(() => {
    setStartMenuOpen(false);
  }, []);

  // Listen for custom mazu-notif events (from maximize button, etc.)
  useEffect(() => {
    const handler = (e) => showNotif(e.detail);
    window.addEventListener('mazu-notif', handler);
    return () => window.removeEventListener('mazu-notif', handler);
  }, [showNotif]);

  // ── Glitch engine ──
  useEffect(() => {
    if (!glitchEnabled) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const el = document.querySelector('.window.focused');
        if (el) {
          el.classList.remove('tear');
          void el.offsetWidth;
          el.classList.add('tear');
        }
      }
      if (Math.random() < 0.05) {
        const desktop = document.getElementById('desktop');
        if (desktop) {
          desktop.classList.remove('shake');
          void desktop.offsetWidth;
          desktop.classList.add('shake');
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [glitchEnabled]);

  // Sync reveal states when switching modes after boot
  useEffect(() => {
    if (!bootDone) return;
    if (mode === 'mobile') {
      setDesktopReveal(false);
      setMobileReveal(true);
    } else {
      setMobileReveal(false);
      setDesktopReveal(true);
    }
  }, [mode, bootDone]);

  // Open only AboutWindow after boot, then trigger reveal
  useEffect(() => {
    if (bootDone) {
      if (mode === 'mobile') {
        setMobileReveal(true);
      } else {
        const vw = window.innerWidth;
        const vh = window.innerHeight - TASKBAR_H;
        setWindows(prev => {
          const next = {};
          for (const key of Object.keys(prev)) {
            next[key] = { ...prev[key], focused: false };
          }
          next['win-about'] = {
            ...prev['win-about'],
            x: Math.round(vw * 0.02),
            y: 0,
            w: Math.round(vw * 0.25),
            h: vh,
            open: true, visible: true, focused: true, zIndex: ++zCounter,
          };
          return next;
        });
        setStartMenuOpen(false);
        setDesktopReveal(true);
      }
    }
  }, [bootDone]);

  // Play Mac startup sound then crossfade to ambient background after boot
  useEffect(() => {
    if (!bootDone) return;

    const mac = new Audio(macSound);
    const ambient = new Audio(ambientSound);
    ambient.loop = true;
    ambientRef.current = ambient;

    fadeIn(mac, 0.12, 500);

    let crossfaded = false;

    mac.addEventListener('loadedmetadata', () => {
      const fadeStart = (mac.duration - 0.8) * 1000;
      if (fadeStart > 0) {
        setTimeout(() => {
          if (!crossfaded) {
            crossfaded = true;
            fadeOut(mac, 600);
            fadeIn(ambient, AMBIENT_VOL, 600);
          }
        }, fadeStart);
      }
    });

    mac.addEventListener('ended', () => {
      if (!crossfaded) {
        crossfaded = true;
        fadeIn(ambient, AMBIENT_VOL, 400);
      }
    });

    return () => {
      mac.pause();
      mac.currentTime = 0;
      ambient.pause();
      ambient.currentTime = 0;
      ambientRef.current = null;
    };
  }, [bootDone]);

  // ── Theme ──
  useEffect(() => {
    document.documentElement.style.filter = lightMode ? 'invert(1)' : '';
  }, [lightMode]);

  // ── Ambient audio toggle ──
  useEffect(() => {
    if (!ambientRef.current) return;
    if (ambientEnabled) {
      ambientRef.current.play().catch(() => {});
    } else {
      ambientRef.current.pause();
    }
  }, [ambientEnabled]);

  // ── Music track audio ──
  useEffect(() => {
    if (!bootDone) return;
    const audio = audioRef.current;
    if (!audio) return;

    const track = TRACKS[currentTrack];
    if (!track) return;

    audio.src = track.src;
    audio.volume = volume;
    audio.load();

    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60);
        setCurrentAudioTime(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }
    };

    const onEnded = () => {
      if (loopMode === 2) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      setCurrentTrack(prev => pickNextTrack(prev));
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [bootDone, currentTrack, playing, loopMode, pickNextTrack]);

  // ── Sync volume to audio element ──
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ── Responsive sizing for visible windows ──
  useEffect(() => {
    const updateSizes = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - TASKBAR_H;
      setWindows(prev => {
        const next = {};
        for (const key of Object.keys(prev)) {
          next[key] = { ...prev[key] };
        }
        if (next['win-about'].visible) {
          next['win-about'] = {
            ...next['win-about'],
            x: Math.round(vw * 0.02),
            w: Math.round(vw * 0.25),
            h: vh,
          };
        }
        return next;
      });
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // ── Window menubar configurations ──
  const menuFor = (id) => {
    const menus = {
      'win-home': [
        { label: 'File', onClick: () => showNotif('feature coming soon') },
        { label: 'Edit', onClick: () => showNotif('feature coming soon') },
        { label: 'View', onClick: () => showNotif('feature coming soon') },
      ],
      'win-about': [
        { label: 'File', onClick: () => showNotif('feature coming soon') },
        { label: 'Edit', onClick: () => showNotif('feature coming soon') },
        { label: 'View', onClick: () => showNotif('feature coming soon') },
      ],
      'win-blog': [
        { label: 'New Post',  onClick: () => showNotif('create a .md file in src/blog/ to publish') },
        { label: 'Archive',   onClick: () => showNotif('showing all posts (sorted by date)') },
        { label: 'Tags',      onClick: () => showNotif('click a tag in the list to filter') },
      ],
      'win-music': null,
      'win-games': [
        { label: 'Sort', onClick: () => window.dispatchEvent(new CustomEvent('mazu-notif', { detail: 'use the menubar in the games window' })) },
      ],
    };
    return menus[id] || null;
  };

  // ── Statusbar configurations ──
  const statusFor = (id) => {
    const statuses = {
      'win-home': [
        { text: 'v0.2.0', className: 'status-seg' },
        { text: `source: ${remote.replace(/^git@/, '').replace(/^https?:\/\//, '').replace(/\.git$/, '').replace(':', '/')}` },
      ],
      'win-about': [
        { text: 'ONLINE', className: 'status-seg c-accent' },
        { text: 'v0.2.0', className: 'status-seg' },
        { text: 'UTF-8' },
      ],
      'win-blog': [
        { text: `${posts.length} posts`, className: 'status-seg' },
        { text: 'read_only: false', className: 'status-seg' },
        { text: `latest: ${posts[0]?.date || '---'}`, className: 'status-seg' },
        { text: `${import.meta.env.DEV ? 'dev' : 'prod'}`, className: '' },
      ],
      'win-music': [
        { text: playing ? 'PLAYING' : 'PAUSED', className: 'status-seg c-red' },
        { text: `${TRACKS.length} tracks`, className: 'status-seg' },
        { text: `vol: ${Math.round(volume * 100)}%` },
      ],
      'win-games': [
        { text: 'GAME LIBRARY', className: 'status-seg c-accent' },
        { text: 'data: RAWG.io', className: 'status-seg' },
        { text: 'v0.2.0', className: '' },
      ],
    };
    return statuses[id] || null;
  };

  const focusedId = Object.keys(windows).find(id => windows[id].focused);

  const w = windows;

  const mobileProps = {
    tracks: TRACKS,
    currentTrack, playing, progress, currentAudioTime, volume, shuffle, loopMode,
    onPrev: prevTrack, onNext: nextTrack, onTogglePlay: togglePlay,
    onToggleShuffle: toggleShuffle, onCycleLoop: cycleLoop,
    onVolumeChange: handleVolumeChange, onSelectTrack: selectTrack,
    commits, remote, buildDate,
    blogCount: posts.length, tracksCount: TRACKS.length,
    lanyard, showNotif,
    onGlitch: () => {
      const el = document.querySelector('.window.focused');
      if (el) {
        el.classList.remove('tear');
        void el.offsetWidth;
        el.classList.add('tear');
        setTimeout(() => {
          const desktop = document.getElementById('desktop');
          if (desktop) {
            desktop.classList.remove('shake');
            void desktop.offsetWidth;
            desktop.classList.add('shake');
          }
        }, 100);
      }
    },
    audioRef: audioRef.current,
  };

  return (
    <>
      {!bootDone && <Boot onComplete={() => setBootDone(true)} />}
      {crtEnabled && <CrtOverlay />}
      {noiseEnabled && <NoiseOverlay />}

      <audio ref={audioRef} preload="auto" />

      {bootDone && mode === 'desktop' && (
        <>
      <div id="desktop" className={desktopReveal ? 'desktop-reveal' : ''} onClick={handleDesktopClick}>
        <Suspense fallback={null}>
        <div id="wallpaper">
          <img
            src="/assets/wallpaper.gif"
            alt="wallpaper"
            draggable={false}
          />
        </div>

        <DesktopIcons onOpen={openWindow} />

        <Window
          id="win-home" title="home.txt — MAZU-SPACE"
          x={w['win-home'].x} y={w['win-home'].y}
          width={w['win-home'].w} height={w['win-home'].h}
          visible={w['win-home'].visible}
          focused={w['win-home'].focused}
          zIndex={w['win-home'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          menubar={menuFor('win-home')}
          statusbar={statusFor('win-home')}
        >
          <HomeWindow
            commits={commits}
            remote={remote}
            buildDate={buildDate}
            blogCount={posts.length}
            tracksCount={TRACKS.length}
            lanyard={lanyard}
          />
        </Window>

        <Window
          id="win-about" title="about.txt — mazu-space"
          x={w['win-about'].x} y={w['win-about'].y}
          width={w['win-about'].w} height={w['win-about'].h}
          visible={w['win-about'].visible}
          focused={w['win-about'].focused}
          zIndex={w['win-about'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          menubar={menuFor('win-about')}
          statusbar={statusFor('win-about')}
        >
          <AboutWindow />
        </Window>

        <Window
          id="win-blog" title="blog.txt — THOUGHTS"
          x={w['win-blog'].x} y={w['win-blog'].y}
          width={w['win-blog'].w} height={w['win-blog'].h}
          visible={w['win-blog'].visible}
          focused={w['win-blog'].focused}
          zIndex={w['win-blog'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          menubar={menuFor('win-blog')}
          statusbar={statusFor('win-blog')}
        >
          <BlogWindow onNotif={showNotif} />
        </Window>

          <Window
            id="win-music" title="player.exe — MEDIA"
            x={w['win-music'].x} y={w['win-music'].y}
            width={w['win-music'].w} height={w['win-music'].h}
            visible={w['win-music'].visible}
            focused={w['win-music'].focused}
            zIndex={w['win-music'].zIndex}
            onFocus={focusWindow}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            menubar={menuFor('win-music')}
            statusbar={statusFor('win-music')}
          >
          <MusicWindow
            tracks={TRACKS}
            currentTrack={currentTrack}
            playing={playing}
            progress={progress}
            currentAudioTime={currentAudioTime}
            volume={volume}
            shuffle={shuffle}
            loopMode={loopMode}
            onPrev={prevTrack}
            onNext={nextTrack}
            onTogglePlay={togglePlay}
            onToggleShuffle={toggleShuffle}
            onCycleLoop={cycleLoop}
            onVolumeChange={handleVolumeChange}
            onSelectTrack={selectTrack}
            onNotif={showNotif}
            lanyard={lanyard}
          />
          <audio ref={audioRef} preload="auto" />
        </Window>

        <DumpWindow
          id="win-dump"
          x={w['win-dump'].x} y={w['win-dump'].y}
          width={w['win-dump'].w} height={w['win-dump'].h}
          visible={w['win-dump'].visible}
          focused={w['win-dump'].focused}
          zIndex={w['win-dump'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
        />



        <Window
          id="win-term" title="cmd.exe"
          x={w['win-term'].x} y={w['win-term'].y}
          width={w['win-term'].w} height={w['win-term'].h}
          visible={w['win-term'].visible}
          focused={w['win-term'].focused}
          zIndex={w['win-term'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
        >
          <TerminalWindow
            onOpen={openWindow}
            onGlitch={() => {
              const el = document.querySelector('.window.focused');
              if (el) {
                el.classList.remove('tear');
                void el.offsetWidth;
                el.classList.add('tear');
                setTimeout(() => {
                  const desktop = document.getElementById('desktop');
                  if (desktop) {
                    desktop.classList.remove('shake');
                    void desktop.offsetWidth;
                    desktop.classList.add('shake');
                  }
                }, 100);
              }
            }}
          />
        </Window>

        <OscilloscopeWindow
          id="win-scope"
          x={w['win-scope'].x} y={w['win-scope'].y}
          width={w['win-scope'].w} height={w['win-scope'].h}
          visible={w['win-scope'].visible}
          focused={w['win-scope'].focused}
          zIndex={w['win-scope'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          audioElement={audioRef.current}
          trackKey={currentTrack}
        />

        <GamesWindow
          id="win-games"
          x={w['win-games'].x} y={w['win-games'].y}
          width={w['win-games'].w} height={w['win-games'].h}
          visible={w['win-games'].visible}
          focused={w['win-games'].focused}
          zIndex={w['win-games'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
        />

        <Notification message={notif} />
      </Suspense>
      </div>

      <StartMenu open={startMenuOpen} onOpen={openWindow} onNotif={showNotif} />
      <Taskbar
        windows={windows}
        focusedId={focusedId}
        onOpenWindow={openWindow}
        onMinimizeWindow={minimizeWindow}
        onToggleStartMenu={toggleStartMenu}
        settings={{ crt: crtEnabled, noise: noiseEnabled, ambient: ambientEnabled, glitch: glitchEnabled, lightMode }}
        onToggleCrt={toggleCrt}
        onToggleNoise={toggleNoise}
        onToggleAmbient={toggleAmbient}
        onToggleGlitch={toggleGlitch}
        onToggleLightMode={toggleLightMode}
        onToggleDesktop={toggleDesktop}
        allMinimized={allMinimized}
      />
      </>
      )}
      {bootDone && mode === 'mobile' && (
        <div className={'mobile-reveal-wrap' + (mobileReveal ? ' mobile-reveal-active' : '')}>
          <MobileLayout {...mobileProps} />
        </div>
      )}
    </>
  );
}
