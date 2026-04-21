const assert = require('node:assert/strict');

const {
    buildColumnSequence,
    buildRewardMilestones,
    evaluateBoard,
    formatCountdown,
    formatThemeName,
    formatThemeTemplate,
    gameConfig,
    getActiveTheme,
    getDisplayedSpinResult,
    getDisplaySymbol,
    getExpectedLossPerSpin,
    getMilestoneReward,
    getNextThemeId,
    generateSpinBoard,
    getPayoutRules,
    getRewardProgressPercent,
    getSpinActionCost,
    getSpinFrameDelay,
    getSpinRunCount,
    getThemeIds,
    getRewardTierSeedTargets,
    getRewardWindowState,
    getVisibleRewardMilestones,
    resolveBatchCycleRewards,
    roundDownReward,
    setActiveTheme,
    symbolConfigs,
    simulateSpinBatch
} = require('./script.js');
const {
    defaultThemeId,
    getThemeDefinition,
    themeRegistry
} = require('./themes/theme-registry.js');

/**
 * Deterministic RNG used so payout distribution checks stay stable across test runs.
 *
 * @param {number} seed Starting unsigned integer seed.
 * @returns {() => number} Pseudo-random generator returning values in [0, 1).
 */
function createSeededRandom(seed) {
    let currentSeed = seed >>> 0;

    return function nextRandom() {
        currentSeed = (1664525 * currentSeed + 1013904223) >>> 0;
        return currentSeed / 0x100000000;
    };
}

// Theme packs should stay separate from payout math and remain switchable through the registry.
assert.equal(defaultThemeId, 'cosmic');
assert.ok(themeRegistry.nebula);
assert.ok(themeRegistry.classicCasino);
assert.ok(themeRegistry.arcadeNeon);
assert.ok(themeRegistry.minimalClean);
assert.deepEqual(getThemeIds(), ['cosmic', 'nebula', 'classicCasino', 'arcadeNeon', 'minimalClean']);
assert.equal(getThemeDefinition('missing-theme').id, defaultThemeId);
assert.equal(getActiveTheme().id, defaultThemeId);
assert.equal(formatThemeName('classicCasino'), 'Classic Casino');
assert.equal(getNextThemeId('cosmic'), 'nebula');
assert.equal(getNextThemeId('minimalClean'), 'cosmic');
assert.equal(getDisplaySymbol('📈'), '🌑');
assert.equal(formatThemeTemplate('Spin {count}', { count: 10 }), 'Spin 10');
assert.equal(getPayoutRules()[0].detail, 'Planet line bonus');
setActiveTheme('nebula');
assert.equal(getActiveTheme().id, 'nebula');
assert.equal(getDisplaySymbol('📈'), '☄️');
assert.equal(getPayoutRules()[0].detail, 'Orbital line bonus');
setActiveTheme('classicCasino');
assert.equal(getActiveTheme().id, 'classicCasino');
assert.equal(getDisplaySymbol('📈'), '🍒');
assert.equal(getDisplaySymbol('🚀'), '7️⃣');
assert.equal(getPayoutRules()[0].detail, 'Star line bonus');
assert.equal(getPayoutRules()[1].label, '7️⃣7️⃣7️⃣ on any line');
setActiveTheme('arcadeNeon');
assert.equal(getActiveTheme().id, 'arcadeNeon');
assert.equal(getDisplaySymbol('📈'), '👾');
assert.equal(getDisplaySymbol('💎'), '🌟');
assert.equal(getPayoutRules()[0].detail, 'Glitch star line bonus');
assert.equal(getPayoutRules()[0].label, '🌟🌟🌟 on any line');
setActiveTheme('minimalClean');
assert.equal(getActiveTheme().id, 'minimalClean');
assert.equal(getDisplaySymbol('📈'), '○');
assert.equal(getDisplaySymbol('💎'), '✦');
assert.equal(getPayoutRules()[0].detail, 'Star line bonus');
assert.equal(getPayoutRules()[0].label, '✦✦✦ on any line');
setActiveTheme(defaultThemeId);

