// Vehicle meshes: one job — turn a colour and a name into a low-poly car the
// renderer can drop into the city. Body, cabin, four wheels and headlights
// share three geometries and one material per colour, so a whole street of
// traffic costs almost nothing.
import * as THREE from '../vendor/three.module.min.js';

const bodyGeo = new THREE.BoxGeometry(2.1, 0.75, 4.6);
const cabinGeo = new THREE.BoxGeometry(1.8, 0.65, 2.2);
const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
const lightGeo = new THREE.BoxGeometry(0.35, 0.18, 0.1);
const glassMat = new THREE.MeshLambertMaterial({ color: 0x9fd8e8 });
const tyreMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3344 });

const paintMats = new Map();
function paint(color) {
  if (!paintMats.has(color)) paintMats.set(color, new THREE.MeshLambertMaterial({ color }));
  return paintMats.get(color);
}

/** A driveable-looking car. `police` adds the light bar; `gold` adds trim. */
export function buildCarMesh(color, opts = {}) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(bodyGeo, paint(color));
  body.position.y = 0.55;
  group.add(body);
  const cabin = new THREE.Mesh(cabinGeo, opts.glass === false ? paint(color) : glassMat);
  cabin.position.set(0, 1.15, -0.25);
  group.add(cabin);
  const wheels = [];
  for (const [x, z] of [[-0.95, 1.5], [0.95, 1.5], [-0.95, -1.5], [0.95, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, tyreMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.42, z);
    group.add(w);
    wheels.push(w);
  }
  const hl = new THREE.Mesh(lightGeo, headMat);
  hl.position.set(-0.6, 0.6, 2.32);
  group.add(hl);
  const hr = hl.clone();
  hr.position.x = 0.6;
  group.add(hr);
  const tl = new THREE.Mesh(lightGeo, tailMat);
  tl.position.set(-0.6, 0.6, -2.32);
  group.add(tl);
  const tr = tl.clone();
  tr.position.x = 0.6;
  group.add(tr);
  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    bar.position.set(0, 1.6, -0.25);
    bar.name = 'lightbar';
    group.add(bar);
  }
  group.userData.wheels = wheels;
  return group;
}

/** Recolour an existing car mesh (body only) to a new paint colour. */
export function setCarColor(mesh, color) {
  if (mesh.userData.color === color) return;
  mesh.userData.color = color;
  const body = mesh.children[0];
  if (body) body.material = paint(color);
}
export function buildPlayerMesh() {
  const group = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: 0xffc93c });
  const skin = new THREE.MeshLambertMaterial({ color: 0xd9a066 });
  const jeans = new THREE.MeshLambertMaterial({ color: 0x2b3a55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.45), shirt);
  body.position.y = 1.15;
  body.name = 'torso';
  group.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skin);
  head.position.y = 1.9;
  group.add(head);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), new THREE.MeshLambertMaterial({ color: 0xe63946 }));
  cap.position.y = 2.18;
  group.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.3), jeans);
  legL.position.set(-0.2, 0.45, 0);
  legL.name = 'legL';
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.2;
  legR.name = 'legR';
  group.add(legR);
  return group;
}
