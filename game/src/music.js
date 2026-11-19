// Music: one job — a sunny generative loop for Solara Bay. A soft chord pad
// (C – Am – F – G) with a plucked arpeggio on top, scheduled a bar ahead so
// it never stutters. Shares the audio context's master gain via its own gain.
export function createMusic() {
  let ctx = null;
  let gain = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;
  const CHORDS = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]];
  const STEP_DUR = 0.22;

  function note(freq, when, dur, vol, type) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(gain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  function schedule() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.6) {
      const bar = Math.floor(step / 8) % 4;
      const chord = CHORDS[bar];
      const inBar = step % 8;
      if (inBar === 0) {
        for (const f of chord) note(f, nextTime, STEP_DUR * 8, 0.05, 'sine');
      }
      const arp = chord[(step * 2 + 1) % 3] * (inBar % 2 === 0 ? 2 : 1);
      note(arp, nextTime, STEP_DUR * 1.6, 0.07, 'triangle');
      nextTime += STEP_DUR;
      step += 1;
    }
  }

  return {
    /** Attach to an existing AudioContext (created by the audio module). */
    attach(audioContext) {
      if (ctx || !audioContext) return;
      ctx = audioContext;
      gain = ctx.createGain();
      gain.gain.value = 0.5;
      gain.connect(ctx.destination);
      nextTime = ctx.currentTime + 0.1;
      step = 0;
      timer = window.setInterval(schedule, 120);
    },
    stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    },
  };
}
