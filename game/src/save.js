// Save: one job — persist Solara Bay progress (money, missions finished, best
// run) in localStorage, and read it back. Storage can be off; then progress
// lasts this visit only and nothing throws.
import { SAVE_KEY } from './config.js';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Private windows and disabled storage: the save is skipped silently.
  }
}
