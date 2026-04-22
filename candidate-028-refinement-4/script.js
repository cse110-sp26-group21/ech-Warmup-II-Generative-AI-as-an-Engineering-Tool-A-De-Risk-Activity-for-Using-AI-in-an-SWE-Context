/*
 * AI Token Roulette architecture overview:
 * - The board is a 3x3 grid represented as a flat array of 9 symbols.
 * - Each symbol contributes a small base credit so nearly every board pays something back.
 * - Matching adjacent symbols and full paylines stack extra bonuses on top of those base credits.
 * - Rare premium patterns add the largest boosts, which keeps the game volatile without exposing
 *   all of the internal payout math in the UI.
 * - A timed reward ladder grants extra tokens at expanding spin thresholds within a visible
 *   five-minute window, then resets cleanly with a countdown timer.
 * - Optional batch mode can resolve ten spins at once, apply all ten payouts and ladder rewards,
 *   and then highlight the strongest single spin while still reporting the true batch total.
 * - Frontend theme packs own colors, copy, idle boards, and display emoji, while the payout engine
 *   continues to score stable internal symbol ids.
 * - The spin outcome is generated before animation starts; the reel animation then reveals that
 *   predetermined board by shifting each column downward so the motion looks continuous.
 */

// Central symbol tuning table used for both weighted generation and hidden per-symbol credits.
const symbolConfigs = [
    { symbol: '📈', credit: 2, weight: 25 },
    { symbol: '🔮', credit: 3, weight: 20 },
    { symbol: '🎰', credit: 4, weight: 17 },
    { symbol: '💸', credit: 4, weight: 14 },
    { symbol: '💰', credit: 5, weight: 10 },
    { symbol: '💎', credit: 7, weight: 8 },
    { symbol: '🚀', credit: 8, weight: 6 }
];

// Symbol-only lookup used by the reel animation when it needs filler inserts.
const symbols = symbolConfigs.map(config => config.symbol);
const fallbackThemeDefinition = Object.freeze({
    id: 'cosmic',
    stylesheetHref: 'themes/cosmic.css',
    copy: Object.freeze({
        pageTitle: 'Token Roulette',
        heading: 'Token Roulette',
        tagline: 'Theme pack unavailable.',
        footer: 'A themed simulator for AI inference.',
        spinLabel: 'SPIN',
        idleStatus: 'Ready to play!',
        singleScan: 'Scanning the board...',
        batchScanTemplate: 'Simulating {count} spins...',
        rulesSummary: 'Small symbol credits and regular line links are applied automatically. Premium wins below.'
    }),
    payoutRuleDetails: Object.freeze({
        premiumLine: 'Premium line bonus',
        jackpotLine: 'Jackpot line bonus',
        rocketCluster: 'Rocket cluster bonus',
        rocketStorm: 'Meteor jackpot bonus',
        fullRocket: 'Mega jackpot bonus'
    }),
    displaySymbols: Object.freeze({}),
    idleBoard: Object.freeze(['📈', '🔮', '🎰', '💸', '💰', '💎', '📈', '🔮', '🚀'])
});
const themeRegistryModule = (() => {
    if (typeof module !== 'undefined' && module.exports) {
        return require('./themes/theme-registry.js');
    }

    if (typeof globalThis !== 'undefined' && globalThis.slotThemeRegistry) {
        return globalThis.slotThemeRegistry;
    }

    return {
        defaultThemeId: fallbackThemeDefinition.id,
        getThemeDefinition: () => fallbackThemeDefinition,
        themeRegistry: {
            [fallbackThemeDefinition.id]: fallbackThemeDefinition
        }
    };
})();
const { defaultThemeId, getThemeDefinition, themeRegistry } = themeRegistryModule;

// Every line that can score a three-of-a-kind on the 3x3 board.
const paylines = [
    { label: 'Top Row', cells: [0, 1, 2], type: 'row' },
    { label: 'Middle Row', cells: [3, 4, 5], type: 'row' },
    { label: 'Bottom Row', cells: [6, 7, 8], type: 'row' },
    { label: 'Left Column', cells: [0, 3, 6], type: 'column' },
    { label: 'Middle Column', cells: [1, 4, 7], type: 'column' },
    { label: 'Right Column', cells: [2, 5, 8], type: 'column' },
    { label: 'Main Diagonal', cells: [0, 4, 8], type: 'diagonal' },
    { label: 'Counter Diagonal', cells: [2, 4, 6], type: 'diagonal' }
];

// Primary economy and bonus tuning values for the slot machine.
const gameConfig = {
    startingTokens: 100000,
    spinCost: 50,
    expectedPayoutPerSpin: 45,
    rakebackCap: 0.85,
    rewardTierSeedTargets: [25, 50, 85],
    rewardTierGapGrowth: 10,
    rewardTierGapCap: 100,
    longShotMilestoneChance: 0.1,
    longShotMilestoneGap: 250,
    rewardWindowDurationMs: 5 * 60 * 1000,
    visibleRewardMilestoneCount: 5,
    batchSpinCount: 10,
    defaultSpinTickDelay: 90,
    stopSpinTickDelay: 45,
    quickSpinDuration: 250,
    pairMatchBonus: 3,
    rowTripleBonus: 7,
    diagonalTripleBonus: 10,
    premiumLineBonuses: {
        '💎': 20,
        '🚀': 110
    },
    rocketClusterThreshold: 5,
    rocketClusterBonus: 300,
    rocketStormThreshold: 6,
    rocketStormBonus: 10000,
    fullRocketBonus: 50000
};

// Cached lookup structures so evaluation can stay simple during each spin.
const symbolCreditMap = Object.fromEntries(
    symbolConfigs.map(config => [config.symbol, config.credit])
);
const totalSymbolWeight = symbolConfigs.reduce(
    (total, config) => total + config.weight,
    0
);

// Mutable runtime state for the current play session.
let tokens = gameConfig.startingTokens;
let lifetimeSpinCount = 0;
let rewardWindowSpinCount = 0;
let rewardWindowStartedAt = Date.now();
let isSpinning = false;
let stopRequested = false;
let quickSpinEnabled = false;
let batchSpinEnabled = false;
let showBestBatchSpin = true;
let rewardWindowTimerId = null;

