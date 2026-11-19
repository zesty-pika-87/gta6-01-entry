// Particles: one job — a pool of small glowing boxes for crashes, pickups,
// exhaust puffs and mission sparkles. Spawned, flown, faded, reused.
import * as THREE from '../vendor/three.module.min.js';

const COUNT = 240;

export function createParticles(scene) {
  const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.InstancedMesh(geo, mat, COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = COUNT;
  mesh.frustumCulled = false;
  scene.add(mesh);
  const parts = [];
  for (let i = 0; i < COUNT; i += 1) parts.push({ life: 0, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, r: 0, g: 0, b: 0 });
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  function spawn(x, y, z, hex, n, spread, up) {
    color.setHex(hex);
    let placed = 0;
    for (let i = 0; i < COUNT && placed < n; i += 1) {
      const p = parts[i];
      if (p.life > 0) continue;
      p.life = 0.5 + Math.random() * 0.5;
      p.x = x; p.y = y; p.z = z;
      p.vx = (Math.random() - 0.5) * spread;
      p.vy = Math.random() * up;
      p.vz = (Math.random() - 0.5) * spread;
      p.r = color.r; p.g = color.g; p.b = color.b;
      placed += 1;
    }
  }

  function update(dt) {
    for (let i = 0; i < COUNT; i += 1) {
      const p = parts[i];
      if (p.life > 0) {
        p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vy -= 9 * dt;
        if (p.y < 0.1) p.y = 0.1;
      } else {
        p.y = -99;
      }
      dummy.position.set(p.x, p.y, p.z);
      const s = p.life > 0 ? Math.min(1, p.life * 2) : 0.001;
      dummy.scale.setScalar(Math.max(0.001, s));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.setRGB(p.r, p.g, p.b));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  return { spawn, update };
}
