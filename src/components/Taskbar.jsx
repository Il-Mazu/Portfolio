import { useEffect, useState } from 'react';

const LABELS = {
  'win-about': 'about.txt',
  'win-blog': 'blog.txt',
  'win-music': 'player.exe',
  'win-dump': 'dump/',
  'win-links': 'links.ini',
  'win-term': 'cmd.exe',
};

export default function Taskbar({ windows, focusedId, onOpenWindow, onMinimizeWindow, onToggleStartMenu }) {
  const [time, setTime] = useState('--:--');

  useEffect(() => {
    function update() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTime(h + ':' + m);
    }
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  const openEntries = Object.keys(windows).filter(id => windows[id].open);

  const handleTaskClick = (id) => {
    if (windows[id].visible) {
      onMinimizeWindow(id);
    } else {
      onOpenWindow(id);
    }
  };

  return (
    <div id="taskbar">
      <div id="start-btn" onClick={onToggleStartMenu}>
        <div className="start-gem" />
        START
      </div>
      <div id="taskbar-tasks">
        {openEntries.map(id => (
          <div
            key={id}
            id={'task-' + id}
            className={`task-btn ${focusedId === id ? 'active' : ''}`}
            onClick={() => handleTaskClick(id)}
          >
            <div className="task-dot" />
            {LABELS[id]}
          </div>
        ))}
      </div>
      <div id="sys-tray">
        <span title="network">[~]</span>
        <span title="sound">[♪]</span>
        <span id="clock">{time}</span>
      </div>
    </div>
  );
}
