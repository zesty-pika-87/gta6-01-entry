// Sound effects: one job — every procedural WebAudio effect in the game.
// Engine hum follows the speed, the siren wails two tones, pickups blip,
// crashes thud, shots crack. No audio files, no network, and nothing starts
// until the player first presses a key (browsers demand a gesture).
export function createAudio() {
  let ctx = null;
  let master = null;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 60;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain);
      engineGain.connect(master);
      engineOsc.start();
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'sine';
      sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(master);
      sirenOsc.start();
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, dur, type, vol) {
    if (!ctx || muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  return {
    unlock() { ensure(); },
    /** The shared AudioContext, for the music module to attach to. */
    context() { return ctx; },
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.35;
    },
    isMuted() { return muted; },
    /** Engine hum follows speed in km/h (0..~170). */
    engine(speedKmh, inCar) {
      if (!ctx || muted) return;
      const target = inCar ? 0.05 + Math.min(0.16, speedKmh / 900) : 0;
      engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
      engineOsc.frequency.setTargetAtTime(55 + speedKmh * 1.1, ctx.currentTime, 0.1);
    },
    /** Two-tone siren while wanted > 0; the tone alternates with time. */
    siren(wanted, t) {
      if (!ctx || muted) return;
      if (wanted > 0) {
        sirenGain.gain.setTargetAtTime(0.05, ctx.currentTime, 0.2);
        sirenOsc.frequency.setTargetAtTime(Math.floor(t * 2) % 2 === 0 ? 700 : 950, ctx.currentTime, 0.05);
      } else {
        sirenGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      }
    },
    pickup() { blip(880, 0.12, 'sine', 0.25); blip(1320, 0.18, 'sine', 0.2); },
    cash() { blip(660, 0.08, 'square', 0.15); blip(990, 0.12, 'square', 0.15); },
    crash() { blip(70, 0.25, 'sawtooth', 0.4); },
    shot() { blip(180, 0.09, 'sawtooth', 0.3); },
    mission() { blip(523, 0.15, 'sine', 0.25); blip(659, 0.15, 'sine', 0.25); blip(784, 0.3, 'sine', 0.25); },
    busted() { blip(220, 0.4, 'sawtooth', 0.3); blip(165, 0.5, 'sawtooth', 0.3); },
  };
}
