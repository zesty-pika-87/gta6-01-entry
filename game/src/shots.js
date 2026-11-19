// The screenshot scenes behind ?shot=start|play|garage|end. Each one stages
// the real game — the same world, the same rules — into a frame that shows
// what a short session really looks like, and the same seed always gives the
// same frame. Cover (play) is the densest: a 3-star chase with the minimap,
// the mission objective and the city behind it.
import { STEP } from './config.js';
import { GARAGE } from './missions.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 5;

/** Put the player in a car parked right beside them, then start driving it. */
function putPlayerInCar(world) {
  const state = world.state;
  const car = state.cars.find((c) => c.active && c.kind === 'parked');
  if (!car) return;
  car.x = state.player.x + 4;
  car.z = state.player.z;
  car.heading = state.player.heading;
  world.enterCar();
}

/** Drive straight ahead with a little steering toward the mission beacon. */
function chaseAutopilot(world) {
  const state = world.state;
  // No beacon during the escape: run straight up Sunset Boulevard (x = 0).
  const target = state.missionTarget || { x: 0, z: 160 };
  const dx = target.x - state.player.x;
  const dz = target.z - state.player.z;
  const wantH = Math.atan2(dx, dz);
  let dh = wantH - state.player.heading;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  return { x: Math.max(-1, Math.min(1, dh * 1.5)), y: 1 };
}

/**
 * Set `world` to the named scene (start, play, garage or end) and return the
 * screen to draw over it.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.reset();
    // Stage on Sunset Boulevard (x = 0), heading north up the road, so the
    // autopilot runs straight instead of cutting through buildings.
    state.player.x = 0;
    state.player.z = -120;
    state.player.heading = 0;
    world.startMission(2); // Neon Getaway: the heat is already on.
    putPlayerInCar(world);
    world.setWanted(3);
    for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
      world.step(STEP, chaseAutopilot(world), 0, false);
    }
    // Pull two interceptors into the frame ahead of the player, closing in
    // head-on down the boulevard, so the chase reads at a glance.
    const cops = state.cars.filter((c) => c.active && c.kind === 'police');
    cops.slice(0, 2).forEach((c, i) => {
      const ahead = 34 + i * 16;
      c.x = state.player.x + (i === 0 ? -4 : 4);
      c.z = state.player.z + Math.cos(state.player.heading) * ahead;
      c.heading = state.player.heading + Math.PI;
      c.speed = 38;
    });
    return { screen: 'play' };
  }
  if (name === 'garage') {
    world.reset();
    state.player.x = GARAGE.x - 14;
    state.player.z = GARAGE.z + 6;
    state.player.heading = Math.PI / 4;
    state.money = 2450;
    state.missionDone = 2;
    state.missionObjective = 'Mission 3: Neon Getaway — Mara Voss';
    for (let i = 0; i < 3 / STEP; i += 1) world.step(STEP, { x: 0, y: 0 }, 0, false);
    return { screen: 'garage' };
  }
  if (name === 'end') {
    world.reset();
    state.missionDone = 8;
    state.money = 6850;
    state.stats.stolen = 14;
    state.stats.busted = 1;
    state.stats.crashes = 9;
    state.stats.distance = 48200;
    state.elapsed = 1240;
    state.missionObjective = 'All missions done — Solara Bay is yours!';
    state.player.x = 80;
    state.player.z = -60;
    state.player.heading = Math.PI * 0.75;
    for (let i = 0; i < 3 / STEP; i += 1) world.step(STEP, { x: 0, y: 0 }, 0, false);
    return { screen: 'victory' };
  }
  world.reset();
  state.player.x = 0;
  state.player.z = 40;
  state.player.heading = Math.PI;
  for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { x: 0, y: 0 }, 0, false);
  return { screen: 'title' };
}
