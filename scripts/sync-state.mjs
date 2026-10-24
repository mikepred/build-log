import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const SYNC_STATE_PATH = 'sync-state.json';

export function loadSyncState(filePath = SYNC_STATE_PATH) {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, 'utf8').trim();
  if (raw === '') return {};
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse ${filePath}: ${message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${filePath} must be an object keyed by entry slug.`);
  }
  return parsed;
}

/** Writes stable JSON. Returns false when the file would not change. */
export function saveSyncState(state, filePath = SYNC_STATE_PATH) {
  const text = `${JSON.stringify(orderState(state), null, 2)}\n`;
  const previous = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  if (previous === text) return false;
  writeFileSync(filePath, text);
  return true;
}

export function rememberRemote(state, slug, senderId, remote) {
  if (!remote?.id || !remote?.url) {
    throw new Error(`${senderId} did not return an id and url for ${slug}.`);
  }
  if (!state[slug] || typeof state[slug] !== 'object' || Array.isArray(state[slug])) {
    state[slug] = {};
  }
  state[slug][senderId] = { id: String(remote.id), url: String(remote.url) };
  return state;
}

function orderState(state) {
  const ordered = {};
  for (const slug of Object.keys(state).sort()) {
    const senders = state[slug];
    if (!senders || typeof senders !== 'object' || Array.isArray(senders)) continue;
    ordered[slug] = {};
    for (const senderId of Object.keys(senders).sort()) {
      const remote = senders[senderId];
      if (!remote?.id || !remote?.url) continue;
      ordered[slug][senderId] = { id: String(remote.id), url: String(remote.url) };
    }
  }
  return ordered;
}