// DOM access is guarded so the same file can be imported into Node-based tests.
const hasDocument = typeof document !== 'undefined';
const spinBtn = hasDocument ? document.getElementById('spin-button') : null;
const stopBtn = hasDocument ? document.getElementById('stop-button') : null;
const resetBtn = hasDocument ? document.getElementById('reset-button') : null;
const quickSpinToggle = hasDocument ? document.getElementById('quick-spin-toggle') : null;
const batchSpinToggle = hasDocument ? document.getElementById('batch-spin-toggle') : null;
const bestSpinToggle = hasDocument ? document.getElementById('best-spin-toggle') : null;
const balanceDisplay = hasDocument ? document.getElementById('token-balance') : null;
const lifetimeSpinDisplay = hasDocument ? document.getElementById('lifetime-spin-count') : null;
const logDisplay = hasDocument ? document.getElementById('status-log') : null;
const payoutDisplay = hasDocument ? document.getElementById('payout-msg') : null;
const payoutRulesBody = hasDocument ? document.getElementById('payout-rules') : null;
const rulesSummary = hasDocument ? document.getElementById('rules-summary') : null;
const focusOverlay = hasDocument ? document.getElementById('focus-overlay') : null;
const themeStylesheet = hasDocument ? document.getElementById('theme-stylesheet') : null;
const appTitle = hasDocument ? document.getElementById('app-title') : null;
const appTagline = hasDocument ? document.getElementById('app-tagline') : null;
const themeCycleBtn = hasDocument ? document.getElementById('theme-cycle-button') : null;
const footerCopy = hasDocument ? document.getElementById('footer-copy') : null;
const progressTrack = hasDocument ? document.getElementById('progress-track') : null;
const progressFill = hasDocument ? document.getElementById('progress-fill') : null;
const progressMilestones = hasDocument ? document.getElementById('progress-milestones') : null;
const progressSummary = hasDocument ? document.getElementById('progress-summary') : null;
const progressTimer = hasDocument ? document.getElementById('progress-timer') : null;
const reels = hasDocument ? Array.from(document.querySelectorAll('.reel')) : [];
let activeTheme = getThemeDefinition(
    hasDocument ? document.body.dataset.theme || defaultThemeId : defaultThemeId
);

/**
 * Pause execution for a short duration so the reel animation can step over time.
 *
 * @param {number} duration Milliseconds to wait before resolving.
 * @returns {Promise<void>} Promise that resolves after the requested delay.
 */
function wait(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Snap any payout value to the nearest whole token.
 *
 * The helper name is kept for compatibility with earlier tests and imports.
 *
 * @param {number} value Raw payout value.
 * @returns {number} Rounded value in whole-token increments.
 */
function roundToNickel(value) {
    return Math.round(value);
}

/**
 * Format token values for display while avoiding noisy trailing zeroes.
 *
 * @param {number} value Token amount to display.
 * @returns {string} Human-friendly token value.
 */
function formatTokenValue(value) {
    const roundedValue = roundToNickel(value);
    return roundedValue.toLocaleString();
}

/**
 * Fill placeholder tokens inside theme-managed copy templates.
 *
 * @param {string} template Theme copy template that may include `{key}` placeholders.
 * @param {Record<string, string | number>} replacements Values to inject into the template.
 * @returns {string} Formatted theme copy string.
 */
function formatThemeTemplate(template, replacements = {}) {
    return template.replace(/\{(\w+)\}/g, (match, key) => (
        Object.prototype.hasOwnProperty.call(replacements, key) ? String(replacements[key]) : match
    ));
}

/**
 * Return the currently active frontend theme definition.
 *
 * @returns {typeof fallbackThemeDefinition} Active theme metadata.
 */
function getActiveTheme() {
    return activeTheme;
}

/**
 * Return the available frontend theme identifiers in stable registry order.
 *
 * @returns {string[]} Registered theme identifiers.
 */
function getThemeIds() {
    return Object.keys(themeRegistry);
}

/**
 * Convert a theme identifier into a compact human-readable label for the UI button.
 *
 * @param {string} themeId Theme identifier from the registry.
 * @returns {string} Human-friendly theme name.
 */
function formatThemeName(themeId) {
    return themeId
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, firstCharacter => firstCharacter.toUpperCase());
}

/**
 * Resolve which theme should come next when cycling through the available theme packs.
 *
 * @param {string} currentThemeId Currently active theme identifier.
 * @returns {string} Next theme identifier in registry order.
 */
function getNextThemeId(currentThemeId) {
    const themeIds = getThemeIds();

    if (themeIds.length === 0) {
        return defaultThemeId;
    }

    const currentThemeIndex = themeIds.indexOf(currentThemeId);
    const nextThemeIndex = currentThemeIndex === -1
        ? 0
        : (currentThemeIndex + 1) % themeIds.length;

    return themeIds[nextThemeIndex];
}

/**
 * Sync the theme-cycle button label, tooltip, and disabled state.
 *
 * @returns {void}
 */
function updateThemeCycleButton() {
    if (!themeCycleBtn) return;

    const themeIds = getThemeIds();
    const currentThemeName = formatThemeName(activeTheme.id);
    const nextThemeName = formatThemeName(getNextThemeId(activeTheme.id));
    const hasMultipleThemes = themeIds.length > 1;

    themeCycleBtn.textContent = `Switch Theme: ${currentThemeName}`;
    themeCycleBtn.disabled = isSpinning || !hasMultipleThemes;
    themeCycleBtn.setAttribute(
        'aria-label',
        hasMultipleThemes
            ? `Switch theme. Current theme ${currentThemeName}. Next theme ${nextThemeName}.`
            : `Current theme ${currentThemeName}.`
    );
    themeCycleBtn.title = hasMultipleThemes
        ? `Next: ${nextThemeName}`
        : currentThemeName;
}

/**
 * Translate an internal symbol key into the active theme emoji shown in the UI.
 *
 * The payout engine continues to work with the original symbol ids so the backend logic stays
 * presentation-agnostic.
 *
 * @param {string} symbol Internal symbol identifier used by the game engine.
 * @returns {string} Player-facing emoji for the current theme.
 */
function getDisplaySymbol(symbol) {
    return activeTheme.displaySymbols[symbol] || symbol;
}

/**
 * Build a repeated display label for paytable rows such as three matching planets on a line.
 *
 * @param {string} symbol Internal symbol identifier used by the game engine.
 * @param {number} count Number of matching symbols to show.
 * @returns {string} Concatenated themed emoji label.
 */
function getRepeatedDisplaySymbol(symbol, count) {
    return Array.from({ length: count }, () => getDisplaySymbol(symbol)).join('');
}

/**
 * Apply theme-owned copy and stylesheet pointers to the document.
 *
 * @param {typeof fallbackThemeDefinition} theme Theme definition to activate in the UI.
 * @param {{
 *   overwriteStatus?: boolean,
 *   syncBoard?: boolean
 * }} [options={}] Optional UI sync behavior for the current board and status text.
 * @returns {void}
 */
function applyThemeToDocument(theme, options = {}) {
    const { overwriteStatus = false, syncBoard = false } = options;

    if (!hasDocument) return;

    document.body.dataset.theme = theme.id;

    if (themeStylesheet) {
        themeStylesheet.setAttribute('href', theme.stylesheetHref);
    }

    document.title = theme.copy.pageTitle;

    if (appTitle) {
        appTitle.textContent = theme.copy.heading;
    }

    if (appTagline) {
        appTagline.textContent = theme.copy.tagline;
    }

    if (footerCopy) {
        footerCopy.textContent = theme.copy.footer;
    }

    if (reels.length > 0) {
        const boardToDisplay = syncBoard ? theme.idleBoard : getVisibleBoard();
        setVisibleBoard(boardToDisplay);
    }

    if (overwriteStatus && logDisplay) {
        logDisplay.textContent = theme.copy.idleStatus;
    }

    renderPayoutRules();
}

/**
 * Switch the active frontend theme while preserving the backend payout logic.
 *
 * @param {string} themeId Requested theme identifier.
 * @param {{
 *   overwriteStatus?: boolean,
 *   syncBoard?: boolean
 * }} [options={}] Optional UI sync behavior for the current board and status text.
 * @returns {typeof fallbackThemeDefinition} Activated theme definition.
 */
