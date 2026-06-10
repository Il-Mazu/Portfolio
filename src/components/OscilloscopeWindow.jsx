import { useState, useEffect, useRef, useCallback } from 'react';

export default function OscilloscopeWindow({
  id, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize, onMove, onResize,
  audioElement, trackKey,
}) {
  const winRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const noiseRef = useRef([]);
  const lastActiveRef = useRef(false);
  const [audioActive, setAudioActive] = useState(false);

  const handleMouseDown = useCallback(() => {
    if (onFocus) onFocus(id);
  }, [id, onFocus]);

  const handleTitleMouseDown = useCallback((e) => {
    if (e.target.closest('.win-btn')) return;
    const win = winRef.current;
    if (!win) return;
    const rect = win.getBoundingClientRect();
    dragRef.current = {
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;
      const { ox, oy } = dragRef.current;
      const nx = Math.max(0, Math.min(window.innerWidth - 180, e.clientX - ox));
      const ny = Math.max(0, Math.min(window.innerHeight - 40 - 100, e.clientY - oy));
      onMove(id, nx, ny);
    };
    const handleMouseUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [id, onMove]);

  const handleResizeMouseDown = useCallback((e) => {
    const win = winRef.current;
    if (!win) return;
    const rect = win.getBoundingClientRect();
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: rect.width, startH: rect.height,
      startL: rect.left, startT: rect.top,
    };
    e.preventDefault();
    if (onFocus) onFocus(id);
  }, [id, onFocus]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizeRef.current) return;
      const { startX, startY, startW, startH, startL, startT } = resizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newW = startW + dx;
      let newH = startH + dy;
      if (newW < 280) newW = 280;
      if (newH < 160) newH = 160;
      onResize(id, startL, startT, newW, newH);
    };
    const handleMouseUp = () => { resizeRef.current = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [id, onResize]);

  useEffect(() => {
    if (!audioElement || !audioElement.captureStream) {
      setAudioActive(false);
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    let source = null;
    let stream = null;

    function connect() {
      if (source) {
        try { source.disconnect(); } catch(_) {}
        source = null;
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      sourceRef.current = null;
      setAudioActive(false);

      try {
        const s = audioElement.captureStream();
        if (s.getAudioTracks().length > 0) {
          stream = s;
          source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          sourceRef.current = source;
          setAudioActive(true);
        } else {
          s.getTracks().forEach(t => t.stop());
        }
      } catch (_) {}
    }

    const resumeCtx = () => {
      if (ctx.state === 'suspended') ctx.resume();
    };
    document.addEventListener('pointerdown', resumeCtx, { once: true });

    connect();

    const onDataLoaded = () => connect();
    const onLoadStart = () => {
      if (source) {
        try { source.disconnect(); } catch(_) {}
        source = null;
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      sourceRef.current = null;
      setAudioActive(false);
    };
    audioElement.addEventListener('loadstart', onLoadStart);
    audioElement.addEventListener('loadeddata', onDataLoaded);

    return () => {
      document.removeEventListener('pointerdown', resumeCtx);
      audioElement.removeEventListener('loadstart', onLoadStart);
      audioElement.removeEventListener('loadeddata', onDataLoaded);
      if (source) { try { source.disconnect(); } catch(_) {} }
      if (stream) { stream.getTracks().forEach(t => t.stop()); }
      if (ctx.state !== 'closed') { ctx.close(); }
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setAudioActive(false);
    };
  }, [audioElement, trackKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const c = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);

      const len = Math.max(Math.floor(w), 1);
      const newNoise = new Array(len);
      const old = noiseRef.current;
      for (let i = 0; i < len; i++) {
        newNoise[i] = old && old[i] !== undefined ? old[i] : (Math.random() - 0.5) * 20;
      }
      noiseRef.current = newNoise;
    }

    resizeCanvas();

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvas.parentElement);

    function getColor(t) {
      const p = Math.min(1, Math.max(0, t));
      const r = Math.round(255 + (204 - 255) * p);
      const g = Math.round(255 + (34 - 255) * p);
      const b = Math.round(255 + (34 - 255) * p);
      return `rgb(${r},${g},${b})`;
    }

    let running = true;

    function draw() {
      if (!running) return;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (w < 1 || h < 1) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      c.clearRect(0, 0, w, h);

      const analyser = analyserRef.current;
      const el = audioElement;
      const isActive = analyser && sourceRef.current && el && !el.paused && !el.ended && el.readyState > 0;

      if (isActive !== lastActiveRef.current) {
        lastActiveRef.current = isActive;
        setAudioActive(isActive);
      }

      if (isActive) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        c.beginPath();
        c.lineWidth = 1.5;

        const sliceWidth = w / bufferLength;
        let sum = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * h) / 2;
          const x = i * sliceWidth;
          sum += Math.abs(v - 1);

          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }

        const avgAmp = sum / bufferLength;
        c.strokeStyle = getColor(Math.min(1, avgAmp * 2.5));
        c.stroke();
      } else {
        const noise = noiseRef.current;
        if (noise.length > 0) {
          c.beginPath();
          c.lineWidth = 1.5;
          c.strokeStyle = getColor(0);

          const centerY = h / 2;
          const sliceWidth = w / noise.length;

          for (let i = 0; i < noise.length; i++) {
            noise[i] += (Math.random() - 0.5) * 3;
            noise[i] *= 0.985;
            const limit = h * 0.25;
            if (noise[i] > limit) noise[i] = limit;
            if (noise[i] < -limit) noise[i] = -limit;

            const x = i * sliceWidth;
            const y = centerY + noise[i];
            if (i === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        }
      }

      frameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      running = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      ro.disconnect();
    };
  }, [audioElement]);

  if (!visible) return null;

  return (
    <div
      ref={winRef}
      id={id}
      className={`window ${focused ? 'focused' : ''}`}
      style={{ left: x, top: y, width, height: height || undefined, zIndex }}
      onMouseDown={handleMouseDown}
    >
      <div className="scope-titlebar" onMouseDown={handleTitleMouseDown}>
        <div className="titlebar-icon" />
        <span className="scope-title">◆ scope.exe</span>
        <div className="win-buttons">
          <div className="win-btn minimize" onClick={() => onMinimize(id)}>_</div>
          <div className="win-btn close" onClick={() => onClose(id)}>×</div>
        </div>
      </div>
      <div className="scope-content">
        <canvas ref={canvasRef} className="scope-canvas" />
        <div className="scope-scanlines" />
        {!audioActive && (
          <div className="scope-idle-overlay">
            <span>player needs to be running</span>
          </div>
        )}
      </div>
      <div className="scope-statusbar">
        <span className={audioActive ? 'scope-live' : 'scope-idle'}>
          {audioActive ? 'LIVE' : 'IDLE'}
        </span>
      </div>
      <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
    </div>
  );
}