// Premium rules shown in the active UI theme should line up with the configured bonus values.
const payoutRules = getPayoutRules();
assert.equal(payoutRules.length, 5);
assert.equal(payoutRules[0].label, '🪐🪐🪐 on any line');
assert.equal(payoutRules[0].payout, 20);
assert.equal(payoutRules[1].payout, 110);
assert.equal(payoutRules[2].payout, 300);
assert.equal(payoutRules[3].payout, 10000);
assert.equal(payoutRules[4].payout, 50000);

// Small hidden symbol credits should remain available across the payout range.
assert.equal(symbolConfigs[0].credit, 2);
assert.equal(symbolConfigs[symbolConfigs.length - 1].credit, 8);

// Timed ladder rewards should be priced from the configured expected loss and expanding gaps.
assert.equal(getExpectedLossPerSpin(gameConfig), 5);
assert.deepEqual(getRewardTierSeedTargets(gameConfig), [25, 50, 85]);
assert.deepEqual(
    buildRewardMilestones({ minCount: 8 }, gameConfig).map(milestone => milestone.targetSpins),
    [25, 50, 85, 130, 185, 250, 325, 410]
);
assert.deepEqual(
    buildRewardMilestones({ minCount: 8 }, gameConfig).map(milestone => milestone.reward),
    [105, 105, 145, 190, 230, 275, 315, 360]
);
assert.equal(getMilestoneReward(85, gameConfig), 145);
assert.equal(buildRewardMilestones({ minCount: 8 }, gameConfig).some(milestone => milestone.isLongShot), false);
assert.ok(Math.abs(getRewardProgressPercent(7, gameConfig) - 28) < 1e-9);
assert.deepEqual(
    getVisibleRewardMilestones(60, gameConfig).map(milestone => milestone.targetSpins),
    [50, 85, 130, 185, 250]
);
assert.equal(roundDownReward(53.8), 50);
assert.equal(roundDownReward(212.7), 210);
assert.equal(getSpinRunCount(false, gameConfig), 1);
assert.equal(getSpinRunCount(true, gameConfig), 10);
assert.equal(getSpinActionCost(10, gameConfig), 500);
assert.equal(getSpinFrameDelay(0, 20, false, false, gameConfig), 90);
assert.equal(getSpinFrameDelay(6, 20, false, true, gameConfig), 45);
assert.equal(getSpinFrameDelay(0, 20, true, false, gameConfig), 12.5);
assert.deepEqual(
    getRewardWindowState(0, 301000, gameConfig),
    {
        completedWindows: 1,
        currentWindowStartedAt: 300000,
        elapsedInWindowMs: 1000,
        remainingMs: 299000
    }
);
assert.equal(formatCountdown(299000), '4:59');

// Once the visible ladder has settled into capped 100-spin gaps, a rare long-shot tier can appear.
const longShotConfig = {
    ...gameConfig,
    rewardTierSeedTargets: [100, 200],
    rewardTierGapGrowth: 0,
    rewardTierGapCap: 100,
    visibleRewardMilestoneCount: 2,
    longShotMilestoneChance: 1,
    longShotMilestoneGap: 250
};
const longShotMilestones = buildRewardMilestones({ minCount: 4 }, longShotConfig);
assert.deepEqual(
    longShotMilestones.map(milestone => milestone.targetSpins),
    [100, 200, 450, 550]
);
assert.equal(longShotMilestones[2].isLongShot, true);
assert.equal(longShotMilestones[2].reward, 1060);
assert.deepEqual(
    getVisibleRewardMilestones(205, longShotConfig).map(milestone => milestone.targetSpins),
    [200, 450]
);

