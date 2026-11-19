// The Solara Bay Police Department: interceptor meshes with a flashing light
// bar, the searchlight helicopter that circles at 4+ stars, and the siren
// phase that makes the bar blink red-blue. The world decides when they chase;
// this file builds what they look like.
import * as THREE from '../vendor/three.module.min.js';
import { buildCarMesh } from './vehicles.js';

/** A black-and-white interceptor with a light bar named 'lightbar'. */
export function buildPoliceMesh() {
  const car = buildCarMesh(0xf5f5f5, { police: true });
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(2.12, 0.2, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
  );
  stripe.position.set(0, 0.75, 0.4);
  car.add(stripe);
  return car;
}

/** Blink the light bar: red on even beats, blue on odd beats. */
export function sirenPhase(group, t) {
  const bar = group.getObjectByName('lightbar');
  if (!bar) return;
  bar.material.color.setHex(Math.floor(t * 4) % 2 === 0 ? 0xff2222 : 0x2244ff);
}

/** The police helicopter: body, tail, main rotor and a searchlight cone. */
export function buildHelicopter() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 4), bodyMat);
  group.add(body);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.5), bodyMat);
  tail.position.set(0, 0.3, -4);
  group.add(tail);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.08, 0.4), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  rotor.position.y = 0.9;
  rotor.name = 'rotor';
  group.add(rotor);
  const light = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 9, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  );
  light.position.y = -5;
  light.rotation.x = Math.PI;
  group.add(light);
  return group;
}

/** Spin the rotor; the cone follows the body. */
export function heliSpin(group, t) {
  const rotor = group.getObjectByName('rotor');
  if (rotor) rotor.rotation.y = t * 18;
}
