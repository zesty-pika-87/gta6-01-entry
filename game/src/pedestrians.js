// Pedestrians: one job — a low-poly walker with a shirt colour and a bob.
// The world walks them along the sidewalks; this file builds the mesh and
// turns a walk phase into swinging legs.
import * as THREE from '../vendor/three.module.min.js';

const bodyGeo = new THREE.BoxGeometry(0.7, 0.85, 0.4);
const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
const legGeo = new THREE.BoxGeometry(0.26, 0.75, 0.26);
const skinMat = new THREE.MeshLambertMaterial({ color: 0xd9a066 });
const jeansMat = new THREE.MeshLambertMaterial({ color: 0x3a3f4a });

const shirtMats = new Map();
function shirt(color) {
  if (!shirtMats.has(color)) shirtMats.set(color, new THREE.MeshLambertMaterial({ color }));
  return shirtMats.get(color);
}

export function buildPedMesh(shirtColor) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(bodyGeo, shirt(shirtColor));
  body.position.y = 1.1;
  group.add(body);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.8;
  group.add(head);
  const legL = new THREE.Mesh(legGeo, jeansMat);
  legL.position.set(-0.18, 0.4, 0);
  legL.name = 'legL';
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.18;
  legR.name = 'legR';
  group.add(legR);
  return group;
}

/** Swing the legs and bob the body for a walker at phase `t` (radians). */
export function pedWalk(group, t, speed) {
  const swing = Math.sin(t) * 0.5 * Math.min(1, speed);
  const legL = group.getObjectByName('legL');
  const legR = group.getObjectByName('legR');
  if (legL) legL.rotation.x = swing;
  if (legR) legR.rotation.x = -swing;
  group.position.y = Math.abs(Math.sin(t)) * 0.06;
}