function setActiveTheme(themeId, options = {}) {
    activeTheme = getThemeDefinition(themeId);
    applyThemeToDocument(activeTheme, options);

    if (hasDocument) {
        updateDisplay();
    }

    return activeTheme;
}

/**
 * Calculate the configured expected loss per spin that milestone rewards reference.
 *
 * @param {{
 *   spinCost: number,
 *   expectedPayoutPerSpin: number
 * }} [config=gameConfig] Economy config containing spin cost and expected payout.
 * @returns {number} Non-negative expected loss per spin.
 */
function getExpectedLossPerSpin(config = gameConfig) {
    return Math.max(0, config.spinCost - config.expectedPayoutPerSpin);
}

/**
 * Return the sorted seed targets that define the opening shape of the timed reward ladder.
 *
 * @param {{
 *   rewardTierSeedTargets: number[]
 * }} [config=gameConfig] Config containing the seed milestone targets.
 * @returns {number[]} Validated seed targets in ascending order.
 */
function getRewardTierSeedTargets(config = gameConfig) {
    return [...config.rewardTierSeedTargets]
        .filter(target => target > 0)
        .sort((firstTarget, secondTarget) => firstTarget - secondTarget)
        .filter((target, targetIndex, targets) => targetIndex === 0 || target > targets[targetIndex - 1]);
}

/**
 * Convert a deterministic integer seed into a stable pseudo-random roll in [0, 1).
 *
 * This keeps long-shot milestone generation consistent across renders without needing mutable RNG state.
 *
 * @param {number} seedValue Integer seed describing one candidate milestone.
 * @returns {number} Deterministic pseudo-random roll in [0, 1).
 */
function getDeterministicMilestoneRoll(seedValue) {
    let state = seedValue >>> 0;
    state ^= state >>> 16;
    state = Math.imul(state, 0x7feb352d) >>> 0;
    state ^= state >>> 15;
    state = Math.imul(state, 0x846ca68b) >>> 0;
    state ^= state >>> 16;
    return state / 0x100000000;
}

/**
 * Decide whether the next capped reward tier should expand into a rarer 250-spin long-shot milestone.
 *
 * The long-shot tier only becomes eligible once the visible ladder has settled into repeated capped
 * 100-spin gaps, which keeps the special target feeling like a late-track stretch goal.
 *
 * @param {number} cappedGapStreak Number of consecutive capped-size milestones already on the ladder.
 * @param {number} lastTarget Most recent milestone target before the candidate tier.
 * @param {number} nextTierIndex Zero-based index the candidate milestone would occupy.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with ladder settings.
 * @returns {boolean} Whether the next generated tier should use the long-shot gap.
 */
function shouldUseLongShotMilestone(cappedGapStreak, lastTarget, nextTierIndex, config = gameConfig) {
    if (config.longShotMilestoneChance <= 0) {
        return false;
    }

    if (config.longShotMilestoneGap <= config.rewardTierGapCap) {
        return false;
    }

    if (cappedGapStreak < config.visibleRewardMilestoneCount) {
        return false;
    }

    const seedValue = (lastTarget + Math.imul(nextTierIndex + 1, 2654435761)) >>> 0;
    return getDeterministicMilestoneRoll(seedValue) < config.longShotMilestoneChance;
}

/**
 * Return the reward rounding step used across the milestone ladder.
 *
 * @param {number} value Raw reward value.
 * @returns {number} Step size used when rounding rewards.
 */
function getRewardRoundingStep(value) {
    return 5;
}

/**
 * Round milestone rewards down to the nearest configured step size.
 *
 * @param {number} value Raw milestone reward.
 * @returns {number} Rounded reward.
 */
function roundDownReward(value) {
    const roundingStep = getRewardRoundingStep(value);
    return Math.floor(Math.max(0, value) / roundingStep) * roundingStep;
}

/**
 * Build enough reward ladder milestones to cover the requested counts or target spin threshold.
 *
 * The configured seed targets define the early ladder shape. After the seed list is exhausted, the
 * gap between rewards increases by a fixed step until it reaches the configured maximum gap.
 *
 * @param {{
 *   minCount?: number,
 *   minTarget?: number
 * }} [options={}] Minimum ladder size or target spin threshold to cover.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder settings.
 * @returns {Array<{targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean}>} Reward milestones.
 */
function buildRewardMilestones(options = {}, config = gameConfig) {
    const { minCount = 0, minTarget = 0 } = options;
    const seedTargets = getRewardTierSeedTargets(config);

    if (seedTargets.length === 0) {
        return [];
    }

    const targets = [...seedTargets];
    const requiredCount = Math.max(minCount, seedTargets.length);
    let cappedGapStreak = 0;

    targets.forEach((targetSpins, tierIndex) => {
        const previousTarget = tierIndex === 0 ? 0 : targets[tierIndex - 1];
        const milestoneSpan = targetSpins - previousTarget;
        cappedGapStreak = milestoneSpan === config.rewardTierGapCap ? cappedGapStreak + 1 : 0;
    });

    while (targets.length < requiredCount || targets[targets.length - 1] < minTarget) {
        const lastTarget = targets[targets.length - 1];
        const previousTarget = targets.length === 1 ? 0 : targets[targets.length - 2];
        const lastGap = lastTarget - previousTarget;
        let nextGap = Math.min(config.rewardTierGapCap, lastGap + config.rewardTierGapGrowth);

        if (shouldUseLongShotMilestone(cappedGapStreak, lastTarget, targets.length, config)) {
            nextGap = config.longShotMilestoneGap;
        }

        targets.push(lastTarget + nextGap);
        cappedGapStreak = nextGap === config.rewardTierGapCap ? cappedGapStreak + 1 : 0;
    }

    return targets.map((targetSpins, tierIndex) => {
        const previousTarget = tierIndex === 0 ? 0 : targets[tierIndex - 1];
        const milestoneSpan = targetSpins - previousTarget;

        return {
            targetSpins,
            reward: roundDownReward(
                milestoneSpan * getExpectedLossPerSpin(config) * config.rakebackCap
            ),
            milestoneSpan,
            tierIndex,
            isLongShot: milestoneSpan > config.rewardTierGapCap
        };
    });
}

/**
 * Calculate the milestone reward for one configured target on the timed ladder.
 *
 * @param {number} targetSpins Milestone target to price.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder settings.
 * @returns {number} Reward granted when that milestone is reached.
 */
function getMilestoneReward(targetSpins, config = gameConfig) {
    const milestone = buildRewardMilestones({ minTarget: targetSpins }, config)
        .find(candidate => candidate.targetSpins === targetSpins);

    return milestone ? milestone.reward : 0;
}

/**
 * Return the currently relevant milestones for the timed reward ladder UI.
 *
 * @param {number} spinsCompleted Spins completed in the active reward window.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder settings.
 * @returns {Array<{targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean}>} Visible milestones.
 */
function getVisibleRewardMilestones(spinsCompleted, config = gameConfig) {
    const baselineCount = config.visibleRewardMilestoneCount + getRewardTierSeedTargets(config).length;
    const milestones = buildRewardMilestones(
        {
            minCount: baselineCount,
            minTarget: spinsCompleted + config.rewardTierGapCap * config.visibleRewardMilestoneCount
        },
        config
    );
    const nextIndex = milestones.findIndex(milestone => spinsCompleted < milestone.targetSpins);
    const startIndex = nextIndex <= 0 ? 0 : nextIndex - 1;

    return milestones.slice(startIndex, startIndex + config.visibleRewardMilestoneCount);
}

