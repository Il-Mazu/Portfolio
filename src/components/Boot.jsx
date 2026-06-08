import { useEffect, useState, useRef } from 'react';
import bootSound from '../../assets/Old 90s PC boot sequence (4K) [692Z_adAsMQ].mp3';
import { fadeOut } from '../utils/audio';

const bootMsgs = [
  { text: '[ BIOS ] BOIA-BIOS v1.0a',         delay: 350 },
  { text: '[ BIOS ] POST: OK',                     delay: 200 },
  { text: '[ BIOS ] Si va: a letto',               delay: 300 },
  { text: '[ BIOS ] loading kernel...',            delay: 350 },
  { text: '[ SYS  ] mazu/OS v0.2.0',                delay: 200 },
  { text: '[ SYS  ] Per: forza',                   delay: 200 },
  { text: '[ NET  ] interface: loopback only',     delay: 300 },
  { text: '[ SYS  ] entering desktop...',          delay: 600 },
];

const ascii = `   /'\\_/\\\`                                                                              
  /\\      \\     __     ____    __  __             ____  _____      __      ___     __   
 \\ \\ \\__\\ \\  /'__\`\\  /\\_ ,\`\\ /\\ \\/\\ \\  _______  /',__\\/\\ '__\`\\  /'__\`\\   /'___\\ /'__\`\\ 
  \\ \\ \\_/\\ \\/\\ \\L\\.\\_\\/_/  /_\\ \\ \\_\\ \\/\\______\\/\\__, \`\\ \\ \\L\\ \\/\\ \\L\\.\\_/\\ \\__//\\  __/ 
   \\ \\_\\\\ \\_\\/\\__/.\\_\\ /\\____\\\\ \\____\\/\\______\\/\\____/\\ \\ ,__/\\ \\__/.\\_\\/\\____\\ \\____\\
    \\/_/ \\/_/\\/__/\\/_/ \\/____/ \\/___/           \\/___/  \\ \\ \\/  \\/__/\\/_/\\/____/\\/____/
                                                           \\ \\_\\                         
                                                            \\/_/                         `;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default function Boot({ onComplete }) {
  const [statusLines, setStatusLines] = useState([]);
  const [showCursor, setShowCursor] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [started, setStarted] = useState(false);
  const doneRef = useRef(false);
  const lineCounter = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const audioRef = useRef(null);
  const btnRef = useRef(null);
  onCompleteRef.current = onComplete;

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const skipBoot = () => {
    if (!doneRef.current) {
      doneRef.current = true;
      setHidden(true);
      fadeOut(audioRef.current, 600);
      setTimeout(() => onCompleteRef.current?.(), 600);
    }
  };

  const startBoot = () => setStarted(true);

  useEffect(() => {
    if (!started) return;

    let cancelled = false;

    const audio = new Audio(bootSound);
    audio.volume = 0.12;
    audioRef.current = audio;
    audio.play().catch(() => {});

    async function run() {
      setStatusLines([]);
      lineCounter.current = 0;

      // Phase 1 — power-on
      await sleep(700);

      // Phase 2 — memory test
      setShowCursor(false);
      for (let mem = 0; mem <= 65536; mem += 1024) {
        if (cancelled) return;
        const lineIdx = lineCounter.current;
        setStatusLines(prev => {
          const next = [...prev];
          next[lineIdx] = { text: `[ BIOS ] memory: ${String(mem).padStart(5, '0')}KB`, done: true };
          return next;
        });
        await sleep(4);
      }
      {
        const lineIdx = lineCounter.current;
        setStatusLines(prev => {
          const next = [...prev];
          next[lineIdx] = { text: '[ BIOS ] memory: 65536KB OK', done: true };
          return next;
        });
      }
      await sleep(350);
      setShowCursor(true);

      // Phase 3 — typewriter messages
      for (const msg of bootMsgs) {
        if (cancelled) return;
        lineCounter.current++;
        const lineIdx = lineCounter.current;
        let typed = '';
        for (let c = 0; c < msg.text.length; c++) {
          if (cancelled) return;
          typed += msg.text[c];
          setStatusLines(prev => {
            const next = [...prev];
            next[lineIdx] = { text: typed, done: false };
            return next;
          });
          await sleep(10 + Math.random() * 8);
        }
        setStatusLines(prev => {
          const next = [...prev];
          next[lineIdx] = { text: msg.text, done: true };
          return next;
        });
        await sleep(msg.delay);
      }

      // Phase 4 — loading bar
      setShowCursor(false);
      lineCounter.current++;
      const loadIdx = lineCounter.current;
      for (let pct = 0; pct <= 100; pct += 2) {
        if (cancelled) return;
        const blocks = Math.floor(pct / 5);
        const bar = '#'.repeat(blocks) + '.'.repeat(20 - blocks);
        setStatusLines(prev => {
          const next = [...prev];
          next[loadIdx] = { text: `[ SYS  ] [${bar}] ${String(pct).padStart(3)}%`, done: true };
          return next;
        });
        await sleep(25);
      }
      setStatusLines(prev => {
        const next = [...prev];
        next[loadIdx] = { text: '[ SYS  ] [####################] 100%', done: true };
        return next;
      });
      await sleep(600);

      // Phase 5 — fade out
      await sleep(200);
      if (!cancelled) {
        setHidden(true);
        fadeOut(audioRef.current, 600);
        await sleep(600);
        if (onComplete && !doneRef.current) {
          doneRef.current = true;
          onComplete();
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [started]);

  useEffect(() => {
    if (started) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') startBoot();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [started]);

  return (
    <div id="boot" className={hidden ? 'hidden' : ''}>
      <div id="boot-terminal">
        <pre className="ascii-art">{ascii}</pre>
        {!started ? (
          <div className="enter-area" style={{ marginTop: 16 }}>
            <span style={{ color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: 16 }}>
              &gt;
            </span>{' '}
            <button
              ref={btnRef}
              autoFocus
              onClick={startBoot}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 16,
                cursor: 'pointer',
                padding: 0,
                display: 'inline',
                outline: 'none',
              }}
              onMouseEnter={e => { e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.color = '#aaa'; }}
            >
              PRESS ENTER
            </button>
            <span className="boot-cursor">_</span>
          </div>
        ) : (
          <>
            <div className="boot-status">
              {statusLines.map((line, i) => (
                <div key={i}>{line.text}</div>
              ))}
            </div>
            {showCursor && <span className="boot-cursor">_</span>}
          </>
        )}
      </div>
      <button
        onClick={skipBoot}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 10001,
          background: '#111',
          color: '#666',
          border: '1px solid #333',
          padding: '4px 12px',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 12,
          cursor: 'pointer',
          opacity: 0.5,
        }}
        onMouseEnter={e => { e.target.style.opacity = 1; e.target.style.color = '#aaa'; }}
        onMouseLeave={e => { e.target.style.opacity = 0.5; e.target.style.color = '#666'; }}
      >
        SKIP &gt;&gt;
      </button>
    </div>
  );
}
