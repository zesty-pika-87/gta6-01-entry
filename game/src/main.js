// Solara Bay — boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the three.js renderer paints what is there. The game moves
// between six screens: title, play, paused, missions (the job board), victory
// and wasted. Audio unlocks on the first key press.
//
// ?seed=N fixes the city layout. ?shot=start|play|garage|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_ENTER, ACTION_MUTE, ACTION_PAUSE, ACTION_SHOOT, createInput } from './input.js';
import { createRenderer } from './render.js';
import { createHud } from './hud.js';
import { drawMinimap } from './minimap.js';
import { createFeel } from './feel.js';
import { createAudio } from './audio.js';
import { createMusic } from './music.js';
import { loadSave, writeSave } from './save.js';
import { MISSIONS } from './config.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const minimapCanvas = document.getElementById('minimap');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas, world);
const hud = createHud(document);
const feel = createFeel();
const audio = createAudio();
const music = createMusic();

const panels = {
  title: document.getElementById('panel-title'),
  missions: document.getElementById('panel-missions'),
  victory: document.getElementById('panel-victory'),
  over: document.getElementById('panel-over'),
  paused: document.getElementById('panel-paused'),
};

function showPanel(name) {
  for (const key of Object.keys(panels)) {
    if (panels[key]) panels[key].classList.toggle('hidden', key !== name);
  }
  hud.setScreen(name || 'play');
}

function fillMissionBoard() {
  const list = document.getElementById('mission-list');
  if (!list) return;
  list.innerHTML = '';
  MISSIONS.forEach((m, i) => {
    const done = i < world.state.missionDone;
    const active = world.state.missionActive && world.state.missionIndex === i;
    const row = document.createElement('button');
    row.className = 'mission-row';
    row.innerHTML = `<span class="mission-num">${i + 1}</span><span class="mission-name">${m.name}${done ? ' ✓' : ''}${active ? ' — ACTIVE' : ''}</span><span class="mission-meta">${m.giver} · ${m.place} · $${m.reward}</span><span class="mission-brief">${m.brief}</span>`;
    row.addEventListener('click', () => startMission(i));
    list.appendChild(row);
  });
}

function fillVictory() {
  const s = world.state.stats;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('victory-money', `$${world.state.money.toLocaleString('en-US')}`);
  set('victory-stolen', String(s.stolen));
  set('victory-busted', String(s.busted));
  set('victory-crashes', String(s.crashes));
  set('victory-distance', `${(s.distance / 1000).toFixed(1)} km`);
  set('victory-time', `${Math.floor(world.state.elapsed / 60)}:${String(Math.floor(world.state.elapsed % 60)).padStart(2, '0')}`);
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best then lasts this visit only.
  }
}

function persistSave() {
  writeSave({ money: world.state.money, missionDone: world.state.missionDone, best: readBest() });
}

let screen = 'title';
let best = readBest();
const saved = loadSave();
if (saved && typeof saved.money === 'number') {
  world.state.money = saved.money;
  world.state.missionDone = Math.min(8, saved.missionDone || 0);
}

function startMission(i) {
  world.startMission(i);
  hud.showBanner(world.state.missionMsg, 5);
  audio.mission();
  screen = 'play';
  showPanel(null);
  announce(`Mission ${i + 1}: ${MISSIONS[i].name}. ${MISSIONS[i].brief}`);
}

function startGame() {
  world.reset();
  screen = 'play';
  showPanel(null);
  announce('Playing. Steal a car with E, open jobs with M.');
}

function endGame(wasted) {
  screen = 'over';
  showPanel('over');
  const overTitle = document.getElementById('over-title');
  if (overTitle) overTitle.textContent = wasted ? 'WASTED' : 'BUSTED';
  if (world.state.money > best) {
    best = world.state.money;
    saveBest(best);
  }
  persistSave();
  announce(`Game over. $${world.state.money}. Best $${best}.`);
}

function announce(message) {
  if (status) status.textContent = message;
}

