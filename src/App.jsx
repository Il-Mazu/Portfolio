import { useState, useCallback, useRef, useEffect } from 'react';
import Boot from './components/Boot';
import CrtOverlay from './components/CrtOverlay';
import NoiseOverlay from './components/NoiseOverlay';
import DesktopIcons from './components/DesktopIcons';
import Window from './components/Window';
import AboutWindow from './components/AboutWindow';
import BlogWindow from './components/BlogWindow';
import MusicWindow from './components/MusicWindow';
import DumpWindow from './components/DumpWindow';
import LinksWindow from './components/LinksWindow';
import TerminalWindow from './components/TerminalWindow';
import Taskbar from './components/Taskbar';
import StartMenu from './components/StartMenu';
import Notification from './components/Notification';
import ambientSound from '../assets/ASMR - Alien： Isolation - Nap Time near a Computer Console - Ambient Sounds - NO Aliens Aboard! [rPMG0PLmh9s].mp3';
import macSound from '../assets/Mac OS startup sound Big Sur [coxK3eWG20c].mp3';
import { fadeIn, fadeOut } from './utils/audio';

const AMBIENT_VOL = 0.06;

  const INITIAL_WINDOWS = {
    'win-about': { open: false, visible: false, focused: false, zIndex: 1,  x: 20,  y: 0,   w: 380, h: null },
    'win-blog':  { open: false, visible: false, focused: false, zIndex: 1,  x: 440, y: 28,  w: 330, h: null },
    'win-music': { open: false, visible: false, focused: false, zIndex: 1,  x: 440, y: 300, w: 330, h: null },
    'win-dump':  { open: false, visible: false, focused: false, zIndex: 1,  x: 620, y: 390, w: 480, h: 360 },
    'win-links': { open: false, visible: false, focused: false, zIndex: 1,  x: 320, y: 340, w: 240, h: null },
    'win-term':  { open: false, visible: false, focused: false, zIndex: 1,  x: 780, y: 28,  w: 240, h: null },
  };

const TRACKS = [
  { title: 'burial — archangel',       time: '04:18', progress: 52 },
  { title: 'actress — raven',          time: '05:34', progress: 0  },
  { title: 'arca — coraje',            time: '03:12', progress: 0  },
  { title: 'raime — exist in repeat',  time: '06:47', progress: 0  },
];

let zCounter = 10;

