// Solara Bay — every tuning number, colour and named place in one place.
// A sun-soaked open-world city on the coast: 8x8 street grid, a beach to the
// south, a marina to the east. All distances are in world units; the fixed
// simulation step is 1/60 s whatever the display rate.
export const STEP = 1 / 60;

export const CITY = {
  half: 160, // city extends -160..160 on x and z; beach beyond z = 160
  street: 40, // spacing between street centrelines
  roadHalf: 5, // half-width of a road
  block: 28, // building block size inside a street cell
};

export const PLAYER = {
  walkSpeed: 9,
  runSpeed: 14,
  radius: 0.9,
  health: 100,
};

export const CAR = {
  accel: 26,
  brake: 42,
  maxSpeed: 46,
  reverseMax: 14,
  steer: 1.9,
  drag: 0.6,
  length: 4.6,
  width: 2.1,
};

export const WANTED_MAX = 5;

export const MISSIONS = [
  { id: 1, name: 'Sunrise Courier', giver: 'Mara Voss', place: 'Marina', x: 150, z: -40, reward: 350, brief: 'Drive the courier van to the Marina before the tide turns.' },
  { id: 2, name: 'Bayfront Pickup', giver: 'Old Sal', place: 'Bayfront Plaza', x: -120, z: 120, reward: 400, brief: 'Collect 3 sun-crates scattered around Bayfront Plaza.' },
  { id: 3, name: 'Neon Getaway', giver: 'Mara Voss', place: 'Neon Strip', x: 40, z: -120, reward: 600, brief: 'Lose a 2-star heat. Stay out of the cuffs for 30 seconds.' },
  { id: 4, name: 'Harbor Heist', giver: 'The Broker', place: 'Harbor Gate', x: -150, z: -120, reward: 900, brief: 'Steal the gold Comet GT from the Harbor and park it in the garage.' },
  { id: 5, name: 'Street Racer', giver: 'Jax Rivera', place: 'Sunset Boulevard', x: 0, z: 0, reward: 750, brief: 'Beat the Sunset Circuit: 4 checkpoints, no shortcuts, no mercy.' },
  { id: 6, name: 'Rooftop Signal', giver: 'Old Sal', place: 'Grand Solara Hotel', x: 120, z: 80, reward: 500, brief: 'On foot to the hotel roof. Light the signal lamp for the fleet.' },
  { id: 7, name: 'Midnight Tow', giver: 'The Broker', place: 'Depot', x: -40, z: 150, reward: 650, brief: 'Tow the broken-down flatbed to the Depot across town.' },
  { id: 8, name: 'Solara Crown', giver: 'Mara Voss', place: 'Crown Plaza', x: 80, z: -80, reward: 1500, brief: 'Take the Crown from Crown Plaza and outrun a 4-star storm.' },
];

export const DISTRICTS = [
  { name: 'Marina', x: 150, z: -40 },
  { name: 'Neon Strip', x: 40, z: -120 },
  { name: 'Bayfront', x: -120, z: 120 },
  { name: 'Harbor', x: -150, z: -120 },
  { name: 'Crown Plaza', x: 80, z: -80 },
  { name: 'Old Town', x: -80, z: -40 },
  { name: 'Sunset Blvd', x: 0, z: 0 },
  { name: 'Palm Beach', x: 0, z: 175 },
];

export const CAR_NAMES = ['Comet GT', 'Sunrunner', 'Bay Cruiser', 'Palm Runner', 'Dune Hawk', 'Coral Coupe'];
export const CAR_COLORS = [0xffc93c, 0x2ec4b6, 0xe63946, 0x4361ee, 0xf77f00, 0x80b918];

export const PALETTE = {
  sky: 0x87b5e0,
  sun: 0xffd9a0,
  ground: 0x3a3f4a,
  road: 0x2b2e36,
  sidewalk: 0x9a938a,
  sand: 0xe8d29a,
  sea: 0x2a7f9e,
  building: [0xf2e3c6, 0xe8b4a0, 0xa8c6d8, 0xd8c6a8, 0xc6d8b0, 0xe0a8b8, 0xf5f0e6, 0xb8c8e0],
  glass: 0x9fd8e8,
  text: '#fff7e6',
  muted: '#d8cbb0',
  gold: '#ffc93c',
  wanted: '#ff4757',
  police: '#1e3a8a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const SAVE_KEY = 'solara-bay.save.v1';
export const BEST_KEY = 'solara-bay.best';
