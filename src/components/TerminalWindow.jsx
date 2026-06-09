import { useState, useRef, useEffect, useCallback } from 'react';

const termCmds = {
  help:    '// available: help, about, ls, date, clear, echo [text], glitch, sysinfo, fastfetch, cmatrix',
  about:   '// mazu-space \u2014 my little corner of the internet.',
  ls:      'about.txt\nblog.txt\nplayer.exe\ndump/\nlinks.ini',
  sysinfo: `// mazu-space OS v0.2.0\n// arch: x86\n// mem: 64MB\n// net: loopback\n// uptime: unknown`,
};

const fileMap = {
  'about.txt': 'win-about',
  'blog.txt': 'win-blog',
  'player.exe': 'win-music',
  'dump/': 'win-dump',
  'links.ini': 'win-links',
};

function buildFastfetch() {
  const os = navigator.platform || 'unknown';
  const ua = navigator.userAgent || 'unknown';
  const lang = navigator.language || 'unknown';
  const cores = navigator.hardwareConcurrency || '?';
  const res = window.screen.width + '\u00d7' + window.screen.height;
  return [
    ['OS', os],
    ['Host', 'custom'],
    ['Kernel', ua.slice(0, 40)],
    ['Uptime', 'session active'],
    ['Shell', 'cmd.exe v0.2.0'],
    ['Resolution', res],
    ['Terminal', 'mazu-term'],
    ['CPU', cores + ' threads'],
    ['Locale', lang],
  ].map(([k, v]) => '// ' + k.padEnd(12) + v).join('\n');
}

const MATRIX_CHARS = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30ca\u30cb\u30cc\u30cd\u30ce\u30cf\u30d2\u30d5\u30d8\u30db\u30de\u30df\u30e0\u30e1\u30e2\u30e4\u30e6\u30e8\u30e9\u30ea\u30eb\u30ec\u30ed\u30ef\u30f2\u30f30123456789ABCDEF';

