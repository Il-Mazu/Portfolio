import { useState, useEffect, useMemo } from 'react';
import { count as dumpCount } from 'virtual:dump-images';
import { gamesCount } from './GamesWindow';
import homeIcon from '../../assets/icons/home.png';
import aboutIcon from '../../assets/icons/about.png';
import blogIcon from '../../assets/icons/blog.png';
import musicIcon from '../../assets/icons/music.png';
import dumpIcon from '../../assets/icons/dump.png';
import terminalSvg from '../../assets/icons/terminal.svg';

const GamepadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="2 4 20 16" className="desk-icon-svg">
    <path d="M20 20H4v-2h16v2ZM4 18H2V6h2v12Zm18 0h-2V6h2v12Zm-12-7h2v2h-2v2H8v-2H6v-2h2V9h2v2Zm8 4h-2v-2h2v2Zm-2-4h-2V9h2v2Zm4-5H4V4h16v2Z"/>
  </svg>
);

const CmdIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="2 2 20 20" className="desk-icon-svg">
    <path d="M20 22H4v-2h16v2ZM4 20H2V4h2v16Zm18 0h-2V4h2v16ZM8 18H6v-2h2v2Zm8 0h-4v-2h4v2Zm-6-2H8v-2h2v2Zm-2-2H6v-2h2v2ZM20 4H4V2h16v2Z"/>
  </svg>
);

const APPS = [
  { id: 'win-home', icon: homeIcon, label: 'Home' },
  { id: 'win-about', icon: aboutIcon, label: 'About' },
  { id: 'win-blog', icon: blogIcon, label: 'Blog' },
  { id: 'win-music', icon: musicIcon, label: 'Music' },
  { id: 'win-dump', icon: dumpIcon, label: 'Gallery' },
  { id: 'win-term', svg: CmdIcon, label: 'Terminal' },
  { id: 'win-games', svg: GamepadIcon, label: 'Games' },
];

const STATUS_COLORS = { online: '#1D9E75', idle: '#BA7517', dnd: '#A32D2D', offline: '#888780' };

function avatarUrl(user) {
  if (!user?.id || !user?.avatar) return null;
  const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}`;
}

const WING_ART = `⠀⠀⠀⠀⢀⣴⢿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢀⡾⠁⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢠⢺⠃⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⠏⢸⡄⠈⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢸⡀⢸⡄⠀⠹⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢀⡜⡇⠈⣿⡀⠀⠙⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⠀⢳⠄⠹⣿⡄⠀⠈⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⣸⠆⢸⣧⡄⢸⣿⣶⠀⢠⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠷⡀⠹⣷⣄⣻⣿⡟⠺⣷⡀⠉⠓⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀
⢧⠀⣶⣄⡘⢿⣦⣽⣿⣄⠈⢱⡦⠀⠀⠉⠓⢤⡀⠀⠀⠀⠀⠀
⠘⣇⠈⠻⣷⡜⢻⣧⠉⠻⣄⠈⢻⣶⣴⠶⡄⠀⠙⡆⠀⠀⠀⠀
⠀⢻⠉⣄⠈⢿⣿⣿⣷⠀⠀⣶⣤⣀⣷⣀⠀⠀⠀⣸⠀⠀⠀⠀
⠀⠀⢧⡈⢿⣥⣍⣿⠉⠉⠃⢶⣦⣿⠀⠀⠀⠀⡚⠋⠀⠀⠀⠀
⠀⠀⠈⠳⣤⣈⠛⠻⢷⣦⣤⡄⣶⣾⣿⠃⠀⠀⠛⢦⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠉⠒⠒⣾⠋⠁⠀⣈⣽⣿⣷⡆⠀⠀⠀⠘⡄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠹⠦⢴⠋⠁⠀⠹⣿⣿⣿⠀⠀⠀⠙⣄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⢤⠴⠋⠀⡀⠛⠿⠟⡇⠠⠤⠤⠷
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠤⠴⣇⣠⣏⣰⠁⠀⠀⠀⠀`;

function formatRemote(url) {
  if (!url) return 'github.com';
  let clean = url.replace(/^git@/, '').replace(/^https?:\/\//, '');
  clean = clean.replace(/\.git$/, '').replace(':', '/');
  return clean;
}

export default function MobileHomeScreen({
  onOpen, lanyard, commits, remote, buildDate, blogCount, tracksCount,
}) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const timeStr = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = clock.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const statusColor = STATUS_COLORS[lanyard?.discord_status] || '#888780';
  const user = lanyard?.discord_user;
  const avatarSrc = avatarUrl(user);
  const repoUrl = useMemo(() => formatRemote(remote), [remote]);

  return (
    <div className="mobile-home">
      <div className="mobile-home-wallpaper">
        <img
          src="/assets/wallpaper.gif"
          alt=""
          draggable={false}
        />
      </div>

      <div className="mobile-home-content">
        <div className="mobile-status-bar">
          <span className="c-dim">mazu-space</span>
        </div>

        <div className="mobile-widget-clock">
          <div className="clock-time">{timeStr}</div>
          <div className="clock-date c-dim">{dateStr}</div>
        </div>

        <div className="mobile-discord-card">
          <div className="mobile-discord-inner">
            <div className="discord-wing-panel">
              <pre className="discord-wing">{WING_ART}</pre>
            </div>
            <div className="mobile-discord-center">
              <div className="discord-card-avatar">
                {avatarSrc ? (
                  <img className="discord-avatar" src={avatarSrc} alt="avatar" />
                ) : (
                  <div className="discord-avatar-placeholder" />
                )}
              </div>
              <div className="discord-card-info">
                <div className="discord-card-name">{user?.username || 'mazu'}</div>
                <div className="discord-card-status" style={{ color: statusColor }}>● {lanyard?.discord_status || 'offline'}</div>
              </div>
            </div>
            <div className="discord-wing-panel discord-wing-right">
              <pre className="discord-wing">{WING_ART}</pre>
            </div>
          </div>
        </div>

        <div className="mobile-stats-row">
          <span className="home-stat"><span className="c-red">♰</span> blog <span className="c-accent2">{blogCount}</span></span>
          <span className="home-stat"><span className="c-red">♰</span> music <span className="c-accent2">{tracksCount}</span></span>
          <span className="home-stat"><span className="c-red">♰</span> dump <span className="c-accent2">{dumpCount}</span></span>
          <span className="home-stat"><span className="c-red">♰</span> games <span className="c-accent2">{gamesCount}</span></span>
        </div>

        <div className="mobile-links-row">
          <a href={`https://${repoUrl}`} target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span><span>github</span>
          </a>
          <a href="https://www.instagram.com/ilmazu_" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span><span>instagram</span>
          </a>
          <a href="https://open.spotify.com/user/tudoxdeeiu9fvtotla7tl1scj" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="c-red">&gt;</span><span>spotify</span>
          </a>
        </div>

        <div className="mobile-home-grid">
          {APPS.map(app => (
            <div key={app.id} className="mobile-home-app" onClick={() => onOpen(app.id)}>
              <div className={'mobile-home-app-icon' + ((app.id === 'win-games' || app.id === 'win-term') ? ' mobile-home-app-icon--noinvert' : '')}>
                {app.svg ? <app.svg /> : <img src={app.icon} alt="" draggable={false} />}
              </div>
              <div className="mobile-home-app-label">{app.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