function runShot(name) {
  const staged = stageShot(name, world);
  screen = staged.screen;
  renderer.snapCamera(world.state);
  if (screen === 'title') showPanel('title');
  else if (screen === 'garage') { fillMissionBoard(); showPanel('missions'); }
  else if (screen === 'victory') { fillVictory(); showPanel('victory'); }
  else showPanel(null);
  hud.update(world.state, 0, screen);
  drawMinimap(minimapCanvas, world.state);
  if (screen === 'play') hud.showBanner('WANTED ★★★ — Lose the heat!', 30);
  let painted = 0;
  let t = 0;
  function paint() {
    renderer.draw(world.state, t, { x: 0, y: 0 });
    t += 1 / 30;
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let accumulator = 0;
  let last = performance.now();
  let t = 0;
  let audioUnlocked = false;
  let boardOpen = false;
  let shootQueued = false;

  function openBoard() {
    boardOpen = true;
    screen = 'missions';
    fillMissionBoard();
    showPanel('missions');
    announce('Mission board. Pick a job.');
  }
  function closeBoard() {
    boardOpen = false;
    screen = 'play';
    showPanel(null);
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM' && !event.repeat) {
      if (screen === 'play') openBoard();
      else if (screen === 'missions') closeBoard();
    }
    if (/^Digit[1-8]$/.test(event.code) && screen === 'missions' && !event.repeat) {
      startMission(Number(event.code.slice(5)) - 1);
    }
    if (!audioUnlocked) {
      audioUnlocked = true;
      audio.unlock();
      music.attach(audio.context());
    }
  });

  function handleEvents(events) {
    if (events.pickup) { audio.pickup(); renderer.particles.spawn(world.state.player.x, 1.5, world.state.player.z, 0xff8c42, 14, 5, 5); }
    if (events.cash) audio.cash();
    if (events.mission) {
      audio.mission();
      hud.showBanner(world.state.missionMsg, 5);
      persistSave();
      if (events.victory) {
        screen = 'victory';
        fillVictory();
        showPanel('victory');
        announce('All eight missions done. Solara Bay is yours!');
      }
    }
    if (events.wanted) hud.showBanner(world.state.wanted > 0 ? `WANTED ${'★'.repeat(world.state.wanted)}` : 'Heat gone. You are clean.', 3);
    if (events.busted) {
      audio.busted();
      hud.showBanner(world.state.missionMsg, 5);
      feel.addFlash();
    }
    if (events.hit) {
      audio.crash();
      feel.addShake(0.5);
      feel.addFlash();
    }
    if (world.state.player.health <= 0) endGame(true);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) audio.setMuted(!audio.isMuted());
    if (actions & ACTION_SHOOT) {
      if (screen === 'play') {
        shootQueued = true;
        audio.shot();
        const p = world.state.player;
        const from = { x: p.x, y: 1.5, z: p.z };
        const to = { x: p.x + Math.sin(p.heading) * 24, y: 1.5, z: p.z + Math.cos(p.heading) * 24 };
        renderer.combat.fire(from, to);
        renderer.particles.spawn(to.x, 1.5, to.z, 0xffe066, 6, 3, 3);
      }
    }
    if (actions & ACTION_ENTER && screen === 'play') {
      const result = world.enterCar();
      if (result === 'entered') {
        audio.cash();
        hud.showBanner(world.state.missionMsg, 3);
      } else if (result === 'stepped-out') hud.showBanner('On foot.', 2);
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === 'title' || screen === 'over' || screen === 'victory') startGame();
      else if (screen === 'paused') { screen = 'play'; showPanel(null); }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === 'play') { screen = 'paused'; showPanel('paused'); announce('Paused.'); }
      else if (screen === 'paused') { screen = 'play'; showPanel(null); announce('Playing.'); }
    }
  }

  function step() {
    if (screen === 'title') {
      world.step(STEP, { x: 0, y: 0 }, 0, false);
      return;
    }
    if (screen !== 'play') return;
    const events = world.step(STEP, input.move(), 0, shootQueued);
    shootQueued = false;
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    t += dt;
    handleActions();
    if (screen === 'title' || screen === 'play') {
      accumulator += dt;
      while (accumulator >= STEP && (screen === 'title' || screen === 'play')) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    feel.update(dt);
    hud.update(world.state, dt, screen);
    hud.setFlash(feel.flashLevel());
    audio.engine(world.state.speed, world.state.player.inCar);
    audio.siren(world.state.wanted, t);
    drawMinimap(minimapCanvas, world.state);
    renderer.draw(world.state, t, feel.offset());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'play') {
      screen = 'paused';
      showPanel('paused');
      announce('Paused.');
    }
  });

  showPanel('title');
  announce('Solara Bay. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