export default function TerminalWindow({ onGlitch, onOpen, startupCmd }) {
  const [lines, setLines] = useState([
    { html: '<span class="c-dim">mazu-space OS [v0.2.0]</span>' },
    { html: '<span class="c-dim">\u00a9 2025 mazu</span>' },
    { html: '<br/>' },
  ]);
  const [input, setInput] = useState('');
  const [inputHistory, setInputHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [matrixActive, setMatrixActive] = useState(false);
  const outputRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const matrixCanvasRef = useRef(null);
  const matrixFrameRef = useRef(null);

  const executeCommand = useCallback((cmd) => {
    const trimmed = cmd.trim();
    if (trimmed === '') return;

    if (trimmed === 'clear') {
      setLines([]);
      return;
    }

    const lower = trimmed.toLowerCase();

    if (lower === 'cmatrix') {
      setMatrixActive(true);
      setLines(prev => [...prev,
        { html: '<span class="c-dim">\u2014\u2014</span>' },
        { html: '<span class="c-accent">C:\\&gt;</span> ' + trimmed },
        { html: '<span class="c-red">// cmatrix: press any key to exit</span><br/>' },
      ]);
      return;
    }

    const cmdBase = lower.split(' ')[0];
    let response = '';

    if (cmdBase === 'echo') {
      response = cmd.slice(5);
    } else if (lower === 'glitch') {
      response = '// glitching the matrix...';
      if (onGlitch) setTimeout(onGlitch, 50);
    } else if (lower === 'fastfetch') {
      response = buildFastfetch();
    } else if (termCmds[lower]) {
      if (lower === 'date') {
        response = '// ' + new Date().toLocaleDateString('en-GB');
      } else {
        response = termCmds[lower];
      }
    } else if (fileMap[lower]) {
      response = '// opening ' + trimmed + '...';
      if (onOpen) setTimeout(() => onOpen(fileMap[lower]), 50);
    } else {
      response = '<span class="c-red">// \'' + trimmed + '\' not recognized. type \'help\'</span>';
    }

    setLines(prev => [...prev,
      { html: '<span class="c-dim">\u2014\u2014</span>' },
      { html: '<span class="c-accent">C:\\&gt;</span> ' + trimmed },
      { html: response.replace(/\n/g, '<br/>') + '<br/>' },
    ]);
  }, [onGlitch, onOpen]);

  const handleKeyDown = useCallback((e) => {
    if (matrixActive) {
      e.preventDefault();
      setMatrixActive(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      setInputHistory(prev => [...prev, input]);
      setHistoryIdx(-1);
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const newIdx = historyIdx === -1 ? inputHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(inputHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1;
        if (newIdx >= inputHistory.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(inputHistory[newIdx]);
        }
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setInput(prev => prev.slice(0, -1));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setInput(prev => prev + e.key);
    }
  }, [input, inputHistory, historyIdx, executeCommand, matrixActive]);

  const startupDone = useRef(false);

  useEffect(() => {
    if (startupCmd && !startupDone.current) {
      startupDone.current = true;
      executeCommand(startupCmd);
    }
  }, [startupCmd, executeCommand]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines, input]);

  useEffect(() => {
    if (!matrixActive) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    const FONT_SIZE = 14;
    const palette = [
      { r: 255, g: 255, b: 255 },
      { r: 220, g: 220, b: 220 },
      { r: 180, g: 180, b: 180 },
      { r: 255, g: 60,  b: 60  },
      { r: 255, g: 100, b: 100 },
    ];

    let drops = [];

    function resizeCanvas() {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, w, h);
      const newCols = Math.floor(w / FONT_SIZE);
      const old = drops;
      drops = new Array(newCols);
      for (let i = 0; i < newCols; i++) {
        if (old && old[i]) {
          drops[i] = old[i];
        } else {
          drops[i] = {
            y: Math.random() * -h,
            speed: 0.5 + Math.random() * 2.5,
            color: palette[Math.floor(Math.random() * palette.length)],
          };
        }
      }
    }

    resizeCanvas();

    let running = true;
    const draw = () => {
      if (!running) return;
      resizeCanvas();
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = 'rgba(3, 3, 3, 0.06)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = FONT_SIZE + 'px monospace';
      ctx.textBaseline = 'top';

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const x = i * FONT_SIZE;
        const y = Math.floor(d.y);
        const c = d.color;

        for (let j = 1; j <= 10; j++) {
          const ty = y - j * FONT_SIZE;
          if (ty < 0) continue;
          ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (0.08 * (1 - j / 11)) + ')';
          ctx.fillText(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], x, ty);
        }

        ctx.fillStyle = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
        ctx.fillText(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)], x, y);

        d.y += d.speed;
        if (d.y > h && Math.random() > 0.975) {
          d.y = -FONT_SIZE * (1 + Math.random() * 20);
          d.speed = 0.5 + Math.random() * 2.5;
          d.color = palette[Math.floor(Math.random() * palette.length)];
        }
      }

      matrixFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      if (matrixFrameRef.current) {
        cancelAnimationFrame(matrixFrameRef.current);
        matrixFrameRef.current = null;
      }
    };
  }, [matrixActive]);

  return (
    <>
      <div
        ref={outputRef}
        className="win-content"
        onClick={() => hiddenInputRef.current?.focus()}
        style={{ cursor: 'text', minHeight: 120, position: 'relative', height: '100%' }}
      >
        {lines.map((line, i) => (
          <span key={i} dangerouslySetInnerHTML={{ __html: line.html }} />
        ))}
        {matrixActive && <canvas ref={matrixCanvasRef} className="matrix-canvas" />}
        <div>
          <span className="c-accent">C:\&gt;</span> {input}<span className="cursor" style={{ verticalAlign: 'text-bottom' }} />
        </div>
      </div>
      <input
        ref={hiddenInputRef}
        type="text"
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        value=""
        style={{
          position: 'absolute', opacity: 0, width: 0, height: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
    </>
  );
}