/**
 * Describe the player's current position within the active reward tier.
 *
 * @param {number} spinsCompleted Spins completed in the active reward window.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder settings.
 * @returns {{
 *   previousMilestone: {targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean} | null,
 *   nextMilestone: {targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean} | null,
 *   progressPercent: number
 * }} Current tier progress information.
 */
function getRewardProgressState(spinsCompleted, config = gameConfig) {
    const milestones = buildRewardMilestones(
        {
            minCount: config.visibleRewardMilestoneCount + getRewardTierSeedTargets(config).length,
            minTarget: spinsCompleted + config.rewardTierGapCap
        },
        config
    );
    const nextIndex = milestones.findIndex(milestone => spinsCompleted < milestone.targetSpins);
    const nextMilestone = nextIndex === -1 ? null : milestones[nextIndex];
    const previousMilestone = nextIndex <= 0 ? null : milestones[nextIndex - 1];
    const previousTarget = previousMilestone ? previousMilestone.targetSpins : 0;
    const nextTarget = nextMilestone ? nextMilestone.targetSpins : previousTarget;
    const rawProgressPercent = nextTarget === previousTarget
        ? 100
        : ((spinsCompleted - previousTarget) / (nextTarget - previousTarget)) * 100;

    return {
        previousMilestone,
        nextMilestone,
        progressPercent: Math.max(0, Math.min(100, rawProgressPercent))
    };
}

/**
 * Convert the current reward-window spin count into progress within the active tier.
 *
 * @param {number} spinsCompleted Spins completed in the active reward window.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder settings.
 * @returns {number} Progress percentage clamped to [0, 100].
 */
function getRewardProgressPercent(spinsCompleted, config = gameConfig) {
    return getRewardProgressState(spinsCompleted, config).progressPercent;
}

/**
 * Compute the current timer state for the active reward window.
 *
 * @param {number} windowStartedAt Timestamp when the current reward window began.
 * @param {number} nowMs Current timestamp in milliseconds.
 * @param {{
 *   rewardWindowDurationMs: number
 * }} [config=gameConfig] Config containing the reward window duration.
 * @returns {{
 *   completedWindows: number,
 *   currentWindowStartedAt: number,
 *   elapsedInWindowMs: number,
 *   remainingMs: number
 * }} Derived reward window timing information.
 */
function getRewardWindowState(windowStartedAt, nowMs, config = gameConfig) {
    const elapsedMs = Math.max(0, nowMs - windowStartedAt);
    const completedWindows = Math.floor(elapsedMs / config.rewardWindowDurationMs);
    const elapsedInWindowMs = elapsedMs % config.rewardWindowDurationMs;
    const currentWindowStartedAt = windowStartedAt + completedWindows * config.rewardWindowDurationMs;
    const remainingMs = elapsedInWindowMs === 0
        ? config.rewardWindowDurationMs
        : config.rewardWindowDurationMs - elapsedInWindowMs;

    return {
        completedWindows,
        currentWindowStartedAt,
        elapsedInWindowMs,
        remainingMs
    };
}

/**
 * Format a reward-window countdown as `M:SS`.
 *
 * @param {number} durationMs Remaining duration in milliseconds.
 * @returns {string} Countdown label suitable for the UI.
 */
