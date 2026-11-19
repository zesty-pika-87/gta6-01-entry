// Drawing only: the three.js scene for Solara Bay. The world hands over its
// state and this file paints it — the golden-hour city, the beach and the sea,
// traffic, pedestrians, police, the helicopter, mission beacons and the
// chase camera. No rules here, only pixels.
import * as THREE from '../vendor/three.module.min.js';
import { CITY, PALETTE } from './config.js';
import { buildCarMesh, buildPlayerMesh, setCarColor } from './vehicles.js';
import { buildPedMesh, pedWalk } from './pedestrians.js';
import { buildHelicopter, buildPoliceMesh, heliSpin, sirenPhase } from './police.js';
import { createTrafficLights, updateTrafficLights } from './traffic.js';
import { createParticles } from './particles.js';
import { createCombat } from './combat.js';

function windowTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#3a4a66';
  for (let y = 6; y < 122; y += 11) {
    for (let x = 5; x < 59; x += 10) {
      if (Math.random() < 0.68) g.fillRect(x, y, 6, 7);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function createRenderer(canvas, world) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffcf9e);
  scene.fog = new THREE.Fog(0xffc98f, 120, 420);

  const hemi = new THREE.HemisphereLight(0xffe0b3, 0x3a4a5a, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd9a0, 2.2);
  sun.position.set(-120, 90, -160);
  scene.add(sun);
  const sunBall = new THREE.Mesh(
    new THREE.SphereGeometry(14, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe9b0, fog: false }),
  );
  sunBall.position.set(-260, 55, -300);
  scene.add(sunBall);

  // ---- ground: city slab, roads, sidewalks, beach, sea ----
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 2 + 120, CITY.half * 2 + 120),
    new THREE.MeshLambertMaterial({ color: 0x55504a }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 20);
  scene.add(ground);

  const roadMat = new THREE.MeshLambertMaterial({ color: PALETTE.road });
  const roadGeoX = new THREE.PlaneGeometry(CITY.half * 2, CITY.roadHalf * 2);
  const roadGeoZ = new THREE.PlaneGeometry(CITY.roadHalf * 2, CITY.half * 2);
  for (let v = -CITY.half; v <= CITY.half; v += CITY.street) {
    const rx = new THREE.Mesh(roadGeoX, roadMat);
    rx.rotation.x = -Math.PI / 2;
    rx.position.set(0, 0.02, v);
    scene.add(rx);
    const rz = new THREE.Mesh(roadGeoZ, roadMat);
    rz.rotation.x = -Math.PI / 2;
    rz.position.set(v, 0.02, 0);
    scene.add(rz);
  }
  // Centre dashes.
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xd8c93c });
  const dashGeo = new THREE.PlaneGeometry(3, 0.4);
  for (let v = -CITY.half; v <= CITY.half; v += CITY.street) {
    for (let a = -CITY.half + 10; a < CITY.half; a += 20) {
      const d = new THREE.Mesh(dashGeo, dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(a, 0.04, v);
      scene.add(d);
    }
  }

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 2 + 120, 46),
    new THREE.MeshLambertMaterial({ color: PALETTE.sand }),
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0.03, CITY.half + 23);
  scene.add(sand);
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 2 + 120, 90),
    new THREE.MeshLambertMaterial({ color: PALETTE.sea }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0.02, CITY.half + 46 + 45);
  scene.add(sea);

  // ---- buildings ----
  const winTex = windowTexture();
  const buildingMats = new Map();
  function buildingMat(color) {
    if (!buildingMats.has(color)) {
      buildingMats.set(color, new THREE.MeshLambertMaterial({ color, map: winTex }));
    }
    return buildingMats.get(color);
  }
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4038 });
  for (const b of world.state.buildings) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), buildingMat(b.color));
    mesh.position.set(b.x, b.h / 2, b.z);
    scene.add(mesh);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.9, 0.5, b.d * 0.9), roofMat);
    roof.position.set(b.x, b.h + 0.25, b.z);
    scene.add(roof);
    if (b.roof) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), roofMat);
      ac.position.set(b.x + b.w / 4, b.h + 1, b.z);
      scene.add(ac);
    }
  }

  // ---- palms along the beach ----
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8a6b45 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
  for (const p of world.state.palms) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 5, 6), trunkMat);
    trunk.position.set(p.x, 2.5, p.z);
    scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), leafMat);
    crown.position.set(p.x, 5.6, p.z);
    crown.scale.y = 0.6;
    scene.add(crown);
  }

  // ---- garage: the mission hub ----
  const garage = new THREE.Group();
  const gBase = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 10), new THREE.MeshLambertMaterial({ color: 0xe63946 }));
  gBase.position.y = 3;
  garage.add(gBase);
  const gSign = new THREE.Mesh(new THREE.BoxGeometry(16.5, 1.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xffc93c }));
  gSign.position.set(0, 6.4, 5.1);
  garage.add(gSign);
  garage.position.set(120, 0, 120);
  scene.add(garage);

  const lights = createTrafficLights(scene);
  const particles = createParticles(scene);
  const combat = createCombat(scene);

  // ---- dynamic pools ----
  const playerMesh = buildPlayerMesh();
  scene.add(playerMesh);

  const carMeshes = [];
  for (let i = 0; i < world.state.cars.length; i += 1) {
    const m = buildCarMesh(0xcccccc);
    m.visible = false;
    scene.add(m);
    carMeshes.push(m);
  }
  const pedMeshes = [];
  for (let i = 0; i < world.state.peds.length; i += 1) {
    const m = buildPedMesh(world.state.peds[i].shirt);
    scene.add(m);
    pedMeshes.push(m);
  }
  const heli = buildHelicopter();
  heli.visible = false;
  scene.add(heli);

  // Mission beacon: a gold beam plus a pulsing ring on the ground.
  const beacon = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 60, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc93c, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  beam.position.y = 30;
  beacon.add(beam);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3, 4.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xffc93c, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  beacon.add(ring);
  beacon.visible = false;
  scene.add(beacon);

  const raceRings = [];
  for (let i = 0; i < 4; i += 1) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(5, 0.35, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xff8c42 }),
    );
    r.rotation.x = Math.PI / 2;
    r.position.y = 3;
    r.visible = false;
    scene.add(r);
    raceRings.push(r);
  }

  // Pickups: gold cash boxes and orange crates.
  const pickupMeshes = [];
  for (let i = 0; i < world.state.pickups.length; i += 1) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshBasicMaterial({ color: 0xffc93c }),
    );
    m.visible = false;
    scene.add(m);
    pickupMeshes.push(m);
  }

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 900);
  const camPos = new THREE.Vector3(0, 12, -18);
  const camTarget = new THREE.Vector3();
  let walkPhase = 0;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /** Paint one frame from the world state. `t` is seconds since boot. */
  function draw(state, t, shakeOffset) {
    updateTrafficLights(lights, t);
    particles.update(1 / 60);
    combat.update(1 / 60);

    // Sea shimmer.
    sea.position.y = 0.02 + Math.sin(t * 0.8) * 0.05;

    // Player.
    const p = state.player;
    if (p.inCar) {
      playerMesh.visible = false;
    } else {
      playerMesh.visible = true;
      playerMesh.position.set(p.x, 0, p.z);
      playerMesh.rotation.y = p.heading;
      walkPhase += (state.speed > 0 ? 0.22 : 0);
      const legL = playerMesh.getObjectByName('legL');
      const legR = playerMesh.getObjectByName('legR');
      if (legL) legL.rotation.x = Math.sin(walkPhase) * 0.6;
      if (legR) legR.rotation.x = -Math.sin(walkPhase) * 0.6;
    }

    // Cars.
    for (let i = 0; i < state.cars.length; i += 1) {
      const c = state.cars[i];
      const m = carMeshes[i];
      if (!c.active) { m.visible = false; continue; }
      m.visible = true;
      // Police interceptors carry a light bar; swap the mesh in when the kind changes.
      if (c.kind === 'police' && !m.getObjectByName('lightbar')) {
        scene.remove(m);
        const pm = buildPoliceMesh();
        scene.add(pm);
        carMeshes[i] = pm;
        pm.position.set(c.x, 0, c.z);
        pm.rotation.y = c.heading;
        setCarColor(pm, c.color);
        continue;
      }
      setCarColor(m, c.color);
      m.position.set(c.x, 0, c.z);
      m.rotation.y = c.heading;
      const wheels = m.userData.wheels;
      if (wheels) {
        const spin = (c.speed || 0) * 0.05;
        for (const w of wheels) w.rotation.x += spin;
      }
      if (c.kind === 'police') sirenPhase(m, t);
      if (c.smoke >= 1 && Math.random() < 0.3) {
        particles.spawn(c.x, 1.5, c.z, 0x666666, 2, 2, 2);
      }
    }

    // Pedestrians.
    for (let i = 0; i < state.peds.length; i += 1) {
      const ped = state.peds[i];
      const m = pedMeshes[i];
      m.position.set(ped.x, 0, ped.z);
      const dx = ped.tx - ped.x;
      const dz = ped.tz - ped.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.5) m.rotation.y = Math.atan2(dx, dz);
      pedWalk(m, t * 6 + i, ped.speed * 0.4);
    }

    // Helicopter.
    if (state.heli.active) {
      heli.visible = true;
      heli.position.set(state.heli.x, 55, state.heli.z);
      heli.lookAt(p.x, 0, p.z);
      heliSpin(heli, t);
    } else heli.visible = false;

    // Mission beacon.
    if (state.missionTarget) {
      beacon.visible = true;
      beacon.position.set(state.missionTarget.x, 0, state.missionTarget.z);
      const s = 1 + Math.sin(t * 3) * 0.15;
      ring.scale.setScalar(s);
      beam.material.opacity = 0.25 + Math.sin(t * 3) * 0.1;
    } else beacon.visible = false;

    // Race checkpoints.
    for (let i = 0; i < raceRings.length; i += 1) {
      const rp = state.racePoints[i];
      if (!rp || rp.done) { raceRings[i].visible = false; continue; }
      raceRings[i].visible = true;
      raceRings[i].position.set(rp.x, 3 + Math.sin(t * 2 + i) * 0.3, rp.z);
      raceRings[i].rotation.z = t * 0.5;
    }

    // Pickups.
    for (let i = 0; i < state.pickups.length; i += 1) {
      const pk = state.pickups[i];
      const m = pickupMeshes[i];
      if (!pk.active) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(pk.x, 1.2 + Math.sin(t * 3 + i) * 0.25, pk.z);
      m.rotation.y = t * 2 + i;
      m.material.color.setHex(pk.kind === 'crate' ? 0xff8c42 : 0xffc93c);
      m.scale.setScalar(pk.kind === 'crate' ? 1.4 : 1);
    }

    // ---- chase camera ----
    const back = p.inCar ? 13 : 10;
    const height = p.inCar ? 6.5 : 5;
    const cx = p.x - Math.sin(p.heading) * back;
    const cz = p.z - Math.cos(p.heading) * back;
    camPos.x += (cx - camPos.x) * 0.08;
    camPos.y += (height - camPos.y) * 0.08;
    camPos.z += (cz - camPos.z) * 0.08;
    camTarget.set(p.x, 2, p.z);
    camera.position.set(camPos.x + (shakeOffset ? shakeOffset.x : 0), camPos.y + (shakeOffset ? shakeOffset.y : 0), camPos.z);
    camera.lookAt(camTarget);
    renderer.render(scene, camera);
  }

  /** Teleport the chase camera behind the player (used when staging shots). */
  function snapCamera(state) {
    const p = state.player;
    camPos.set(p.x - Math.sin(p.heading) * 12, 6, p.z - Math.cos(p.heading) * 12);
  }

  return { draw, snapCamera, particles, combat, scene, camera, renderer };
}
