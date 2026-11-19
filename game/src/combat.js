// Combat feedback: one job — the visible part of a shot. A tracer line from
// the shooter toward the aim point plus a burst of sparks where it lands.
// The world decides hits; this file only shows them.
import * as THREE from '../vendor/three.module.min.js';

const TRACERS = 6;

export function createCombat(scene) {
  const tracers = [];
  for (let i = 0; i < TRACERS; i += 1) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0 }));
    scene.add(line);
    tracers.push({ line, life: 0 });
  }
  let next = 0;

  /** Show a shot from `from` toward `to`. */
  function fire(from, to) {
    const t = tracers[next];
    next = (next + 1) % TRACERS;
    const pos = t.line.geometry.attributes.position;
    pos.setXYZ(0, from.x, from.y, from.z);
    pos.setXYZ(1, to.x, to.y, to.z);
    pos.needsUpdate = true;
    t.line.material.opacity = 1;
    t.life = 0.12;
  }

  function update(dt) {
    for (const t of tracers) {
      if (t.life > 0) {
        t.life -= dt;
        t.line.material.opacity = Math.max(0, t.life / 0.12);
      }
    }
  }

  return { fire, update };
}