function formatCountdown(durationMs) {
    const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Advance the timed reward window when its reset boundary has passed.
 *
 * @param {number} [nowMs=Date.now()] Current timestamp in milliseconds.
 * @returns {{
 *   completedWindows: number,
 *   currentWindowStartedAt: number,
 *   elapsedInWindowMs: number,
 *   remainingMs: number
 * }} Current reward window timing information after any reset.
 */
function syncRewardWindow(nowMs = Date.now()) {
    const windowState = getRewardWindowState(rewardWindowStartedAt, nowMs);

    if (windowState.completedWindows > 0 && !isSpinning) {
        rewardWindowStartedAt = windowState.currentWindowStartedAt;
        rewardWindowSpinCount = 0;
    }

    return getRewardWindowState(rewardWindowStartedAt, nowMs);
}

/**
 * Resolve how many spins the next play action should simulate.
 *
 * @param {boolean} isBatchMode Whether batch mode is enabled.
 * @param {{
 *   batchSpinCount: number
 * }} [config=gameConfig] Config containing the batch spin size.
 * @returns {number} Number of spins to simulate for one button press.
 */
function getSpinRunCount(isBatchMode, config = gameConfig) {
    return isBatchMode ? config.batchSpinCount : 1;
}

/**
 * Calculate the token cost for one play action.
 *
 * @param {number} spinRunCount Number of spins being simulated.
 * @param {{
 *   spinCost: number
 * }} [config=gameConfig] Config containing the cost per spin.
 * @returns {number} Total token cost for the requested run.
 */
function getSpinActionCost(spinRunCount, config = gameConfig) {
    return config.spinCost * spinRunCount;
}

/**
 * Step the timed reward ladder forward for a batch of simulated spins.
 *
 * @param {number} startingWindowSpinCount Current spin count within the active reward window.
 * @param {number} spinRunCount Number of spins to advance.
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder settings.
 * @returns {{
 *   rewardWindowSpinCount: number,
 *   milestoneHits: Array<{targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean, spinIndex: number}>,
 *   rewardsBySpin: Array<{reward: number, milestone: {targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean} | null}>,
 *   totalReward: number
 * }} Reward ladder resolution for the batch.
 */
function resolveBatchCycleRewards(startingWindowSpinCount, spinRunCount, config = gameConfig) {
    const milestoneByTarget = new Map(
        buildRewardMilestones(
            { minTarget: startingWindowSpinCount + spinRunCount },
            config
        ).map(milestone => [milestone.targetSpins, milestone])
    );
    const rewardsBySpin = [];
    const milestoneHits = [];
    let currentWindowSpinCount = startingWindowSpinCount;
    let totalReward = 0;

    for (let spinIndex = 0; spinIndex < spinRunCount; spinIndex += 1) {
        currentWindowSpinCount += 1;

        const milestone = milestoneByTarget.get(currentWindowSpinCount) || null;
        const reward = milestone ? milestone.reward : 0;

        rewardsBySpin.push({ reward, milestone });

        if (milestone) {
            milestoneHits.push({
                ...milestone,
                spinIndex
            });
            totalReward += reward;
        }
    }

    return {
        rewardWindowSpinCount: currentWindowSpinCount,
        milestoneHits,
        rewardsBySpin,
        totalReward: roundToNickel(totalReward)
    };
}

/**
 * Simulate one or more spins and return both the aggregate outcome and the standout single spin.
 *
 * @param {number} spinRunCount Number of spins to simulate.
 * @param {number} startingWindowSpinCount Current spin count within the active reward window.
 * @param {() => number} [rng=Math.random] Random number generator returning values in [0, 1).
 * @param {typeof gameConfig} [config=gameConfig] Full game config with reward ladder and payout settings.
 * @returns {{
 *   spinCount: number,
 *   spinResults: Array<{
 *     board: string[],
 *     ladderReward: number,
 *     evaluation: ReturnType<typeof evaluateBoard>,
 *     spinNumber: number,
 *     totalReward: number
 *   }>,
 *   bestSpin: {
 *     board: string[],
 *     ladderReward: number,
 *     evaluation: ReturnType<typeof evaluateBoard>,
 *     spinNumber: number,
 *     totalReward: number
 *   } | null,
 *   finalSpin: {
 *     board: string[],
 *     ladderReward: number,
 *     evaluation: ReturnType<typeof evaluateBoard>,
 *     spinNumber: number,
 *     totalReward: number
 *   } | null,
 *   totalReward: number,
 *   totalSpinPayout: number,
 *   ladderRewardTotal: number,
 *   milestoneHits: Array<{targetSpins: number, reward: number, milestoneSpan: number, tierIndex: number, isLongShot: boolean, spinIndex: number}>,
 *   rewardWindowSpinCount: number
 * }} Batch spin resolution.
 */
function simulateSpinBatch(
    spinRunCount,
    startingWindowSpinCount,
    rng = Math.random,
    config = gameConfig
) {
    const ladderResolution = resolveBatchCycleRewards(
        startingWindowSpinCount,
        spinRunCount,
        config
    );
    const spinResults = [];
    let totalSpinPayout = 0;
    let totalReward = 0;
    let bestSpin = null;

    for (let spinIndex = 0; spinIndex < spinRunCount; spinIndex += 1) {
        const spinResult = generateSpinBoard(rng);
        const ladderReward = ladderResolution.rewardsBySpin[spinIndex].reward;
        const spinRewardTotal = roundToNickel(spinResult.evaluation.payout + ladderReward);
        const resolvedSpin = {
            board: spinResult.board,
            ladderReward,
            evaluation: spinResult.evaluation,
            spinNumber: spinIndex + 1,
            totalReward: spinRewardTotal
        };

        spinResults.push(resolvedSpin);
        totalSpinPayout += spinResult.evaluation.payout;
        totalReward += spinRewardTotal;

        if (
            !bestSpin
            || resolvedSpin.totalReward > bestSpin.totalReward
            || (
                resolvedSpin.totalReward === bestSpin.totalReward
                && resolvedSpin.evaluation.payout > bestSpin.evaluation.payout
            )
        ) {
            bestSpin = resolvedSpin;
        }
    }

    return {
        spinCount: spinRunCount,
        spinResults,
        bestSpin,
        finalSpin: spinResults[spinResults.length - 1] || null,
        totalReward: roundToNickel(totalReward),
        totalSpinPayout: roundToNickel(totalSpinPayout),
        ladderRewardTotal: ladderResolution.totalReward,
        milestoneHits: ladderResolution.milestoneHits,
        rewardWindowSpinCount: ladderResolution.rewardWindowSpinCount
    };
}

/**
 * Choose which single spin should be displayed on the board after a batch resolves.
 *
 * @param {ReturnType<typeof simulateSpinBatch>} batchResult Aggregate batch result.
 * @param {boolean} preferBestSpin Whether the highlighted board should show the best spin.
 * @returns {{
 *   board: string[],
 *   ladderReward: number,
 *   evaluation: ReturnType<typeof evaluateBoard>,
 *   spinNumber: number,
 *   totalReward: number
 * } | null} Spin selected for board display.
 */
function getDisplayedSpinResult(batchResult, preferBestSpin) {
    if (!batchResult.bestSpin) {
        return null;
    }

    if (batchResult.spinCount > 1 && preferBestSpin) {
        return batchResult.bestSpin;
    }

    return batchResult.finalSpin;
}

/**
 * Resolve the per-frame animation delay for the current spin mode.
 *
 * Normal mode uses the existing reel cadence, the stop button accelerates late frames, and quick
 * spin compresses the entire animation into the configured quick-spin duration.
 *
 * @param {number} tickIndex Zero-based frame index within the current spin.
 * @param {number} totalTicks Total number of frames that will be animated.
 * @param {boolean} isQuickSpinMode Whether the quick-spin toggle is enabled.
 * @param {boolean} isStopRequested Whether the player has pressed stop during this spin.
 * @param {typeof gameConfig} [config=gameConfig] Full game config containing timing values.
 * @returns {number} Delay in milliseconds for the next animation frame.
 */
function getSpinFrameDelay(
    tickIndex,
    totalTicks,
    isQuickSpinMode,
    isStopRequested,
    config = gameConfig
) {
    if (isQuickSpinMode) {
        return config.quickSpinDuration / Math.max(1, totalTicks);
    }

    return isStopRequested && tickIndex > 5
        ? config.stopSpinTickDelay
        : config.defaultSpinTickDelay;
}

/**
 * Return the base bonus for a completed three-symbol payline.
 *
 * @param {'row' | 'column' | 'diagonal'} lineType Type of payline being scored.
 * @returns {number} Bonus granted for that completed line.
 */
function getTripleLineBonus(lineType) {
    return lineType === 'diagonal'
        ? gameConfig.diagonalTripleBonus
        : gameConfig.rowTripleBonus;
}

/**
 * Look up any additional premium bonus granted by completing a line with a specific symbol.
 *
 * @param {string} symbol Symbol that filled the line.
 * @returns {number} Extra premium bonus for that symbol, or 0 when none applies.
 */
function getPremiumLineBonus(symbol) {
    return gameConfig.premiumLineBonuses[symbol] || 0;
}

/**
 * Sync session counters and control button state to the DOM.
 *
 * @returns {void}
 */
function updateDisplay() {
    if (!balanceDisplay || !spinBtn) return;

    const windowState = syncRewardWindow();
    const spinRunCount = getSpinRunCount(batchSpinEnabled);
    const spinActionCost = getSpinActionCost(spinRunCount);

    balanceDisplay.textContent = formatTokenValue(tokens);
    spinBtn.textContent = spinRunCount > 1
        ? `${activeTheme.copy.spinLabel} x${spinRunCount} (${formatTokenValue(spinActionCost)} Tokens)`
        : `${activeTheme.copy.spinLabel} (${formatTokenValue(gameConfig.spinCost)} Tokens)`;
    spinBtn.disabled = tokens < spinActionCost || isSpinning;

    if (quickSpinToggle) {
        quickSpinToggle.checked = quickSpinEnabled;
        quickSpinToggle.disabled = isSpinning;
    }

    if (batchSpinToggle) {
        batchSpinToggle.checked = batchSpinEnabled;
        batchSpinToggle.disabled = isSpinning;
    }

    if (bestSpinToggle) {
        bestSpinToggle.checked = showBestBatchSpin;
        bestSpinToggle.disabled = isSpinning || !batchSpinEnabled;
    }

    if (lifetimeSpinDisplay) {
        lifetimeSpinDisplay.textContent = lifetimeSpinCount.toLocaleString();
    }

    updateThemeCycleButton();
    updateProgressDisplay(windowState);
}

/**
 * Build the public-facing paytable entries shown in the UI.
 *
 * The game keeps its small per-symbol credits and ordinary link bonuses implicit so outcomes feel
 * more board-driven and less obviously formulaic. Only the premium events are listed here.
 *
 * @returns {Array<{label: string, payout: number, detail: string}>} Premium rule descriptions.
 */
function getPayoutRules() {
    return [
        {
            label: `${getRepeatedDisplaySymbol('💎', 3)} on any line`,
            payout: gameConfig.premiumLineBonuses['💎'],
            detail: activeTheme.payoutRuleDetails.premiumLine
        },
        {
            label: `${getRepeatedDisplaySymbol('🚀', 3)} on any line`,
            payout: gameConfig.premiumLineBonuses['🚀'],
            detail: activeTheme.payoutRuleDetails.jackpotLine
        },
        {
            label: `${gameConfig.rocketClusterThreshold}+ rockets anywhere`,
            payout: gameConfig.rocketClusterBonus,
            detail: activeTheme.payoutRuleDetails.rocketCluster
        },
        {
            label: `${gameConfig.rocketStormThreshold}+ rockets anywhere`,
            payout: gameConfig.rocketStormBonus,
            detail: activeTheme.payoutRuleDetails.rocketStorm
        },
        {
            label: 'Full grid of 🚀',
            payout: gameConfig.fullRocketBonus,
            detail: activeTheme.payoutRuleDetails.fullRocket
        }
    ];
}

/**
 * Render the public paytable into the rules table.
 *
 * @returns {void}
 */
function renderPayoutRules() {
    if (!payoutRulesBody || !rulesSummary) return;

    const payoutRules = getPayoutRules();

    rulesSummary.textContent = activeTheme.copy.rulesSummary;
    payoutRulesBody.innerHTML = payoutRules
        .map(
            rule => `<tr><th scope="row">${rule.label}<span class="rule-detail">${rule.detail}</span></th><td>+${formatTokenValue(rule.payout)}</td></tr>`
        )
        .join('');
}

/**
 * Render the static milestone chips below the progress bar.
 *
 * @returns {void}
 */
function renderProgressMilestones() {
    if (!progressMilestones) return;

    progressMilestones.innerHTML = getVisibleRewardMilestones(rewardWindowSpinCount)
        .map(
            milestone => `<div class="progress-marker${milestone.isLongShot ? ' long-shot' : ''}" data-target="${milestone.targetSpins}">${milestone.isLongShot ? '<span class="progress-marker-badge">Long Shot</span>' : ''}<span class="progress-marker-label">${milestone.targetSpins} ${milestone.targetSpins === 1 ? 'spin' : 'spins'}</span><span class="progress-marker-reward">+${formatTokenValue(milestone.reward)}</span></div>`
        )
        .join('');
}

/**
 * Sync the timed reward ladder visuals and summary copy to the current window spin count.
 *
 * @param {{
 *   completedWindows: number,
 *   currentWindowStartedAt: number,
 *   elapsedInWindowMs: number,
 *   remainingMs: number
 * }} [windowState=getRewardWindowState(rewardWindowStartedAt, Date.now(), gameConfig)] Current reward window timing.
 * @returns {void}
 */
function updateProgressDisplay(
    windowState = getRewardWindowState(rewardWindowStartedAt, Date.now(), gameConfig)
) {
    if (!progressTrack || !progressFill || !progressSummary) return;

    const { previousMilestone, nextMilestone, progressPercent } = getRewardProgressState(rewardWindowSpinCount);
    const previousTarget = previousMilestone ? previousMilestone.targetSpins : 0;

    renderProgressMilestones();

    progressFill.style.width = `${progressPercent}%`;
    progressTrack.setAttribute('aria-valuemin', String(previousTarget));
    progressTrack.setAttribute('aria-valuemax', String(nextMilestone ? nextMilestone.targetSpins : rewardWindowSpinCount));
    progressTrack.setAttribute('aria-valuenow', String(rewardWindowSpinCount));

    if (progressTimer) {
        progressTimer.textContent = `Refresh in ${formatCountdown(windowState.remainingMs)}`;
    }

    progressSummary.textContent = nextMilestone
        ? `Window spins: ${rewardWindowSpinCount}. ${nextMilestone.isLongShot ? 'Long-shot reward' : 'Next reward'} +${formatTokenValue(nextMilestone.reward)} at ${nextMilestone.targetSpins} spins.`
        : `Window spins: ${rewardWindowSpinCount}. Reward ladder is waiting for the next generated tier.`;

    if (!progressMilestones) return;

    Array.from(progressMilestones.children).forEach(marker => {
        const targetSpins = Number(marker.getAttribute('data-target'));
        const isReached = rewardWindowSpinCount > 0 && rewardWindowSpinCount >= targetSpins;
        const isNext = Boolean(nextMilestone) && nextMilestone.targetSpins === targetSpins;

        marker.classList.toggle('reached', isReached);
        marker.classList.toggle('next', isNext);
    });
}

/**
 * Sample a symbol using the configured symbol weights.
 *
 * @param {() => number} [rng=Math.random] Random number generator returning values in [0, 1).
 * @returns {string} Selected symbol for one cell on the board.
 */
function pickWeightedSymbol(rng = Math.random) {
    let roll = rng() * totalSymbolWeight;

    for (const symbolConfig of symbolConfigs) {
        roll -= symbolConfig.weight;
        if (roll <= 0) {
            return symbolConfig.symbol;
        }
    }

    return symbolConfigs[symbolConfigs.length - 1].symbol;
}

/**
 * Generate a full 3x3 board and immediately score it.
 *
 * @param {() => number} [rng=Math.random] Random number generator returning values in [0, 1).
 * @returns {{board: string[], evaluation: ReturnType<typeof evaluateBoard>}} Generated board and its score breakdown.
 */
function generateSpinBoard(rng = Math.random) {
    const board = Array.from({ length: 9 }, () => pickWeightedSymbol(rng));
    return {
        board,
        evaluation: evaluateBoard(board)
    };
}

/**
 * Score a completed 3x3 board.
 *
 * Payouts come from four layers:
 * 1. Every symbol contributes a hidden base credit.
 * 2. Adjacent matches on paylines add "link" bonuses.
 * 3. Three-of-a-kind paylines add a larger line bonus.
 * 4. Rare premium symbol patterns add the biggest jackpots.
 *
 * @param {string[]} board Flat array of 9 symbols ordered left-to-right, top-to-bottom.
 * @returns {{
 *   payout: number,
 *   symbolCredits: number,
 *   pairBonuses: number,
 *   lineBonuses: number,
 *   premiumBonuses: number,
 *   adjacentPairs: number,
 *   fullLines: number,
 *   rocketCount: number,
 *   rocketClusterHit: boolean,
 *   rocketStormHit: boolean,
 *   megaJackpotHit: boolean,
 *   premiumHits: Array<{symbol: string, label: string, bonus: number}>
 * }} Detailed payout evaluation.
 */
function evaluateBoard(board) {
    let symbolCredits = 0;
    let pairBonuses = 0;
    let lineBonuses = 0;
    let premiumBonuses = 0;
    let adjacentPairs = 0;
    let fullLines = 0;
    let rocketCount = 0;
    let rocketClusterHit = false;
    let rocketStormHit = false;
    let megaJackpotHit = false;
    const premiumHits = [];

    board.forEach(symbol => {
        symbolCredits += symbolCreditMap[symbol];
        if (symbol === '🚀') {
            rocketCount += 1;
        }
    });

    for (const payline of paylines) {
        const [firstIndex, secondIndex, thirdIndex] = payline.cells;
        const firstSymbol = board[firstIndex];
        const secondSymbol = board[secondIndex];
        const thirdSymbol = board[thirdIndex];

        if (firstSymbol === secondSymbol) {
            pairBonuses += gameConfig.pairMatchBonus;
            adjacentPairs += 1;
        }

        if (secondSymbol === thirdSymbol) {
            pairBonuses += gameConfig.pairMatchBonus;
            adjacentPairs += 1;
        }

        if (firstSymbol === secondSymbol && secondSymbol === thirdSymbol) {
            const baseLineBonus = getTripleLineBonus(payline.type);
            const premiumLineBonus = getPremiumLineBonus(firstSymbol);

            lineBonuses += baseLineBonus;
            premiumBonuses += premiumLineBonus;
            fullLines += 1;

            if (premiumLineBonus > 0) {
                premiumHits.push({
                    symbol: firstSymbol,
                    label: payline.label,
                    bonus: premiumLineBonus
                });
            }
        }
    }

    if (rocketCount >= gameConfig.rocketClusterThreshold) {
        premiumBonuses += gameConfig.rocketClusterBonus;
        rocketClusterHit = true;
    }

    if (rocketCount >= gameConfig.rocketStormThreshold) {
        premiumBonuses += gameConfig.rocketStormBonus;
        rocketStormHit = true;
    }

    if (board.every(symbol => symbol === '🚀')) {
        premiumBonuses += gameConfig.fullRocketBonus;
        megaJackpotHit = true;
    }

    return {
        payout: roundToNickel(symbolCredits + pairBonuses + lineBonuses + premiumBonuses),
        symbolCredits: roundToNickel(symbolCredits),
        pairBonuses: roundToNickel(pairBonuses),
        lineBonuses: roundToNickel(lineBonuses),
        premiumBonuses: roundToNickel(premiumBonuses),
        adjacentPairs,
        fullLines,
        rocketCount,
        rocketClusterHit,
        rocketStormHit,
        megaJackpotHit,
        premiumHits
    };
}

/**
 * Convert a scored board into a short headline for the result area.
 *
 * @param {ReturnType<typeof evaluateBoard>} evaluation Detailed payout breakdown.
 * @returns {string} Short user-facing outcome message.
 */
function getOutcomeMessage(evaluation) {
    if (evaluation.megaJackpotHit) {
        return '🚀 JACKPOT!';
    }

    if (evaluation.rocketStormHit) {
        return '💥 Massive jackpot!';
    }

    if (evaluation.rocketClusterHit || evaluation.premiumHits.some(hit => hit.symbol === '🚀')) {
        return '🚀 Big win!';
    }

    if (evaluation.premiumHits.some(hit => hit.symbol === '💎')) {
        return `${getDisplaySymbol('💎')} Premium line!`;
    }

    if (evaluation.fullLines > 0) {
        return '✨ Line hit!';
    }

    if (evaluation.adjacentPairs >= 3) {
        return '✨ Plenty of links!';
    }

    return 'Tokens recovered!';
}

/**
 * Populate the result panel with the payout total and a short summary of why it happened.
 *
 * @param {ReturnType<typeof simulateSpinBatch>} batchResult Aggregate spin resolution.
 * @param {boolean} preferBestSpin Whether the board is highlighting the best spin in a batch.
 * @returns {void}
 */
function updateResultMessage(batchResult, preferBestSpin) {
    if (!logDisplay || !payoutDisplay) return;

    const displayedSpin = getDisplayedSpinResult(batchResult, preferBestSpin);

    if (!displayedSpin) {
        return;
    }

    const evaluation = displayedSpin.evaluation;
    const isBatchRun = batchResult.spinCount > 1;
    const premiumCount = evaluation.premiumHits.length
        + (evaluation.rocketClusterHit ? 1 : 0)
        + (evaluation.rocketStormHit ? 1 : 0)
        + (evaluation.megaJackpotHit ? 1 : 0);
    const detailParts = [
        `${evaluation.adjacentPairs} link${evaluation.adjacentPairs === 1 ? '' : 's'}`,
        `${evaluation.fullLines} full line${evaluation.fullLines === 1 ? '' : 's'}`
    ];

    if (premiumCount > 0) {
        detailParts.push(`${premiumCount} premium hit${premiumCount === 1 ? '' : 's'}`);
    }

    if (displayedSpin.ladderReward > 0) {
        detailParts.push(`ladder reward +${formatTokenValue(displayedSpin.ladderReward)}`);
    }

    if (isBatchRun) {
        detailParts.unshift(`${batchResult.spinCount} spins simulated`);
        detailParts.push(`best spin +${formatTokenValue(batchResult.bestSpin.totalReward)}`);

        if (batchResult.ladderRewardTotal > 0) {
            detailParts.push(`ladder rewards +${formatTokenValue(batchResult.ladderRewardTotal)}`);
        }

        detailParts.push(preferBestSpin ? 'board shows best spin' : 'board shows last spin');
        logDisplay.textContent = `Batch complete: ${batchResult.spinCount} spins resolved`;
    } else {
        logDisplay.textContent = getOutcomeMessage(evaluation);
    }

    payoutDisplay.innerHTML = `<span class="win-text">+${formatTokenValue(batchResult.totalReward)} Tokens!</span><span class="payout-detail">${detailParts.join(' • ')}</span>`;
}

/**
 * Translate a visual column index into the matching flat-array board indices.
 *
 * @param {number} columnIndex Zero-based column index.
 * @returns {number[]} Board indices for the top, middle, and bottom cell in that column.
 */
function getColumnIndices(columnIndex) {
    return [columnIndex, columnIndex + 3, columnIndex + 6];
}

/**
 * Read the currently displayed board from the DOM.
 *
 * Tests run without a document, so this is only used in the browser during animation.
 *
 * @returns {string[]} Currently visible symbols.
 */
function getVisibleBoard() {
    return reels.map((reel, reelIndex) => reel.dataset.symbol || activeTheme.idleBoard[reelIndex % activeTheme.idleBoard.length]);
}

/**
 * Paint one visible reel cell with the themed symbol while preserving the engine-facing symbol id.
 *
 * @param {HTMLElement} reel Reel element being updated.
 * @param {string} symbol Internal symbol identifier used by the game engine.
 * @returns {void}
 */
function setReelSymbol(reel, symbol) {
    reel.dataset.symbol = symbol;
    reel.textContent = getDisplaySymbol(symbol);
}

/**
 * Replace the full visible board while keeping the underlying board ids available for animation.
 *
 * @param {string[]} board Internal board symbols ordered left-to-right, top-to-bottom.
 * @returns {void}
 */
function setVisibleBoard(board) {
    reels.forEach((reel, reelIndex) => {
        setReelSymbol(reel, board[reelIndex]);
    });
}

/**
 * Replace the visible symbols for one column.
 *
 * @param {number} columnIndex Zero-based column index.
 * @param {string[]} columnSymbols Symbols to display from top to bottom.
 * @returns {void}
 */
function setColumnSymbols(columnIndex, columnSymbols) {
    const columnIndices = getColumnIndices(columnIndex);

    columnIndices.forEach((cellIndex, rowIndex) => {
        setReelSymbol(reels[cellIndex], columnSymbols[rowIndex]);
    });
}

/**
 * Precompute the per-tick states for a single animated column.
 *
 * The final board is already known before spinning starts. To sell the slot-machine illusion, this
 * function inserts filler symbols above the column and repeatedly shifts downward until the final
 * top, middle, and bottom symbols arrive in order.
 *
 * @param {string[]} startColumn Visible symbols before the spin starts.
 * @param {string[]} finalColumn Predetermined target symbols after the spin ends.
 * @param {number} shiftCount Number of downward shifts to animate.
 * @param {() => number} [rng=Math.random] Random generator used for filler inserts.
 * @returns {string[][]} Column states for each animation tick.
 */
function buildColumnSequence(startColumn, finalColumn, shiftCount, rng = Math.random) {
    const inserts = Array.from(
        { length: Math.max(0, shiftCount - 3) },
        () => symbols[Math.floor(rng() * symbols.length)]
    );
    inserts.push(finalColumn[2], finalColumn[1], finalColumn[0]);

    const sequence = [];
    let currentColumn = [...startColumn];

    inserts.forEach(insertedSymbol => {
        currentColumn = [insertedSymbol, currentColumn[0], currentColumn[1]];
        sequence.push([...currentColumn]);
    });

    return sequence;
}

/**
 * Animate the three board columns until they settle on the predetermined result.
 *
 * @param {string[]} finalBoard Target board to reveal after the spin.
 * @returns {Promise<void>} Resolves when the spin animation completes.
 */
async function animateSpin(finalBoard) {
    const startingBoard = getVisibleBoard();
    const shiftCounts = [13, 16, 19];
    const isQuickSpinMode = quickSpinEnabled;
    const columnSequences = shiftCounts.map((shiftCount, columnIndex) => {
        const startColumn = getColumnIndices(columnIndex).map(cellIndex => startingBoard[cellIndex]);
        const finalColumn = getColumnIndices(columnIndex).map(cellIndex => finalBoard[cellIndex]);
        return buildColumnSequence(startColumn, finalColumn, shiftCount);
    });
    const longestSequence = Math.max(...shiftCounts);

    reels.forEach(reel => reel.classList.add('spinning'));

    for (let tick = 0; tick < longestSequence; tick += 1) {
        columnSequences.forEach((sequence, columnIndex) => {
            const nextColumnState = sequence[Math.min(tick, sequence.length - 1)];
            setColumnSymbols(columnIndex, nextColumnState);
        });

        await wait(
            getSpinFrameDelay(
                tick,
                longestSequence,
                isQuickSpinMode,
                stopRequested
            )
        );
    }

    reels.forEach(reel => reel.classList.remove('spinning'));
}

/**
 * Execute one full spin: charge the player, generate a board, animate it, then award winnings.
 *
 * @returns {Promise<void>} Resolves after the board has settled and the UI has been updated.
 */
async function runInference() {
    syncRewardWindow();

    const spinRunCount = getSpinRunCount(batchSpinEnabled);
    const spinActionCost = getSpinActionCost(spinRunCount);

    if (tokens < spinActionCost || !payoutDisplay || !logDisplay || !focusOverlay || !spinBtn || !stopBtn) {
        return;
    }

    isSpinning = true;
    stopRequested = false;
    tokens -= spinActionCost;
    updateDisplay();

    payoutDisplay.textContent = '';
    logDisplay.textContent = spinRunCount > 1
        ? formatThemeTemplate(activeTheme.copy.batchScanTemplate, { count: spinRunCount })
        : activeTheme.copy.singleScan;
    focusOverlay.classList.add('active');

    spinBtn.style.display = 'none';
    stopBtn.style.display = quickSpinEnabled ? 'none' : 'block';
    stopBtn.disabled = quickSpinEnabled;

    const batchResult = simulateSpinBatch(spinRunCount, rewardWindowSpinCount);
    const displayedSpin = getDisplayedSpinResult(batchResult, showBestBatchSpin);

    if (displayedSpin) {
        await animateSpin(displayedSpin.board);
    }

    tokens += batchResult.totalReward;
    rewardWindowSpinCount = batchResult.rewardWindowSpinCount;
    lifetimeSpinCount += spinRunCount;

    updateResultMessage(batchResult, showBestBatchSpin);

    isSpinning = false;
    focusOverlay.classList.remove('active');
    spinBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    updateDisplay();
}

/**
 * Reset the session state and restore the board to its idle placeholder symbols.
 *
 * @returns {void}
 */
function resetGame() {
    tokens = gameConfig.startingTokens;
    lifetimeSpinCount = 0;
    rewardWindowSpinCount = 0;
    rewardWindowStartedAt = Date.now();
    reels.forEach(reel => reel.classList.remove('spinning'));
    setVisibleBoard(activeTheme.idleBoard);

    if (logDisplay) {
        logDisplay.textContent = activeTheme.copy.idleStatus;
    }

    if (payoutDisplay) {
        payoutDisplay.textContent = '';
    }

    updateDisplay();
}

/**
 * Start the interval that refreshes the visible reward-window timer.
 *
 * @returns {void}
 */
function startRewardWindowTimer() {
    if (!hasDocument || rewardWindowTimerId) return;

    rewardWindowTimerId = window.setInterval(() => {
        if (!isSpinning) {
            updateDisplay();
        }
    }, 1000);
}

// Wire up browser-only interactions when the script runs on the page.

if (stopBtn) {
    stopBtn.addEventListener('click', () => {
        stopRequested = true;
        stopBtn.disabled = true;
    });
}

if (quickSpinToggle) {
    quickSpinToggle.addEventListener('change', event => {
        quickSpinEnabled = event.target.checked;
        updateDisplay();
    });
}

if (batchSpinToggle) {
    batchSpinToggle.addEventListener('change', event => {
        batchSpinEnabled = event.target.checked;
        updateDisplay();
    });
}

if (bestSpinToggle) {
    bestSpinToggle.addEventListener('change', event => {
        showBestBatchSpin = event.target.checked;
        updateDisplay();
    });
}

if (themeCycleBtn) {
    themeCycleBtn.addEventListener('click', () => {
        setActiveTheme(getNextThemeId(activeTheme.id));
    });
}

if (spinBtn) {
    spinBtn.addEventListener('click', runInference);
}

if (resetBtn) {
    resetBtn.addEventListener('click', resetGame);
}

setActiveTheme(activeTheme.id, { overwriteStatus: true, syncBoard: true });
startRewardWindowTimer();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        buildColumnSequence,
        buildRewardMilestones,
        evaluateBoard,
        formatCountdown,
        formatThemeName,
        formatThemeTemplate,
        gameConfig,
        generateSpinBoard,
        getActiveTheme,
        getExpectedLossPerSpin,
        getDisplayedSpinResult,
        getDisplaySymbol,
        getMilestoneReward,
        getNextThemeId,
        getPayoutRules,
        getRewardProgressPercent,
        getRewardRoundingStep,
        getRewardTierSeedTargets,
        getThemeIds,
        getRewardWindowState,
        getVisibleRewardMilestones,
        getSpinActionCost,
        getSpinFrameDelay,
        getSpinRunCount,
        setActiveTheme,
        resolveBatchCycleRewards,
        roundDownReward,
        roundToNickel,
        simulateSpinBatch,
        symbolConfigs
    };
}
