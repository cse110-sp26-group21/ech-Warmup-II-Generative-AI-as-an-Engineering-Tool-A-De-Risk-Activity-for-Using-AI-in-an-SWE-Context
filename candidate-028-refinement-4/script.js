const symbols = ['💸', '🎰', '📈', '🔮', '💰', '🚀', '💎'];
const spinCost = 5;
let tokens = 100;
let totalBurn = 0;
let isSpinning = false;
let stopRequested = false;

const spinBtn = document.getElementById('spin-button');
const stopBtn = document.getElementById('stop-button');
const resetBtn = document.getElementById('reset-button');
const balanceDisplay = document.getElementById('token-balance');
const burnDisplay = document.getElementById('total-burn');
const logDisplay = document.getElementById('status-log');
const payoutDisplay = document.getElementById('payout-msg');
const focusOverlay = document.getElementById('focus-overlay');
const themeToggle = document.getElementById('theme-toggle');
const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3')
];

function updateDisplay() {
    balanceDisplay.textContent = tokens;
    burnDisplay.textContent = totalBurn;
    spinBtn.disabled = tokens < spinCost || isSpinning;
}

// Theme Toggle Logic
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
});

stopBtn.addEventListener('click', () => {
    stopRequested = true;
    stopBtn.disabled = true;
});

async function runInference() {
    if (tokens < spinCost) return;

    isSpinning = true;
    stopRequested = false;
    tokens -= spinCost;
    totalBurn += spinCost; // Track the burn
    updateDisplay();
    
    // UI Feedback
    payoutDisplay.textContent = "";
    logDisplay.textContent = "AI is thinking...";
    focusOverlay.classList.add('active'); // Darken background
    
    spinBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.disabled = false;

    reels.forEach(reel => reel.classList.add('spinning'));

    for (let i = 0; i < 30; i++) {
        if (stopRequested && i > 8) break; 
        await new Promise(r => setTimeout(r, 100));
    }

    const results = [];
    for (let i = 0; i < reels.length; i++) {
        await new Promise(r => setTimeout(r, 150));
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        reels[i].classList.remove('spinning');
        reels[i].textContent = randomSymbol;
        results.push(randomSymbol);
    }

    calculatePayout(results);
    
    isSpinning = false;
    focusOverlay.classList.remove('active'); // Lighten background
    spinBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    updateDisplay();
}

function calculatePayout(results) {
    const [s1, s2, s3] = results;
    let winAmount = 0;

    if (s1 === s2 && s2 === s3) {
        winAmount = 50; 
        logDisplay.textContent = "🚀 MEGA JACKPOT!";
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        winAmount = 10;
        logDisplay.textContent = "✨ Nice Match!";
    } else {
        logDisplay.textContent = "Try again!";
    }

    if (winAmount > 0) {
        tokens += winAmount;
        payoutDisplay.innerHTML = `<span class="win-text">+${winAmount} Tokens!</span>`;
    }
}

function resetGame() {
    tokens = 100;
    totalBurn = 0;
    reels.forEach(reel => reel.textContent = '🤖');
    logDisplay.textContent = "Ready to play!";
    payoutDisplay.textContent = "";
    updateDisplay();
}

spinBtn.addEventListener('click', runInference);
resetBtn.addEventListener('click', resetGame);
updateDisplay();