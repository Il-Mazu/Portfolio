import { useEffect, useState } from 'react';

const TITLES = {
  'win-home': 'home.txt — MAZU-SPACE',
  'win-about': 'about.txt — mazu-space',
  'win-blog': 'blog.txt — THOUGHTS',
  'win-music': 'player.exe — MEDIA',
  'win-dump': 'dump/',
  'win-term': 'cmd.exe',
  'win-scope': 'oscilloscope.exe',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];

export default function Taskbar({
  windows, focusedId, onOpenWindow, onMinimizeWindow, onToggleStartMenu,
  settings, onToggleCrt, onToggleNoise, onToggleAmbient, onToggleGlitch, onToggleLightMode,
  onToggleDesktop, allMinimized
}) {
  const [time, setTime] = useState('--:--');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

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

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = () => setSettingsOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [settingsOpen]);

  useEffect(() => {
    if (!calendarOpen) return;
    const handler = () => setCalendarOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [calendarOpen]);

  const openEntries = Object.keys(windows).filter(id => windows[id].open);

  const handleTaskClick = (id) => {
    if (windows[id].visible) {
      onMinimizeWindow(id);
    } else {
      onOpenWindow(id);
    }
  };

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setCalendarOpen(false);
    setSettingsOpen(prev => !prev);
  };

  const handleClockClick = (e) => {
    e.stopPropagation();
    setSettingsOpen(false);
    setCalendarOpen(prev => !prev);
  };

  const toggleItem = (e, fn) => {
    e.stopPropagation();
    fn();
  };

  const today = new Date();
  const year = calDate.getFullYear();
  const month = calDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Convert Sunday=0 to Monday=0
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const dates = [];
  for (let i = 0; i < startOffset; i++) dates.push(null);
  for (let d = 1; d <= daysInMonth; d++) dates.push(d);

  const prevMonth = (e) => {
    e.stopPropagation();
    setCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
            className={`task-btn ${focusedId === id ? 'active' : ''} ${windows[id].visible ? '' : 'hidden'}`}
            onClick={() => handleTaskClick(id)}
          >
            <div className="task-dot" />
            <span className="task-title">{TITLES[id] || id}</span>
          </div>
        ))}
      </div>
      <div id="sys-tray">
        <div id="settings-area">
          <span id="settings-btn" title="settings" onClick={handleSettingsClick}>[≡]</span>
          {settingsOpen && (
            <div id="settings-menu" className="open" onClick={e => e.stopPropagation()}>
              <div className="smenu-header">settings</div>
              <div className="smenu-item" onClick={e => toggleItem(e, onToggleCrt)}>
                <span className="toggle-dot">{settings.crt ? '◉' : '○'}</span>
                CRT overlay
              </div>
              <div className="smenu-item" onClick={e => toggleItem(e, onToggleNoise)}>
                <span className="toggle-dot">{settings.noise ? '◉' : '○'}</span>
                Noise overlay
              </div>
              <div className="smenu-item" onClick={e => toggleItem(e, onToggleAmbient)}>
                <span className="toggle-dot">{settings.ambient ? '◉' : '○'}</span>
                Ambient audio
              </div>
              <div className="smenu-item" onClick={e => toggleItem(e, onToggleGlitch)}>
                <span className="toggle-dot">{settings.glitch ? '◉' : '○'}</span>
                Glitch effects
              </div>
              <div className="smenu-sep" />
              <div className="smenu-item" onClick={e => toggleItem(e, onToggleLightMode)}>
                <span className="toggle-dot">{settings.lightMode ? '◉' : '○'}</span>
                Light mode
              </div>
            </div>
          )}
        </div>
        <span id="desk-btn" title={allMinimized ? 'restore windows' : 'show desktop'} onClick={onToggleDesktop}>[~]</span>
        <div id="clock-area">
          <span id="clock" onClick={handleClockClick}>{time}</span>
          {calendarOpen && (
            <div id="calendar-menu" onClick={e => e.stopPropagation()}>
              <div className="cal-header">
                <span className="cal-nav" onClick={prevMonth}>‹</span>
                <span className="cal-title">{MONTHS[month]} {year}</span>
                <span className="cal-nav" onClick={nextMonth}>›</span>
              </div>
              <div className="cal-days">
                {DAYS.map(d => <div key={d} className="cal-weekday">{d}</div>)}
              </div>
              <div className="cal-grid">
                {dates.map((d, i) => (
                  <div
                    key={i}
                    className={'cal-cell' + (d === null ? ' cal-empty' : '') + (d === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? ' cal-today' : '')}
                  >
                    {d || ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
