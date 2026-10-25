import { readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { changedEntryPaths, entryFromFile } from './entry.mjs';
import { ScriptError } from './errors.mjs';
import { loadSyncState, rememberRemote, saveSyncState } from './sync-state.mjs';

const USAGE = `Usage: node scripts/crosspost.mjs [--dry-run] [content/YYYY-MM-DD-slug.md ...]

With no file arguments, changed entry files are taken from git diff
BEFORE_SHA...GITHUB_SHA (set by the GitHub Actions workflow).
A BEFORE_SHA of all zeros lists every entry file at GITHUB_SHA.

--dry-run plans every sender and prints the requests. It does not use the network
and does not write sync-state.json.

A sender is skipped when its secret is missing. If every sender is skipped, the
process warns and exits 0.`;

/**
 * Sender files in scripts/senders export:
 *   id: string
 *   disabledReason(): string | null
 *   plan(entry, previous): { operation, request, notes }
 *   publish({ entry, previous }): Promise<{ id, url, action } | { failed: true }>
 * plan must not use the network. A sender that returns { failed: true } is logged
 * by that sender and does not fail the run or write sync-state.
 */
async function loadSenders() {
  const directory = fileURLToPath(new URL('./senders/', import.meta.url));
  const files = readdirSync(directory)
    .filter((name) => name.endsWith('.mjs'))
    .sort();
  const senders = [];
  for (const file of files) {
    const loaded = await import(pathToFileURL(join(directory, file)).href);
    if (typeof loaded.id !== 'string' || loaded.id.trim() === '') {
      throw new ScriptError(`${file} must export a string id.`);
    }
    for (const key of ['disabledReason', 'plan', 'publish']) {
      if (typeof loaded[key] !== 'function') {
        throw new ScriptError(`${file} must export ${key}().`);
      }
    }
    if (senders.some((sender) => sender.id === loaded.id)) {
      throw new ScriptError(`Two senders use the id "${loaded.id}".`);
    }
    senders.push(loaded);
  }
  return senders;
}

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const fileArgs = argv.filter((arg) => arg !== '--dry-run');
  const unknown = fileArgs.filter((arg) => arg.startsWith('--'));
  if (unknown.length > 0) {
    throw new ScriptError(`Unknown argument ${unknown[0]}.\n\n${USAGE}`);
  }
  return { dryRun, fileArgs };
}

function resolveFiles(fileArgs) {
  if (fileArgs.length > 0) return fileArgs;
  const before = process.env.BEFORE_SHA ?? '';
  const after = process.env.GITHUB_SHA ?? '';
  if (!before || !after) {
    throw new ScriptError(`Pass entry files, or set BEFORE_SHA and GITHUB_SHA.\n\n${USAGE}`);
  }
  return changedEntryPaths(before, after);
}

function previousFor(state, slug, senderId) {
  const remote = state[slug]?.[senderId];
  if (!remote?.id) return null;
  return { id: String(remote.id), url: remote.url ? String(remote.url) : '' };
}

async function main() {
  const { dryRun, fileArgs } = parseArgs(process.argv.slice(2));
  const senders = await loadSenders();
  const enabled = [];
  for (const sender of senders) {
    const reason = sender.disabledReason();
    if (!dryRun && reason) {
      console.warn(`::warning::${reason}`);
      continue;
    }
    enabled.push(sender);
  }

  if (!dryRun && enabled.length === 0) return;

  const files = resolveFiles(fileArgs);
  if (files.length === 0) {
    console.warn('No content entries to cross-post.');
    if (dryRun) console.log('[]');
    return;
  }

  const entries = files.map((file) => entryFromFile(file));
  const state = loadSyncState();

  if (dryRun) {
    const preview = entries.map((entry) => ({
      file: entry.file,
      slug: entry.slug,
      senders: Object.fromEntries(
        senders.map((sender) => {
          const planned = sender.plan(entry, previousFor(state, entry.slug, sender.id));
          if (planned.notes?.length) {
            console.warn(`${entry.file} ${sender.id}: ${planned.notes.join('; ')}`);
          }
          return [sender.id, { operation: planned.operation, request: planned.request }];
        }),
      ),
    }));
    console.log(JSON.stringify(preview, null, 2));
    return;
  }

  const failures = [];
  for (const entry of entries) {
    for (const sender of enabled) {
      const planned = sender.plan(entry, previousFor(state, entry.slug, sender.id));
      if (planned.notes?.length) {
        console.warn(`${entry.file} ${sender.id}: ${planned.notes.join('; ')}`);
      }
      try {
        const remote = await sender.publish({
          entry,
          previous: previousFor(state, entry.slug, sender.id),
        });
        if (remote?.failed) continue;
        rememberRemote(state, entry.slug, sender.id, remote);
        saveSyncState(state);
        const verb = remote.action === 'create' ? 'Created' : 'Updated';
        console.log(`${verb} ${sender.id} ${remote.id} from ${entry.file} (${remote.url}).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${sender.id} ${entry.file}: ${message}`);
        console.error(`${sender.id} ${entry.file}: ${message}`);
      }
    }
  }

  if (failures.length > 0) {
    throw new ScriptError(`${failures.length} cross-post send failed.`);
  }
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(realpathSync(entry)).href;
}

if (isDirectRun()) {
  main().catch((error) => {
    if (error instanceof ScriptError) console.error(error.message);
    else console.error(error);
    process.exitCode = 1;
  });
}
