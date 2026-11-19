// Traffic flow on the street grid: the street lines themselves, the traffic
// lights that hang over the big intersections, and their golden-hour phase.
// The world moves the cars; this file owns everything the lights do.
import * as THREE from '../vendor/three.module.min.js';
import { CITY } from './config.js';

export const STREET_LINES = [];
for (let v = -CITY.half; v <= CITY.half; v += CITY.street) STREET_LINES.push(v);

/** True when (x, z) sits on a road surface (within a lane of a street line). */
export function isOnRoad(x, z) {
  for (const line of STREET_LINES) {
    if (Math.abs(x - line) <= CITY.roadHalf + 2 || Math.abs(z - line) <= CITY.roadHalf + 2) return true;
  }
  return false;
}

/** Build the traffic-light poles at the four central intersections. */
export function createTrafficLights(scene) {
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const housingMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const lights = [];
  for (const [x, z] of [[-40, -40], [40, -40], [-40, 40], [40, 40]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 8), poleMat);
    pole.position.set(x + 6, 3, z + 6);
    scene.add(pole);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), housingMat);
    housing.position.set(x + 6, 6.2, z + 6);
    scene.add(housing);
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x33ff66 }),
    );
    lamp.position.set(x + 6, 6.6, z + 6.3);
    scene.add(lamp);
    lights.push(lamp);
  }
  return lights;
}

/** Alternate the intersection lamps between green and amber on a slow cycle. */
export function updateTrafficLights(lights, t) {
  const phase = Math.floor(t / 6) % 2;
  for (const lamp of lights) lamp.material.color.setHex(phase === 0 ? 0x33ff66 : 0xffb020);
}
