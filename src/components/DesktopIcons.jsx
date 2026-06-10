import homeIcon from '../../assets/icons/home.png';
import aboutIcon from '../../assets/icons/about.png';
import blogIcon from '../../assets/icons/blog.png';
import musicIcon from '../../assets/icons/music.png';
import dumpIcon from '../../assets/icons/dump.png';
import termIcon from '../../assets/icons/terminal.png';
import scopeIcon from '../../assets/icons/scope.png';

const icons = [
  { id: 'win-home', img: homeIcon, label: 'home.txt' },
  { id: 'win-about', img: aboutIcon, label: 'about.txt' },
  { id: 'win-blog', img: blogIcon, label: 'blog.txt' },
  { id: 'win-music', img: musicIcon, label: 'player.exe' },
  { id: 'win-dump', img: dumpIcon, label: 'dump/' },
  { id: 'win-term', img: termIcon, label: 'cmd.exe' },
  { id: 'win-scope', img: scopeIcon, label: 'scope.exe' },
];

export default function DesktopIcons({ onOpen }) {
  return (
    <div id="desktop-icons">
      {icons.map(icon => (
        <div key={icon.id} className="desk-icon" onClick={() => onOpen(icon.id)}>
          <div className="desk-icon-img">
            {icon.img
              ? <img src={icon.img} alt="" className={'desk-icon-png' + (icon.id === 'win-home' ? ' home-icon' : '')} />
              : '[SYS]'
            }
          </div>
          <div className="desk-icon-label">{icon.label}</div>
        </div>
      ))}
    </div>
  );
}
