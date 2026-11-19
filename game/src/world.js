// Solara Bay's rules and state, with no drawing and no browser in it: the
// player on foot or behind the wheel, traffic on the street grid, pedestrians
// on the sidewalks, police that chase the heat, pickups, and the eight named
// story missions. step() advances one fixed step and returns what happened
// as bit flags, so the caller can react without the world knowing about
// screens or sound. Nothing here allocates after createWorld returns.
import { CAR, CITY, MISSIONS, PALETTE, PLAYER, WANTED_MAX } from './config.js';
import { GARAGE, missionPlan } from './missions.js';

export const EVENT_PICKUP = 1;
export const EVENT_MISSION = 2;
export const EVENT_WANTED = 4;
export const EVENT_BUSTED = 8;
export const EVENT_VICTORY = 16;
export const EVENT_HIT = 32;
export const EVENT_CASH = 64;

const TRAFFIC_COUNT = 14;
const PARKED_COUNT = 8;
const PED_COUNT = 26;
const POLICE_MAX = 6;
const PICKUP_COUNT = 10;

const STREET_LINES = [];
for (let v = -CITY.half; v <= CITY.half; v += CITY.street) STREET_LINES.push(v);

function dist(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}

export function createWorld(random) {
  // ---- city: building blocks between the streets (AABB list, also drawn) ----
  const buildings = [];
  for (let gx = -CITY.half; gx < CITY.half; gx += CITY.street) {
    for (let gz = -CITY.half; gz < CITY.half; gz += CITY.street) {
      if (random() < 0.12) continue; // plaza / parking lot gap
      const w = CITY.block * (0.55 + random() * 0.45);
      const d = CITY.block * (0.55 + random() * 0.45);
      const h = 8 + random() * random() * 42;
      buildings.push({
        x: gx + CITY.street / 2, z: gz + CITY.street / 2, w, d, h,
        color: PALETTE.building[Math.floor(random() * PALETTE.building.length)],
        roof: random() < 0.3,
      });
    }
  }
  // Beach palms (positions only; the renderer draws them).
  const palms = [];
  for (let i = 0; i < 40; i += 1) palms.push({ x: -170 + random() * 340, z: 168 + random() * 22 });

  const player = { x: 0, z: 20, heading: 0, health: PLAYER.health, inCar: false, carId: -1, bustTimer: 0, invulnerable: 0 };
  const cars = [];
  for (let i = 0; i < TRAFFIC_COUNT + PARKED_COUNT + POLICE_MAX + 2; i += 1) {
    cars.push({ active: false, kind: 'traffic', x: 0, z: 0, heading: 0, speed: 0, color: 0xcccccc, name: '', axis: 'x', line: 0, dir: 1, lane: 3, stuck: 0, smoke: 0 });
  }
  const peds = [];
  for (let i = 0; i < PED_COUNT; i += 1) peds.push({ x: 0, z: 0, tx: 0, tz: 0, speed: 1.2 + random() * 1.4, panic: 0, color: 0xffffff, shirt: 0 });
  const pickups = [];
  for (let i = 0; i < PICKUP_COUNT; i += 1) pickups.push({ active: false, kind: 'cash', x: 0, z: 0, value: 25 });
  const heli = { active: false, x: 0, z: 0, angle: 0, y: 55 };

  const state = {
    player, cars, peds, pickups, heli, buildings, palms,
    money: 120, wanted: 0, heatTimer: 0, calmTimer: 0,
    missionIndex: 0, missionStep: 0, missionTimer: 0, missionActive: false,
    missionDone: 0, missionMsg: '', missionObjective: 'Press M to open the mission board',
    elapsed: 0, dayT: 0.32, stats: { stolen: 0, busted: 0, crashes: 0, distance: 0 },
    combo: 0, comboTimer: 0, speed: 0, racePoints: [], collectLeft: 0, missionTarget: null,
  };

  function roadPoint() {
    const line = STREET_LINES[Math.floor(random() * STREET_LINES.length)];
    const along = -CITY.half + random() * CITY.half * 2;
    return Math.random() < 0.5 ? { x: along, z: line } : { x: line, z: along };
  }

  function collideCircle(x, z, r) {
    // Push a circle out of building AABBs and the city edge; returns corrected {x, z}.
    for (let i = 0; i < buildings.length; i += 1) {
      const b = buildings[i];
      const cx = Math.max(b.x - b.w / 2, Math.min(x, b.x + b.w / 2));
      const cz = Math.max(b.z - b.d / 2, Math.min(z, b.z + b.d / 2));
      const dx = x - cx, dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 0.0001) {
          const d = Math.sqrt(d2);
          x = cx + (dx / d) * r;
          z = cz + (dz / d) * r;
        } else {
          x = b.x + b.w / 2 + r;
        }
      }
    }
    x = Math.max(-CITY.half - 6, Math.min(CITY.half + 6, x));
    z = Math.max(-CITY.half - 6, Math.min(CITY.half + 42, z));
    return { x, z };
  }

  function freeCar() {
    for (let i = 0; i < cars.length; i += 1) if (!cars[i].active) return cars[i];
    return null;
  }

  function spawnTrafficCar() {
    const c = freeCar();
    if (!c) return;
    const axis = random() < 0.5 ? 'x' : 'z';
    const line = STREET_LINES[Math.floor(random() * STREET_LINES.length)];
    const along = -CITY.half + random() * CITY.half * 2;
    c.active = true; c.kind = 'traffic';
    c.axis = axis; c.line = line; c.dir = random() < 0.5 ? 1 : -1; c.lane = 3;
    c.x = axis === 'x' ? along : line + (c.dir > 0 ? c.lane : -c.lane);
    c.z = axis === 'x' ? line + (c.dir > 0 ? c.lane : -c.lane) : along;
    c.heading = axis === 'x' ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    c.speed = 9 + random() * 6;
    c.color = [0xd8d8d8, 0x4361ee, 0xe63946, 0x2ec4b6, 0xf77f00, 0x80b918, 0x6c757d][Math.floor(random() * 7)];
    c.name = ['Sunrunner', 'Bay Cruiser', 'Palm Runner', 'Dune Hawk', 'Coral Coupe'][Math.floor(random() * 5)];
    c.smoke = 0;
  }

  function spawnParkedCar() {
    const c = freeCar();
    if (!c) return;
    const p = roadPoint();
    c.active = true; c.kind = 'parked';
    c.x = p.x; c.z = p.z;
    c.heading = random() * Math.PI * 2;
    c.speed = 0;
    c.color = [0xffc93c, 0x2ec4b6, 0xe63946, 0x4361ee, 0xf77f00, 0x80b918][Math.floor(random() * 6)];
    c.name = ['Sunrunner', 'Bay Cruiser', 'Palm Runner', 'Dune Hawk', 'Coral Coupe'][Math.floor(random() * 5)];
    c.smoke = 0;
  }

  function spawnPed(i) {
    const p = peds[i];
    const q = roadPoint();
    p.x = q.x + (random() - 0.5) * 8;
    p.z = q.z + (random() - 0.5) * 8;
    const t = roadPoint();
    p.tx = t.x; p.tz = t.z; p.panic = 0;
    p.shirt = [0xe63946, 0x4361ee, 0xf77f00, 0x80b918, 0xffc93c, 0x9d4edd][Math.floor(random() * 6)];
  }

  function spawnCashPickup(x, z, value) {
    for (let i = 0; i < pickups.length; i += 1) {
      if (!pickups[i].active) {
        pickups[i].active = true; pickups[i].kind = 'cash';
        pickups[i].x = x; pickups[i].z = z; pickups[i].value = value;
        return;
      }
    }
  }

  function spawnMissionCar(x, z, name, color) {
    const c = freeCar();
    if (!c) return null;
    c.active = true; c.kind = 'mission';
    c.x = x; c.z = z; c.heading = 0; c.speed = 0;
    c.name = name; c.color = color; c.smoke = 0;
    return c;
  }

  function setWanted(level) {
    state.wanted = Math.max(0, Math.min(WANTED_MAX, level));
    state.calmTimer = 0;
  }

  function startMission(index) {
    const plan = missionPlan(MISSIONS[index].id);
    state.missionIndex = index;
    state.missionStep = 0;
    state.missionTimer = 0;
    state.missionActive = true;
    state.missionMsg = plan.intro;
    state.racePoints = [];
    state.collectLeft = 0;
    applyStep(plan.steps[0]);
    return plan;
  }

  function applyStep(step) {
    if (!step) return;
    state.missionObjective = step.label;
    state.missionTarget = step.kind === 'race' ? { x: step.points[0].x, z: step.points[0].z }
      : step.kind === 'escape' ? null : { x: step.x, z: step.z };
    if (step.kind === 'collect') {
      state.collectLeft = step.count;
      for (let i = 0; i < step.count; i += 1) {
        const a = random() * Math.PI * 2;
        const r = 4 + random() * step.radius;
        spawnCashPickup(step.x + Math.cos(a) * r, step.z + Math.sin(a) * r, 150);
        pickups.forEach((p) => { if (p.active && p.kind === 'cash' && p.value === 150) p.kind = 'crate'; });
      }
    } else if (step.kind === 'escape') {
      setWanted(step.wanted);
      state.missionTimer = step.seconds;
    } else if (step.kind === 'steal') {
      spawnMissionCar(step.x, step.z, step.carName, step.carColor);
    } else if (step.kind === 'race') {
      state.racePoints = step.points.map((p) => ({ ...p, done: false }));
      state.missionTimer = step.time;
    }
  }

  function currentStep() {
    const plan = missionPlan(MISSIONS[state.missionIndex].id);
    return plan.steps[state.missionStep] || null;
  }

  function advanceStep(events) {
    const plan = missionPlan(MISSIONS[state.missionIndex].id);
    state.missionStep += 1;
    if (state.missionStep >= plan.steps.length) {
      state.missionActive = false;
      state.missionTarget = null;
      state.missionDone += 1;
      state.money += MISSIONS[state.missionIndex].reward;
      state.missionMsg = `${plan.outro}  +$${MISSIONS[state.missionIndex].reward}`;
      state.missionObjective = state.missionDone >= MISSIONS.length ? 'All missions done — Solara Bay is yours!' : 'Mission complete! Open the board (M) for the next job.';
      if (state.missionDone >= MISSIONS.length) events.victory = true;
      return true;
    }
    applyStep(plan.steps[state.missionStep]);
    return false;
  }

  function nearestCar(maxD) {
    let best = null; let bestD = maxD;
    for (let i = 0; i < cars.length; i += 1) {
      const c = cars[i];
      if (!c.active || (player.inCar && cars.indexOf(c) === player.carId)) continue;
      const d = dist(player.x, player.z, c.x, c.z);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  function enterCar() {
    if (player.inCar) {
      // Step out beside the car.
      const c = cars[player.carId];
      player.inCar = false; player.carId = -1;
      player.x = c.x + Math.cos(c.heading + Math.PI / 2) * 3;
      player.z = c.z + Math.sin(c.heading + Math.PI / 2) * 3;
      const fixed = collideCircle(player.x, player.z, PLAYER.radius);
      player.x = fixed.x; player.z = fixed.z;
      player.heading = c.heading;
      return 'stepped-out';
    }
    const c = nearestCar(5);
    if (!c) return null;
    player.inCar = true;
    player.carId = cars.indexOf(c);
    state.stats.stolen += 1;
    if (c.kind === 'traffic' || c.kind === 'parked') {
      setWanted(state.wanted + 1);
      state.missionMsg = `Stole the ${c.name}! The law noticed.`;
    } else if (c.kind === 'mission') {
      state.missionMsg = `Got the ${c.name}. Now deliver it.`;
    }
    c.kind = 'player';
    return 'entered';
  }

  function reset() {
    player.x = 0; player.z = 20; player.heading = 0;
    player.health = PLAYER.health; player.inCar = false; player.carId = -1;
    player.bustTimer = 0; player.invulnerable = 0;
    for (const c of cars) c.active = false;
    for (let i = 0; i < TRAFFIC_COUNT; i += 1) spawnTrafficCar();
    for (let i = 0; i < PARKED_COUNT; i += 1) spawnParkedCar();
    for (let i = 0; i < peds.length; i += 1) spawnPed(i);
    for (const p of pickups) p.active = false;
    for (let i = 0; i < 6; i += 1) spawnCashPickup(-140 + random() * 280, -140 + random() * 280, 25);
    heli.active = false;
    state.money = 120; state.wanted = 0; state.heatTimer = 0; state.calmTimer = 0;
    state.missionIndex = 0; state.missionStep = 0; state.missionTimer = 0;
    state.missionActive = false; state.missionDone = 0;
    state.missionMsg = STORY_INTRO;
    state.missionObjective = 'Press M to open the mission board';
    state.elapsed = 0; state.dayT = 0.32;
    state.stats = { stolen: 0, busted: 0, crashes: 0, distance: 0 };
    state.combo = 0; state.comboTimer = 0; state.speed = 0;
    state.racePoints = []; state.collectLeft = 0;
  }

  const STORY_INTRO = 'Mara Voss: "Rio — Solara Bay needs a driver. Start a job on the mission board (M)."';

  function step(dt, move, actions, shoot) {
    const events = { pickup: false, mission: false, wanted: false, busted: false, victory: false, hit: false, cash: false };
    state.elapsed += dt;
    state.dayT = 0.32 + 0.06 * Math.sin(state.elapsed / 240);
    if (player.invulnerable > 0) player.invulnerable -= dt;
    if (player.health < PLAYER.health) player.health = Math.min(PLAYER.health, player.health + dt * 1.5);
    if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0; }

    // ---- player ----
    const prevX = player.x, prevZ = player.z;
    if (player.inCar) {
      const c = cars[player.carId];
      if (c && c.active) {
        const throttle = move.y;
        const steer = move.x;
        if (throttle > 0) c.speed += CAR.accel * dt;
        else if (throttle < 0) c.speed -= (c.speed > 0.5 ? CAR.brake : CAR.accel * 0.6) * dt;
        else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), CAR.drag * 8 * dt);
        if (Math.abs(c.speed) > 0.5) c.heading += steer * CAR.steer * dt * Math.min(1, Math.abs(c.speed) / 12) * Math.sign(c.speed);
        c.speed = Math.max(-CAR.reverseMax, Math.min(CAR.maxSpeed, c.speed));
        c.x += Math.sin(c.heading) * c.speed * dt;
        c.z += Math.cos(c.heading) * c.speed * dt;
        const fixed = collideCircle(c.x, c.z, 2.2);
        if (fixed.x !== c.x || fixed.z !== c.z) {
          if (Math.abs(c.speed) > 12) { state.stats.crashes += 1; state.combo += 1; state.comboTimer = 4; }
          c.speed *= 0.4; c.x = fixed.x; c.z = fixed.z;
        }
        player.x = c.x; player.z = c.z; player.heading = c.heading;
        state.speed = Math.abs(c.speed) * 3.6;
        state.stats.distance += Math.abs(c.speed) * dt;
        // Near-miss with traffic/peds raises the combo.
        for (let i = 0; i < cars.length; i += 1) {
          const o = cars[i];
          if (o.active && o !== c && o.kind !== 'police' && dist(c.x, c.z, o.x, o.z) < 5 && Math.abs(c.speed) > 20) {
            state.combo += 1; state.comboTimer = 4;
          }
        }
      } else { player.inCar = false; player.carId = -1; }
    } else {
      const speed = (move.y !== 0 || move.x !== 0) ? PLAYER.walkSpeed : 0;
      if (speed > 0) {
        // Move relative to the camera heading (world -z is "up" on the minimap).
        const camH = player.heading;
        const fx = Math.sin(camH), fz = Math.cos(camH);
        const rx = Math.cos(camH), rz = -Math.sin(camH);
        const dx = fx * move.y + rx * move.x;
        const dz = fz * move.y + rz * move.x;
        const len = Math.hypot(dx, dz) || 1;
        player.x += (dx / len) * speed * dt;
        player.z += (dz / len) * speed * dt;
        player.heading = Math.atan2(dx / len, dz / len);
        state.stats.distance += speed * dt;
      }
      const fixed = collideCircle(player.x, player.z, PLAYER.radius);
      player.x = fixed.x; player.z = fixed.z;
      state.speed = speed * 3.6;
    }

    // ---- shooting: scares peds, raises heat, can disable a police car ----
    if (shoot && player.invulnerable <= 0) {
      player.invulnerable = 0.35;
      if (state.wanted < WANTED_MAX) { setWanted(state.wanted + 1); events.wanted = true; }
      for (let i = 0; i < peds.length; i += 1) {
        if (dist(player.x, player.z, peds[i].x, peds[i].z) < 18) peds[i].panic = 3;
      }
      let closest = null; let cd = 26;
      for (let i = 0; i < cars.length; i += 1) {
        const c = cars[i];
        if (c.active && c.kind === 'police' && dist(player.x, player.z, c.x, c.z) < cd) { cd = dist(player.x, player.z, c.x, c.z); closest = c; }
      }
      if (closest) { closest.smoke += 1; if (closest.smoke >= 3) { closest.active = false; state.money += 100; state.missionMsg = 'Police cruiser disabled! +$100'; } }
    }

    // ---- traffic ----
    for (let i = 0; i < cars.length; i += 1) {
      const c = cars[i];
      if (!c.active || c.kind === 'player' || c.kind === 'parked' || c.kind === 'mission') continue;
      if (c.kind === 'police') continue; // police handled below
      let target = c.speed;
      for (let j = 0; j < cars.length; j += 1) {
        const o = cars[j];
        if (o === c || !o.active) continue;
        if (c.axis === 'x' && Math.abs(o.z - c.z) < 4 && ((c.dir > 0 && o.x > c.x && o.x - c.x < 10) || (c.dir < 0 && o.x < c.x && c.x - o.x < 10))) { target = 0; break; }
        if (c.axis === 'z' && Math.abs(o.x - c.x) < 4 && ((c.dir > 0 && o.z > c.z && o.z - c.z < 10) || (c.dir < 0 && o.z < c.z && c.z - o.z < 10))) { target = 0; break; }
      }
      c.speed += (target - c.speed) * Math.min(1, dt * 2);
      if (c.axis === 'x') c.x += c.dir * c.speed * dt;
      else c.z += c.dir * c.speed * dt;
      if (c.x > CITY.half + 10 || c.x < -CITY.half - 10 || c.z > CITY.half + 10 || c.z < -CITY.half - 10) {
        // Wrap to the far side on a fresh road.
        const line = STREET_LINES[Math.floor(random() * STREET_LINES.length)];
        if (c.axis === 'x') { c.x = c.dir > 0 ? -CITY.half - 8 : CITY.half + 8; c.z = line + (c.dir > 0 ? c.lane : -c.lane); }
        else { c.z = c.dir > 0 ? -CITY.half - 8 : CITY.half + 8; c.x = line + (c.dir > 0 ? c.lane : -c.lane); }
      }
    }

    // ---- pedestrians ----
    for (let i = 0; i < peds.length; i += 1) {
      const p = peds[i];
      if (p.panic > 0) {
        p.panic -= dt;
        const dx = p.x - player.x, dz = p.z - player.z;
        const len = Math.hypot(dx, dz) || 1;
        p.x += (dx / len) * 5 * dt; p.z += (dz / len) * 5 * dt;
        continue;
      }
      const dx = p.tx - p.x, dz = p.tz - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 2) { const t = roadPoint(); p.tx = t.x; p.tz = t.z; continue; }
      p.x += (dx / d) * p.speed * dt;
      p.z += (dz / d) * p.speed * dt;
      // Flee a speeding car.
      if (player.inCar && state.speed > 40 && dist(player.x, player.z, p.x, p.z) < 10) p.panic = 2;
    }

    // ---- police ----
    const policeWanted = state.wanted;
    let policeCount = 0;
    for (let i = 0; i < cars.length; i += 1) if (cars[i].active && cars[i].kind === 'police') policeCount += 1;
    if (policeWanted > 0 && policeCount < Math.min(POLICE_MAX, policeWanted + 1)) {
      const c = freeCar();
      if (c) {
        c.active = true; c.kind = 'police';
        const a = random() * Math.PI * 2;
        c.x = player.x + Math.cos(a) * 55; c.z = player.z + Math.sin(a) * 55;
        const fixed = collideCircle(c.x, c.z, 2.2); c.x = fixed.x; c.z = fixed.z;
        c.heading = 0; c.speed = 0; c.color = PALETTE.police; c.name = 'Interceptor'; c.smoke = 0;
      }
    }
    for (let i = 0; i < cars.length; i += 1) {
      const c = cars[i];
      if (!c.active || c.kind !== 'police') continue;
      if (policeWanted === 0) { c.active = false; continue; }
      const dx = player.x - c.x, dz = player.z - c.z;
      const d = Math.hypot(dx, dz) || 1;
      const wantH = Math.atan2(dx, dz);
      let dh = wantH - c.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      c.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
      const targetSpeed = Math.min(52, 30 + policeWanted * 4);
      c.speed += (targetSpeed - c.speed) * Math.min(1, dt * 1.2);
      c.x += Math.sin(c.heading) * c.speed * dt;
      c.z += Math.cos(c.heading) * c.speed * dt;
      const fixed = collideCircle(c.x, c.z, 2.2);
      c.x = fixed.x; c.z = fixed.z;
      if (d < 4.5) {
        if (player.inCar) {
          const pc = cars[player.carId];
          if (pc) pc.speed *= 0.7;
          if (Math.abs(c.speed) > 10 && player.invulnerable <= 0) { player.health -= 6; player.invulnerable = 0.8; events.hit = true; }
        } else if (player.invulnerable <= 0) {
          player.bustTimer += dt;
          if (player.bustTimer > 1.2) {
            player.bustTimer = 0;
            state.stats.busted += 1;
            state.money = Math.floor(state.money / 2);
            setWanted(0);
            player.x = GARAGE.x; player.z = GARAGE.z; player.health = PLAYER.health;
            state.missionMsg = 'BUSTED! The law took half your cash. Back at the garage.';
            events.busted = true;
          }
        }
      } else if (player.bustTimer > 0) player.bustTimer = Math.max(0, player.bustTimer - dt);
    }
    if (policeWanted === 0 && player.bustTimer > 0) player.bustTimer = 0;

    // ---- wanted decay: stay fast and far from the law ----
    if (state.wanted > 0) {
      let nearestPolice = 999;
      for (let i = 0; i < cars.length; i += 1) {
        const c = cars[i];
        if (c.active && c.kind === 'police') nearestPolice = Math.min(nearestPolice, dist(player.x, player.z, c.x, c.z));
      }
      if (nearestPolice > 70) {
        state.calmTimer += dt;
        if (state.calmTimer > 10) { setWanted(state.wanted - 1); state.calmTimer = 0; events.wanted = true; }
      } else state.calmTimer = 0;
    }

    // ---- helicopter at 4+ stars ----
    heli.active = state.wanted >= 4;
    if (heli.active) {
      heli.angle += dt * 0.5;
      heli.x = player.x + Math.cos(heli.angle) * 26;
      heli.z = player.z + Math.sin(heli.angle) * 26;
    }

    // ---- pickups ----
    for (let i = 0; i < pickups.length; i += 1) {
      const p = pickups[i];
      if (!p.active) continue;
      if (dist(player.x, player.z, p.x, p.z) < 4) {
        p.active = false;
        state.money += p.value;
        if (p.kind === 'crate') {
          state.collectLeft -= 1;
          events.pickup = true;
          state.missionMsg = `Crate secured — ${Math.max(0, state.collectLeft)} left. +$150`;
          if (state.collectLeft <= 0 && state.missionActive) { if (advanceStep(events)) events.victory = true; events.mission = true; }
        } else {
          events.cash = true;
        }
      }
    }

    // ---- mission progress ----
    if (state.missionActive) {
      const stepDef = currentStep();
      if (stepDef) {
        if (stepDef.kind === 'goto') {
          if (dist(player.x, player.z, stepDef.x, stepDef.z) < stepDef.radius) {
            if (advanceStep(events)) events.victory = true;
            events.mission = true;
          }
        } else if (stepDef.kind === 'steal') {
          if (player.inCar) {
            const c = cars[player.carId];
            if (c && c.name === stepDef.carName) {
              state.missionObjective = `Deliver the ${stepDef.carName} to ${stepDef.deliver.name || 'Solara Garage'}`;
              if (dist(player.x, player.z, stepDef.deliver.x, stepDef.deliver.z) < stepDef.radius) {
                c.active = false; player.inCar = false; player.carId = -1;
                if (advanceStep(events)) events.victory = true;
                events.mission = true;
              }
            }
          }
        } else if (stepDef.kind === 'escape') {
          state.missionTimer -= dt;
          state.missionObjective = `${stepDef.label} — ${Math.ceil(Math.max(0, state.missionTimer))}s`;
          if (state.missionTimer <= 0) {
            setWanted(0);
            if (advanceStep(events)) events.victory = true;
            events.mission = true;
          }
        } else if (stepDef.kind === 'race') {
          state.missionTimer -= dt;
          const next = state.racePoints.find((p) => !p.done);
          if (next) {
            state.missionObjective = `Checkpoint ${state.racePoints.filter((p) => p.done).length + 1}/4 — ${Math.ceil(Math.max(0, state.missionTimer))}s`;
            if (dist(player.x, player.z, next.x, next.z) < 10) {
              next.done = true;
              const following = state.racePoints.find((p) => !p.done);
              state.missionTarget = following ? { x: following.x, z: following.z } : null;
            }
          } else if (advanceStep(events)) events.victory = true;
          if (state.missionTimer <= 0 && state.missionActive) {
            state.missionActive = false;
            state.missionMsg = 'Race lost — the clock beat you. Start the job again (M).';
          }
        }
      }
    }

    // ---- wasted ----
    if (player.health <= 0) {
      player.health = 0;
      events.hit = true;
    }
    return events;
  }

  reset();
  return { state, reset, step, enterCar, startMission, setWanted, missionPlan, buildings };
}
