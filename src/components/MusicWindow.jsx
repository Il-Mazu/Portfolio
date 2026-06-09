export default function MusicWindow({
  tracks, currentTrack, playing,
  onPrev, onNext, onTogglePlay, onSelectTrack, onNotif,
}) {
  const current = tracks[currentTrack];
  const next = tracks[(currentTrack + 1) % tracks.length];

  return (
    <div className="music-player">
      <div className="album-cover">
        <span className="album-label">{current.title}</span>
      </div>

      <div className="player-main">
        <div className="now-playing">
          <span className="c-red">▶ </span>
          <span className="c-accent">{current.title}</span>
        </div>
        <div className="time-display c-dim">00:00 / {current.time}</div>

        <div className="progress">
          <div className="progress-fill" style={{ width: `${current.progress}%` }} />
        </div>

        <div className="controls c-dim">
          <span style={{ cursor: 'pointer' }} onClick={onPrev}>|◄◄</span>
          <span style={{ cursor: 'pointer' }} onClick={onTogglePlay}>
            {playing ? '▶▶|' : '►'}
          </span>
          <span style={{ cursor: 'pointer' }} onClick={() => onNotif('// stop')}>■</span>
          <span style={{ cursor: 'pointer' }} onClick={() => onNotif('// shuffle on')}>⇄</span>
          <span style={{ cursor: 'pointer' }} onClick={() => onNotif('// repeat on')}>↻</span>
        </div>

        <div className="next-up">
          <span className="c-dim">next up: </span>
          <span
            className="c-red"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectTrack((currentTrack + 1) % tracks.length)}
          >
            {next.title}
          </span>
        </div>
      </div>
    </div>
  );
}
