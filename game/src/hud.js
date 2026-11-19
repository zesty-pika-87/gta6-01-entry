// HUD: one job — keep the DOM overlay honest. Money, wanted stars, health,
// speed, the one-line mission objective, the combo badge and the centre
// message banner. Text is only rewritten when it changes, so a frame
// allocates nothing.
export function createHud(doc) {
  const el = {
    money: doc.getElementById('hud-money'),
    rank: doc.getElementById('hud-rank'),
    stars: doc.getElementById('hud-stars'),
    health: doc.getElementById('hud-health-fill'),
    speed: doc.getElementById('hud-speed'),
    objective: doc.getElementById('hud-objective'),
    combo: doc.getElementById('hud-combo'),
    banner: doc.getElementById('hud-banner'),
    hint: doc.getElementById('hud-hint'),
    flash: doc.getElementById('hud-flash'),
  };
  const last = { money: '', rank: '', stars: '', objective: '', combo: '', banner: '', speed: '', hint: '' };
  let bannerTimer = 0;

  function set(key, node, value) {
    if (last[key] !== value) {
      last[key] = value;
      if (node) node.textContent = value;
    }
  }

  function showBanner(text, seconds) {
    set('banner', el.banner, text);
    if (el.banner) el.banner.style.opacity = '1';
    bannerTimer = seconds;
  }

  return {
    showBanner,
    update(state, dt, screen) {
      set('money', el.money, `$${state.money.toLocaleString('en-US')}`);
      set('rank', el.rank, `RIO SANTANA · ${state.missionDone}/8 MISSIONS`);
      const stars = '★'.repeat(state.wanted) + '☆'.repeat(5 - state.wanted);
      set('stars', el.stars, stars);
      if (el.stars) el.stars.style.color = state.wanted > 0 ? '#ff4757' : '#ffffff55';
      if (el.health) el.health.style.width = `${Math.max(0, state.player.health)}%`;
      set('speed', el.speed, state.player.inCar ? `${Math.round(state.speed)} km/h` : 'ON FOOT');
      set('objective', el.objective, state.missionObjective);
      set('combo', el.combo, state.combo >= 2 ? `CHAIN x${state.combo}` : '');
      if (el.combo) el.combo.style.opacity = state.combo >= 2 ? '1' : '0';
      const hint = state.player.inCar
        ? 'WASD drive · E step out · F shoot · Shift brake · P pause'
        : 'WASD walk · E steal car · F shoot · M missions · P pause';
      set('hint', el.hint, hint);
      if (bannerTimer > 0) {
        bannerTimer -= dt;
        if (bannerTimer <= 0 && el.banner) el.banner.style.opacity = '0';
      }
      if (el.flash) el.flash.style.opacity = String(0.35);
    },
    setFlash(level) {
      if (el.flash) el.flash.style.opacity = String(level * 0.5);
    },
    setScreen(screen) {
      // The HUD stays visible on every screen; panels are separate DOM.
      if (el.banner && screen === 'title') el.banner.style.opacity = '0';
    },
  };
}
