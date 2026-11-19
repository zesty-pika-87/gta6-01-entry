// Minimap: one job — draw the round city map in the HUD corner: streets,
// beach and sea, the mission beacon, traffic dots, police dots, and the
// player arrow. North is up; the whole city fits in the circle.
import { CITY } from './config.js';
import { STREET_LINES } from './traffic.js';

const HALF = CITY.half + 46;

export function drawMinimap(canvas, state) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const r = size / 2;
  const scale = (size - 8) / (HALF * 2);
  const toX = (x) => r + x * scale;
  const toY = (z) => r + z * scale;
  ctx.clearRect(0, 0, size, size);

  // Sea and sand along the south edge.
  ctx.fillStyle = '#2a7f9e';
  ctx.fillRect(0, toY(CITY.half + 6), size, size - toY(CITY.half + 6));
  ctx.fillStyle = '#e8d29a';
  ctx.fillRect(0, toY(CITY.half), size, toY(CITY.half + 6) - toY(CITY.half));

  // City ground and streets.
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(toX(-CITY.half), toY(-CITY.half), CITY.half * 2 * scale, CITY.half * 2 * scale);
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  for (const line of STREET_LINES) {
    ctx.beginPath(); ctx.moveTo(toX(-CITY.half), toY(line)); ctx.lineTo(toX(CITY.half), toY(line)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toX(line), toY(-CITY.half)); ctx.lineTo(toX(line), toY(CITY.half)); ctx.stroke();
  }

  // Mission beacon.
  const step = currentStepOf(state);
  if (step && step.x !== undefined) {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.arc(toX(step.x), toY(step.z), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffc93c';
    ctx.beginPath();
    ctx.arc(toX(step.x), toY(step.z), 9 + Math.sin(state.elapsed * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Race checkpoints.
  for (const p of state.racePoints || []) {
    if (p.done) continue;
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.arc(toX(p.x), toY(p.z), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Traffic (grey) and police (blue) dots.
  for (const c of state.cars) {
    if (!c.active) continue;
    ctx.fillStyle = c.kind === 'police' ? '#3b82f6' : '#cbd5e1';
    ctx.fillRect(toX(c.x) - 1.5, toY(c.z) - 1.5, 3, 3);
  }

  // Player arrow, pointing along the heading.
  const px = toX(state.player.x);
  const py = toY(state.player.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(state.player.heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function currentStepOf(state) {
  if (!state.missionActive) return null;
  // The beacon is the active mission's current target, exposed by the world
  // through its objective state: goto / collect / steal / race first point.
  const m = state.missionTarget;
  return m || null;
}
