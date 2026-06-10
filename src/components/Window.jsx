import { useEffect, useRef, useCallback } from 'react';

const RESIZE_MARGIN = 6;

export default function Window({
  id, title, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize,
  onMove, onResize,
  menubar, statusbar, style: extraStyle,
  children,
}) {
  const winRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

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

  // ── Drag (always-listen pattern) ──
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current) return;
      const { ox, oy } = dragRef.current;
      const nx = Math.max(0, Math.min(window.innerWidth - 180, e.clientX - ox));
      const ny = Math.max(0, Math.min(window.innerHeight - 40 - 100, e.clientY - oy));
      onMove(id, nx, ny);
    };
    const handleMouseUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [id, onMove]);

  // ── Resize handle ──
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
      const MIN_W = 200, MIN_H = 120;
      let newW = startW + dx;
      let newH = startH + dy;

      if (newW < MIN_W) newW = MIN_W;
      if (newH < MIN_H) newH = MIN_H;

      onResize(id, startL, startT, newW, newH);
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [id, onResize]);

  if (!visible) return null;

  return (
    <div
      ref={winRef}
      id={id}
      className={`window ${focused ? 'focused' : ''}`}
      style={{ left: x, top: y, width, height: height || undefined, zIndex, ...extraStyle }}
      onMouseDown={handleMouseDown}
    >
      <div className="titlebar" data-win={id} onMouseDown={handleTitleMouseDown}>
        <div className="titlebar-icon" />
        <span className="titlebar-title">{title}</span>
        <div className="win-buttons">
          <div className="win-btn minimize" onClick={() => onMinimize(id)}>_</div>
          <div className="win-btn close" onClick={() => onClose(id)}>×</div>
        </div>
      </div>
      {menubar && (
        <div className="win-menubar">
          {menubar.map((item, i) => (
            <span key={i} className="menu-item" onClick={item.onClick}>{item.label}</span>
          ))}
        </div>
      )}
      <div className="win-content">
        {children}
      </div>
      {statusbar && (
        <div className="statusbar">
          {statusbar.map((seg, i) => (
            <span key={i} className={seg.className || ''}>{seg.text}</span>
          ))}
        </div>
      )}
      <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
    </div>
  );
}
