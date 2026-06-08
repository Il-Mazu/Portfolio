import { useState, useEffect, useRef, useCallback } from 'react';

const imageModules = import.meta.glob('/assets/Dump/*.jpeg', { eager: true, query: '?url' });
const imageList = Object.values(imageModules).map(m => m.default || m);

export default function DumpWindow({
  id, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMove, onResize,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const winRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    if (imageList.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * imageList.length));
    }
  }, []);

  const prev = () => {
    setCurrentIndex(p => (p - 1 + imageList.length) % imageList.length);
  };

  const next = () => {
    setCurrentIndex(p => (p + 1) % imageList.length);
  };

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
      const ny = Math.max(0, Math.min(window.innerHeight - 32 - 100, e.clientY - oy));
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
      const MIN_W = 200, MIN_H = 150;
      let newW = startW + dx;
      let newH = startH + dy;
      if (newW < MIN_W) newW = MIN_W;
      if (newH < MIN_H) newH = MIN_H;
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

  if (!visible || currentIndex === null) return null;

  return (
    <div
      ref={winRef}
      id={id}
      className={`window ${focused ? 'focused' : ''}`}
      style={{ left: x, top: y, width, height: height || undefined, zIndex }}
      onMouseDown={handleMouseDown}
    >
      <div className="titlebar" onMouseDown={handleTitleMouseDown}>
        <div className="titlebar-icon" />
        <span className="titlebar-title">dump/ — BIN</span>
        <div className="win-buttons">
          <div className="win-btn close" onClick={() => onClose(id)}>×</div>
        </div>
      </div>
      <div className="dump-content">
        <img
          src={imageList[currentIndex]}
          alt={`dump ${currentIndex + 1}`}
          className="gallery-img"
        />
      </div>
      <div className="gallery-nav">
        <span className="gallery-btn" onClick={prev}>◀</span>
        <span className="gallery-counter">{currentIndex + 1}/{imageList.length}</span>
        <span className="gallery-btn" onClick={next}>▶</span>
      </div>
      <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
    </div>
  );
}