export default function App() {
  const [bootDone, setBootDone] = useState(false);
  const [windows, setWindows] = useState(INITIAL_WINDOWS);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [notif, setNotif] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(true);
  const notifTimer = useRef(null);
  const [initialAnimDone, setInitialAnimDone] = useState(false);

  const getResponsiveSizes = useCallback(() => ({
    aboutW: Math.min(420, Math.round(window.innerWidth * 0.32)),
    aboutH: window.innerHeight - 32,
    dumpW: Math.min(400, Math.round(window.innerWidth * 0.22)),
    dumpH: Math.min(300, Math.round(window.innerHeight * 0.24)),
  }), []);

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

      const visible = Object.keys(prev)
        .filter(k => prev[k].visible && k !== id)
        .map(k => ({
          x: prev[k].x, y: prev[k].y,
          w: prev[k].w || 300, h: prev[k].h || 200,
        }));

      const winW = cur.w || 300;
      const winH = cur.h || 200;

      const overlaps = (x, y) =>
        visible.some(r =>
          x + winW > r.x && x < r.x + r.w &&
          y + winH > r.y && y < r.y + r.h
        );

      let nx = pos ? pos.x : cur.x, ny = pos ? pos.y : cur.y;

      if (overlaps(nx, ny)) {
        nx = cur.x + 30;
        ny = cur.y + 30;
        if (overlaps(nx, ny)) {
          const maxX = window.innerWidth - 180;
          const maxY = window.innerHeight - 32 - 100;
          let found = false;
          for (let gy = 0; gy <= maxY && !found; gy += 40) {
            for (let gx = 0; gx <= maxX && !found; gx += 40) {
              if (!overlaps(gx, gy)) {
                nx = gx; ny = gy;
                found = true;
              }
            }
          }
          if (!found) { nx = cur.x; ny = cur.y; }
        }
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
  const prevTrack = useCallback(() => {
    setCurrentTrack(prev => (prev - 1 + TRACKS.length) % TRACKS.length);
  }, []);
  const nextTrack = useCallback(() => {
    setCurrentTrack(prev => (prev + 1) % TRACKS.length);
  }, []);
  const togglePlay = useCallback(() => setPlaying(prev => !prev), []);
  const selectTrack = useCallback((i) => {
    setCurrentTrack(i);
    setPlaying(true);
  }, []);

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

  // ── Glitch ──
  const triggerGlitch = useCallback(() => {
    setWindows(prev => {
      const focusedId = Object.keys(prev).find(id => prev[id].focused);
      if (!focusedId) return prev;
      return prev; // glitch effect handled in component
    });
  }, []);

  // ── Glitch engine ──
  useEffect(() => {
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
  }, []);

  // Open about and dump windows with CRT power-on after boot sequence completes
  useEffect(() => {
    if (bootDone) {
      const { dumpW, dumpH } = getResponsiveSizes();
      const bigW = Math.min(500, Math.round(dumpW * 1.25));
      const bigH = Math.min(375, Math.round(dumpH * 1.25));
      const dx = Math.max(0, window.innerWidth - bigW - 20);
      const dy = Math.max(0, window.innerHeight - 32 - bigH - 20);
      const aboutZ = ++zCounter;
      const dumpZ = ++zCounter;
      setWindows(prev => {
        const next = {};
        for (const key of Object.keys(prev)) {
          next[key] = { ...prev[key], focused: key === 'win-dump' };
        }
        next['win-about'] = {
          ...prev['win-about'], open: true, visible: true, focused: false,
          zIndex: aboutZ,
        };
        next['win-dump'] = {
          ...prev['win-dump'], open: true, visible: true, focused: true,
          zIndex: dumpZ, x: dx, y: dy, w: bigW, h: bigH,
        };
        return next;
      });
      setStartMenuOpen(false);
      setTimeout(() => setInitialAnimDone(true), 1200);
    }
  }, [bootDone, getResponsiveSizes]);

  // Play Mac startup sound then crossfade to ambient background after boot
  useEffect(() => {
    if (!bootDone) return;

    const mac = new Audio(macSound);
    const ambient = new Audio(ambientSound);
    ambient.loop = true;

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
    };
  }, [bootDone]);

  // ── Responsive sizing ──
  useEffect(() => {
    const updateSizes = () => {
      const { aboutW, aboutH, dumpW, dumpH } = getResponsiveSizes();
      setWindows(prev => ({
        ...prev,
        'win-about': {
          ...prev['win-about'],
          x: 20,
          y: 0,
          w: aboutW,
          h: aboutH,
        },
        'win-dump': {
          ...prev['win-dump'],
          w: dumpW,
          h: dumpH,
          x: Math.min(prev['win-dump'].x, window.innerWidth - dumpW - 20),
          y: Math.min(prev['win-dump'].y, window.innerHeight - 32 - dumpH - 20),
        },
      }));
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [getResponsiveSizes]);

  // ── Window menubar configurations ──
  const menuFor = (id) => {
    const menus = {
      'win-about': [
        { label: 'File', onClick: () => showNotif() },
        { label: 'Edit', onClick: () => showNotif() },
        { label: 'View', onClick: () => showNotif() },
      ],
      'win-blog': [
        { label: 'New Post',  onClick: () => showNotif('// new post: not implemented') },
        { label: 'Archive',   onClick: () => showNotif() },
        { label: 'Tags',      onClick: () => showNotif() },
      ],
      'win-music': [
        { label: 'File',     onClick: () => showNotif() },
        { label: 'Playlist', onClick: () => showNotif() },
        { label: 'Vis',      onClick: () => showNotif() },
      ],
      'win-links': [
        { label: 'Add',  onClick: () => showNotif() },
        { label: 'Sort', onClick: () => showNotif() },
      ],
    };
    return menus[id] || null;
  };

  // ── Statusbar configurations ──
  const statusFor = (id) => {
    const statuses = {
      'win-about': [
        { text: 'ONLINE', className: 'status-seg c-accent' },
        { text: 'v0.2.0', className: 'status-seg' },
        { text: 'UTF-8' },
      ],
      'win-blog': [
        { text: '6 posts', className: 'status-seg' },
        { text: 'read_only: false', className: 'status-seg' },
        { text: 'latest: 2025.06.07' },
      ],
      'win-music': [
        { text: 'PLAYING', className: 'status-seg c-green' },
        { text: '4 tracks', className: 'status-seg' },
        { text: 'vol: 80%' },
      ],
      'win-links': [
        { text: '7 links' },
      ],
    };
    return statuses[id] || null;
  };

  const focusedId = Object.keys(windows).find(id => windows[id].focused);

  const w = windows;

  return (
    <>
      {!bootDone && <Boot onComplete={() => setBootDone(true)} />}
      <CrtOverlay />
      <NoiseOverlay />

      <div id="desktop" onClick={handleDesktopClick}>
        <div id="wallpaper">
          <img
            src="/assets/SnapInsta.to_AQP6ityFpUZrqTmrQLvEfDJDLAQZ4IymuY53NRO4PN-QJhqHphA2zinPKk_myDBZjalUVKln64QGcWrenJJqa8UqeibABN51CJXzfv4.gif"
            alt="wallpaper"
            draggable={false}
          />
        </div>

        <DesktopIcons onOpen={openWindow} />

        <Window
          id="win-about" title="about.txt — mazu-space"
          x={w['win-about'].x} y={w['win-about'].y}
          width={w['win-about'].w} height={w['win-about'].h}
          visible={w['win-about'].visible}
          focused={w['win-about'].focused}
          zIndex={w['win-about'].zIndex}
          powerOn={!initialAnimDone}
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
            onPrev={prevTrack}
            onNext={nextTrack}
            onTogglePlay={togglePlay}
            onSelectTrack={selectTrack}
            onNotif={showNotif}
          />
        </Window>

        <DumpWindow
          id="win-dump"
          x={w['win-dump'].x} y={w['win-dump'].y}
          width={w['win-dump'].w} height={w['win-dump'].h}
          visible={w['win-dump'].visible}
          focused={w['win-dump'].focused}
          zIndex={w['win-dump'].zIndex}
          powerOn={!initialAnimDone}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
        />

        <Window
          id="win-links" title="links.ini — NET"
          x={w['win-links'].x} y={w['win-links'].y}
          width={w['win-links'].w} height={w['win-links'].h}
          visible={w['win-links'].visible}
          focused={w['win-links'].focused}
          zIndex={w['win-links'].zIndex}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMove={moveWindow}
          onResize={resizeWindow}
          menubar={menuFor('win-links')}
          statusbar={statusFor('win-links')}
        >
          <LinksWindow />
        </Window>

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

        <Notification message={notif} />
      </div>

      <StartMenu open={startMenuOpen} onOpen={openWindow} onNotif={showNotif} />
      <Taskbar
        windows={windows}
        focusedId={focusedId}
        onOpenWindow={openWindow}
        onMinimizeWindow={minimizeWindow}
        onToggleStartMenu={toggleStartMenu}
      />
    </>
  );
}
