import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveReviewers } from './dispatcher.mjs';

test('dispatcher: defaults to all active agents in all mode', () => {
  const result = resolveReviewers({
    prNumber: 1,
    strategy: 'all',
    activeAgents: ['claude', 'antigravity']
  });

  assert.equal(result.strategy, 'all');
  assert.deepEqual(result.selectedAgents, ['claude', 'antigravity']);
});

test('dispatcher: round-robin rotates by PR number', () => {
  const activeAgents = ['claude', 'antigravity'];

  const pr1 = resolveReviewers({ prNumber: 1, strategy: 'round-robin', activeAgents });
  assert.equal(pr1.strategy, 'round-robin');
  assert.deepEqual(pr1.selectedAgents, ['claude']);

  const pr2 = resolveReviewers({ prNumber: 2, strategy: 'round-robin', activeAgents });
  assert.deepEqual(pr2.selectedAgents, ['antigravity']);

  const pr3 = resolveReviewers({ prNumber: 3, strategy: 'round-robin', activeAgents });
  assert.deepEqual(pr3.selectedAgents, ['claude']);
});

test('dispatcher: respects explicit agent labels over round-robin', () => {
  const result = resolveReviewers({
    prNumber: 1, // Would be claude in round-robin
    strategy: 'round-robin',
    labels: [{ name: 'agent:antigravity' }],
    activeAgents: ['claude', 'antigravity']
  });

  assert.equal(result.strategy, 'label-override');
  assert.deepEqual(result.selectedAgents, ['antigravity']);
});

test('dispatcher: respects [review:all] in PR title/body', () => {
  const result = resolveReviewers({
    prNumber: 1,
    strategy: 'round-robin',
    title: 'New feature [review:all]',
    activeAgents: ['claude', 'antigravity']
  });

  assert.equal(result.strategy, 'text-override');
  assert.deepEqual(result.selectedAgents, ['claude', 'antigravity']);
});
