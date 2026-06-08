export function fadeOut(audio, duration = 600) {
  return new Promise(resolve => {
    if (!audio || audio.paused) { resolve(); return; }
    const startVol = audio.volume;
    const step = 30;
    const totalSteps = Math.ceil(duration / step);
    const decrement = startVol / totalSteps;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      audio.volume = Math.max(0, startVol - decrement * i);
      if (i >= totalSteps) {
        clearInterval(timer);
        audio.pause();
        audio.currentTime = 0;
        resolve();
      }
    }, step);
  });
}

export function fadeIn(audio, targetVol, duration = 600) {
  return new Promise(resolve => {
    if (!audio) { resolve(); return; }
    audio.volume = 0;
    audio.play().catch(() => {});
    const step = 30;
    const totalSteps = Math.ceil(duration / step);
    const increment = targetVol / totalSteps;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      audio.volume = Math.min(targetVol, increment * i);
      if (i >= totalSteps) {
        clearInterval(timer);
        audio.volume = targetVol;
        resolve();
      }
    }, step);
  });
}
