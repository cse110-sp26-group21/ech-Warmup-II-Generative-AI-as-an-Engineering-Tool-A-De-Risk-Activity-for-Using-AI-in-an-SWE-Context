(function registerThemeRegistry(globalScope) {
    const themeRegistry = Object.freeze({
        cosmic: Object.freeze({
            id: 'cosmic',
            stylesheetHref: 'themes/cosmic.css',
            copy: Object.freeze({
                pageTitle: 'Cosmic Token Roulette',
                heading: 'Cosmic Token Roulette',
                tagline: 'Plot a course through the starfield and chase the rocket jackpot.',
                footer: 'A space-themed simulator for AI inference.',
                spinLabel: '🌌 SPIN',
                idleStatus: 'Ready to launch?',
                singleScan: 'Scanning the starfield...',
                batchScanTemplate: 'Charting {count} spins through the starfield...',
                rulesSummary: 'Smaller orbital credits and regular line links are applied automatically. Premium wins below.'
            }),
            payoutRuleDetails: Object.freeze({
                premiumLine: 'Planet line bonus',
                jackpotLine: 'Jackpot line bonus',
                rocketCluster: 'Rocket cluster bonus',
                rocketStorm: 'Meteor jackpot bonus',
                fullRocket: 'Cosmic jackpot bonus'
            }),
            displaySymbols: Object.freeze({
                '📈': '🌑',
                '🔮': '🌒',
                '🎰': '🌓',
                '💸': '🌔',
                '💰': '🌕',
                '💎': '🪐',
                '🚀': '🚀'
            }),
            idleBoard: Object.freeze(['📈', '🔮', '🎰', '💸', '💰', '💎', '📈', '🔮', '🚀'])
        }),
        nebula: Object.freeze({
            id: 'nebula',
            stylesheetHref: 'themes/nebula.css',
            copy: Object.freeze({
                pageTitle: 'Nebula Drift Roulette',
                heading: 'Nebula Drift Roulette',
                tagline: 'Ride the glowing lanes, catch rare astral alignments, and hunt the rocket burst.',
                footer: 'A nebula-themed simulator for AI inference.',
                spinLabel: '✨ SPIN',
                idleStatus: 'Navigation stable.',
                singleScan: 'Sweeping the nebula lanes...',
                batchScanTemplate: 'Tracing {count} routes across the nebula...',
                rulesSummary: 'Minor astral credits and linked lanes are applied automatically. Premium wins below.'
            }),
            payoutRuleDetails: Object.freeze({
                premiumLine: 'Orbital line bonus',
                jackpotLine: 'Rocket line bonus',
                rocketCluster: 'Launch chain bonus',
                rocketStorm: 'Nebula burst jackpot',
                fullRocket: 'Deep-space jackpot bonus'
            }),
            displaySymbols: Object.freeze({
                '📈': '☄️',
                '🔮': '🌌',
                '🎰': '🛰️',
                '💸': '🌗',
                '💰': '🌞',
                '💎': '🪐',
                '🚀': '🚀'
            }),
            idleBoard: Object.freeze(['📈', '🔮', '🎰', '💸', '💰', '💎', '🔮', '📈', '🚀'])
        }),
        classicCasino: Object.freeze({
            id: 'classicCasino',
            stylesheetHref: 'themes/classic-casino.css',
            copy: Object.freeze({
                pageTitle: 'Classic Casino Roulette',
                heading: 'Classic Casino Roulette',
                tagline: 'Spin a familiar red-and-gold cabinet with bells, cherries, stars, and lucky sevens.',
                footer: 'A classic casino-themed simulator for AI inference.',
                spinLabel: '🎰 SPIN',
                idleStatus: 'House lights are on.',
                singleScan: 'Spinning the casino reels...',
                batchScanTemplate: 'Running {count} classic spins...',
                rulesSummary: 'Smaller reel credits and standard line links are applied automatically. Premium wins below.'
            }),
            payoutRuleDetails: Object.freeze({
                premiumLine: 'Star line bonus',
                jackpotLine: 'Lucky seven line bonus',
                rocketCluster: 'Lucky seven cluster bonus',
                rocketStorm: 'High-roller jackpot bonus',
                fullRocket: 'Grand seven jackpot bonus'
            }),
            displaySymbols: Object.freeze({
                '📈': '🍒',
                '🔮': '🍋',
                '🎰': '🍊',
                '💸': '🔔',
                '💰': '🍀',
                '💎': '⭐',
                '🚀': '7️⃣'
            }),
            idleBoard: Object.freeze(['📈', '🔮', '🎰', '💸', '💰', '💎', '📈', '💎', '🚀'])
        }),
        arcadeNeon: Object.freeze({
            id: 'arcadeNeon',
            stylesheetHref: 'themes/arcade-neon.css',
            copy: Object.freeze({
                pageTitle: 'Arcade Neon Roulette',
                heading: 'Arcade Neon Roulette',
                tagline: 'Light up the cabinet with neon icons, glowing rails, and a louder arcade vibe.',
                footer: 'A neon arcade-themed simulator for AI inference.',
                spinLabel: '⚡ SPIN',
                idleStatus: 'Arcade power online.',
                singleScan: 'Charging the neon reels...',
                batchScanTemplate: 'Running {count} neon spins...',
                rulesSummary: 'Hidden pixel credits and linked bonus lines are applied automatically. Premium wins below.'
            }),
            payoutRuleDetails: Object.freeze({
                premiumLine: 'Glitch star line bonus',
                jackpotLine: 'Rocket line bonus',
                rocketCluster: 'Arcade combo bonus',
                rocketStorm: 'Neon jackpot bonus',
                fullRocket: 'High-score jackpot bonus'
            }),
            displaySymbols: Object.freeze({
                '📈': '👾',
                '🔮': '🕹️',
                '🎰': '🎮',
                '💸': '💿',
                '💰': '⚡',
                '💎': '🌟',
                '🚀': '🚀'
            }),
            idleBoard: Object.freeze(['📈', '🔮', '🎰', '💸', '💰', '💎', '🔮', '📈', '🚀'])
        }),
        minimalClean: Object.freeze({
            id: 'minimalClean',
            stylesheetHref: 'themes/minimal-clean.css',
            copy: Object.freeze({
                pageTitle: 'Minimal Token Roulette',
                heading: 'Minimal Token Roulette',
                tagline: 'A simpler cabinet with quieter colors, clearer symbols, and easy-to-read game state.',
                footer: 'A minimal interface for AI inference simulation.',
                spinLabel: 'SPIN',
                idleStatus: 'Ready.',
                singleScan: 'Spinning...',
                batchScanTemplate: 'Running {count} spins...',
                rulesSummary: 'Small symbol credits and regular line links are applied automatically. Premium wins below.'
            }),
            payoutRuleDetails: Object.freeze({
                premiumLine: 'Star line bonus',
                jackpotLine: 'Rocket line bonus',
                rocketCluster: 'Rocket cluster bonus',
                rocketStorm: 'Jackpot bonus',
                fullRocket: 'Full-board jackpot bonus'
            }),
            displaySymbols: Object.freeze({
                '📈': '○',
                '🔮': '◇',
                '🎰': '□',
                '💸': '△',
                '💰': '●',
                '💎': '✦',
                '🚀': '🚀'
            }),
            idleBoard: Object.freeze(['📈', '🔮', '🎰', '💸', '💰', '💎', '📈', '🔮', '🚀'])
        })
    });

    const defaultThemeId = 'cosmic';

    function getThemeDefinition(themeId) {
        return themeRegistry[themeId] || themeRegistry[defaultThemeId];
    }

    const themeApi = {
        defaultThemeId,
        getThemeDefinition,
        themeRegistry
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = themeApi;
    }

    if (globalScope) {
        globalScope.slotThemeRegistry = themeApi;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this));