// Timed ladder rewards should advance correctly across a 10-spin batch.
const wrappedCycleRewards = resolveBatchCycleRewards(20, 10, gameConfig);
assert.equal(wrappedCycleRewards.rewardWindowSpinCount, 30);
assert.equal(wrappedCycleRewards.totalReward, 105);
assert.equal(wrappedCycleRewards.milestoneHits.length, 1);
assert.equal(wrappedCycleRewards.milestoneHits[0].targetSpins, 25);

const longShotCycleRewards = resolveBatchCycleRewards(440, 15, longShotConfig);
assert.equal(longShotCycleRewards.rewardWindowSpinCount, 455);
assert.equal(longShotCycleRewards.totalReward, 1060);
assert.equal(longShotCycleRewards.milestoneHits.length, 1);
assert.equal(longShotCycleRewards.milestoneHits[0].targetSpins, 450);
assert.equal(longShotCycleRewards.milestoneHits[0].isLongShot, true);

// A premium diamond line should register as a completed line plus its premium bonus.
const diamondLineBoard = ['💎', '💎', '💎', '📈', '🔮', '🎰', '💸', '💰', '📈'];
const diamondEvaluation = evaluateBoard(diamondLineBoard);
assert.equal(diamondEvaluation.premiumBonuses, 20);
assert.equal(diamondEvaluation.fullLines, 1);

// An all-rocket board should trigger both rocket bonuses and the mega jackpot.
const jackpotBoard = Array(9).fill('🚀');
const jackpotEvaluation = evaluateBoard(jackpotBoard);
assert.equal(jackpotEvaluation.rocketClusterHit, true);
assert.equal(jackpotEvaluation.rocketStormHit, true);
assert.equal(jackpotEvaluation.megaJackpotHit, true);
assert.ok(jackpotEvaluation.payout > 50000);

// Column animation should settle exactly on the predetermined final symbols.
const continuitySequence = buildColumnSequence(['A', 'B', 'C'], ['X', 'Y', 'Z'], 6, createSeededRandom(42));
assert.deepEqual(continuitySequence[continuitySequence.length - 1], ['X', 'Y', 'Z']);

// Batch simulation should return both the true aggregate result and the highlighted display spin.
const batchResult = simulateSpinBatch(10, 18, createSeededRandom(2026), gameConfig);
assert.equal(batchResult.spinResults.length, 10);
assert.ok(batchResult.totalReward >= batchResult.totalSpinPayout);
assert.equal(batchResult.ladderRewardTotal, 105);
assert.equal(
    batchResult.bestSpin.totalReward,
    Math.max(...batchResult.spinResults.map(spin => spin.totalReward))
);
assert.equal(getDisplayedSpinResult(batchResult, true), batchResult.bestSpin);
assert.equal(getDisplayedSpinResult(batchResult, false), batchResult.finalSpin);

// Distribution checks keep the long-run economy near the current intended tuning.
const seededRandom = createSeededRandom(123456);
let sum = 0;
let sumSq = 0;
let aboveFiftyFive = 0;
let aboveOneHundred = 0;
let belowFifty = 0;

for (let index = 0; index < 25000; index += 1) {
    const spinResult = generateSpinBoard(seededRandom);
    const payout = spinResult.evaluation.payout;

    sum += payout;
    sumSq += payout * payout;

    if (payout > 55) {
        aboveFiftyFive += 1;
    }

    if (payout > 100) {
        aboveOneHundred += 1;
    }

    if (payout < 50) {
        belowFifty += 1;
    }

    assert.ok(payout >= 0);
    assert.equal(Number.isInteger(payout), true);
}

const mean = sum / 25000;
const variance = sumSq / 25000 - mean * mean;

assert.ok(mean > 44 && mean < 46.5);
assert.ok(variance > 90 && variance < 250);
assert.ok(aboveFiftyFive / 25000 > 0.07);
assert.ok(aboveFiftyFive / 25000 < 0.12);
assert.ok(aboveOneHundred / 25000 > 0.001);
assert.ok(belowFifty / 25000 > 0.7);

console.log('payout-rules.test.js passed');
