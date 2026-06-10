import { useState, useEffect } from 'react';
import Window from './Window';

const imageModules = import.meta.glob('/assets/Dump/*.jpeg', { eager: true, query: '?url' });
const imageList = Object.values(imageModules).map(m => m.default || m);

export default function DumpWindow({
  id, x, y, width, height,
  visible, focused, zIndex,
  onFocus, onClose, onMinimize, onMove, onResize,
}) {
  const [currentIndex, setCurrentIndex] = useState(null);

  useEffect(() => {
    if (imageList.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * imageList.length));
    }
  }, []);

  if (currentIndex === null) return null;

  const prev = () => {
    setCurrentIndex(p => (p - 1 + imageList.length) % imageList.length);
  };

  const next = () => {
    setCurrentIndex(p => (p + 1) % imageList.length);
  };

  return (
    <Window
      id={id} title="dump/ — BIN"
      x={x} y={y} width={width} height={height}
      visible={visible} focused={focused} zIndex={zIndex}
      onFocus={onFocus} onClose={onClose} onMinimize={onMinimize}
      onMove={onMove} onResize={onResize}
    >
      <div className="dump-content">
        <img
          src={imageList[currentIndex]}
          alt={`dump ${currentIndex + 1}`}
          className="gallery-img"
          draggable={false}
        />
      </div>
      <div className="gallery-nav">
        <span className="gallery-btn" onClick={prev}>◀</span>
        <span className="gallery-counter">{currentIndex + 1}/{imageList.length}</span>
        <span className="gallery-btn" onClick={next}>▶</span>
      </div>
    </Window>
  );
}
