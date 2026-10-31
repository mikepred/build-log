#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

/**
 * Multi-Agent PR Review Dispatcher
 * Determines which agent(s) should review a PR based on:
 * 1. Explicit PR labels (e.g. `agent:antigravity`, `agent:claude`, `agent:all`)
 * 2. PR title/body tags (e.g. `[review:antigravity]`, `[review:all]`)
 * 3. Strategy setting (`all` for multi-agent panel, or `round-robin` for rotation)
 */

export function resolveReviewers({
  prNumber,
  labels = [],
  title = '',
  body = '',
  strategy = process.env.REVIEW_STRATEGY || 'all',
  activeAgents = (process.env.ACTIVE_AGENTS || 'claude,antigravity')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}) {
  const normLabels = (labels || [])
    .map(l => (typeof l === 'string' ? l : l.name || '').toLowerCase());

  // 1. Label override: `agent:all`
  if (normLabels.includes('agent:all')) {
    return {
      strategy: 'label-override',
      activeAgents,
      selectedAgents: activeAgents,
      reason: 'PR labeled agent:all'
    };
  }

  // 1b. Specific agent labels: `agent:antigravity`, `agent:claude`, etc.
  const explicitLabelAgents = activeAgents.filter(agent => normLabels.includes(`agent:${agent}`));
  if (explicitLabelAgents.length > 0) {
    return {
      strategy: 'label-override',
      activeAgents,
      selectedAgents: explicitLabelAgents,
      reason: `PR explicitly labeled: ${explicitLabelAgents.join(', ')}`
    };
  }

  // 2. Title / body text override
  const combinedText = `${title} ${body}`.toLowerCase();
  if (combinedText.includes('[review:all]')) {
    return {
      strategy: 'text-override',
      activeAgents,
      selectedAgents: activeAgents,
      reason: 'Found [review:all] in PR title or body'
    };
  }

  const explicitTextAgents = activeAgents.filter(agent =>
    combinedText.includes(`[review:${agent}]`)
  );
  if (explicitTextAgents.length > 0) {
    return {
      strategy: 'text-override',
      activeAgents,
      selectedAgents: explicitTextAgents,
      reason: `Found tag in PR text for: ${explicitTextAgents.join(', ')}`
    };
  }

  // 3. Round-Robin Strategy
  if (strategy === 'round-robin') {
    const prNum = parseInt(prNumber, 10);
    const validPrNum = Number.isInteger(prNum) && prNum > 0 ? prNum : 1;
    const index = (validPrNum - 1) % activeAgents.length;
    const chosen = activeAgents[index];

    return {
      strategy: 'round-robin',
      activeAgents,
      selectedAgents: [chosen],
      roundRobinIndex: index,
      reason: `Round-robin turn for PR #${validPrNum} (${chosen})`
    };
  }

  // 4. Default: Multi-model panel ('all')
  return {
    strategy: 'all',
    activeAgents,
    selectedAgents: activeAgents,
    reason: 'Multi-agent panel mode (all active agents review)'
  };
}

// CLI Execution support
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prArgIndex = process.argv.indexOf('--pr');
  const prNumber = prArgIndex !== -1 ? process.argv[prArgIndex + 1] : process.env.PR_NUMBER || '1';
  const strategyArgIndex = process.argv.indexOf('--strategy');
  const strategy = strategyArgIndex !== -1 ? process.argv[strategyArgIndex + 1] : process.env.REVIEW_STRATEGY || 'all';

  const result = resolveReviewers({ prNumber, strategy });
  console.log(JSON.stringify(result, null, 2));
}
