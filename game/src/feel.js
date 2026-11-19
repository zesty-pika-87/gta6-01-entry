// Feel: one job — the camera shake, the red hit flash and the speed vignette
// that make a crash feel like a crash. Pure numbers in, offsets out.
export function createFeel() {
  let shake = 0;
  let flash = 0;
  return {
    /** Add camera shake (0..1). */
    addShake(amount) {
      shake = Math.min(1, shake + amount);
    },
    /** Flash the red damage vignette. */
    addFlash() {
      flash = 1;
    },
    update(dt) {
      shake = Math.max(0, shake - dt * 1.8);
      flash = Math.max(0, flash - dt * 2.2);
    },
    /** Current random shake offset, scaled by remaining shake. */
    offset() {
      const s = shake * shake * 0.5;
      return { x: (Math.random() - 0.5) * s, y: (Math.random() - 0.5) * s };
    },
    flashLevel() {
      return flash;
    },
  };
}
