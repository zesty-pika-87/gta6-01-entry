// Keyboard and pointer input for Solara Bay. Held keys give a steering vector
// (WASD / arrows); one-shot presses — enter car, shoot, handbrake, pause,
// confirm, mute — are queued as bit flags and taken once by the loop, so a
// press between two frames is never lost and never counted twice.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_SHOOT = 8;
export const ACTION_MUTE = 16;

const FORWARD = new Set(['KeyW', 'ArrowUp']);
const BACK = new Set(['KeyS', 'ArrowDown']);
const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const ENTER = new Set(['KeyE']);
const SHOOT = new Set(['KeyF', 'MouseLeft']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  const held = { forward: false, back: false, left: false, right: false, brake: false };
  let actions = 0;

  function keydown(event) {
    if (FORWARD.has(event.code)) held.forward = true;
    else if (BACK.has(event.code)) held.back = true;
    else if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (ENTER.has(event.code)) { if (!event.repeat) actions |= ACTION_ENTER; }
    else if (SHOOT.has(event.code)) { if (!event.repeat) actions |= ACTION_SHOOT; }
    else if (MUTE.has(event.code)) { if (!event.repeat) actions |= ACTION_MUTE; }
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.brake = true;
    else return;
    event.preventDefault();
  }
  function keyup(event) {
    if (FORWARD.has(event.code)) held.forward = false;
    else if (BACK.has(event.code)) held.back = false;
    else if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.brake = false;
  }
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', () => {
    held.forward = held.back = held.left = held.right = held.brake = false;
  });
  target.addEventListener('pointerdown', (event) => {
    if (event.button === 0) actions |= ACTION_SHOOT;
    else actions |= ACTION_CONFIRM;
  });

  return {
    /** Steering vector: x = -1..1 (left/right), y = -1..1 (back/forward). */
    move() {
      return { x: (held.right ? 1 : 0) - (held.left ? 1 : 0), y: (held.forward ? 1 : 0) - (held.back ? 1 : 0) };
    },
    brake() { return held.brake; },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
