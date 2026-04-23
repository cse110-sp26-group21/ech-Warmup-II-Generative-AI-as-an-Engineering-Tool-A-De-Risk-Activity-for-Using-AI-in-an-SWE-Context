# Final Report: Generative AI as an Engineering Tool
## CSE 110 · Software Engineering · Group 21 — "Always Bet on 21"

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Team & Contributions](#team--contributions)
3. [Research Summary](#research-summary)
4. [AI Tool Usage](#ai-tool-usage)
5. [Product Development Log](#product-development-log)
6. [Final Product](#final-product)
7. [Key Findings on AI as an Engineering Tool](#key-findings-on-ai-as-an-engineering-tool)
8. [Conclusions](#conclusions)

---

## Project Overview

This project is a Tech Warmup II activity for CSE 110, in which our team used a Generative AI coding assistant to build and iteratively refine a web-based slot machine game. The goal was not merely to build a slot machine — it was to rigorously evaluate how useful generative AI is in a real software engineering workflow.

**AI Tool Used:** Claude Code  
**Model:** Codex 5.4  
**Project Repository:** `cse110-sp26-group21 / ech-Warmup-II-Generative-AI-as-an-Engineering-Tool`

The team chose Claude Code because of its ability to generate code, explain structure, and support iteration across multiple development cycles. The primary developer, Haolong Chen, used it to accelerate feature development while maintaining code quality.

---

## Team & Contributions

| Member | Research Focus |
|--------|---------------|
| **Kathy** | General slot machine mechanics, popularity factors, theming ideas, competitor strengths/weaknesses |
| **Andy** | Market research, player psychology, monetization systems, retention features, industry pain points |
| **Haolong** | Core slot machine terminology, common app features, user needs, visual theme ideas |
| **Matthew** | Player experience — smoothness, clarity, satisfaction |
| **William** | Gameplay loops, user expectations, UI clarity, responsiveness |
| **Lucia** | Technical considerations, engineering quality standards, implementation constraints |
| **Aaran** | UI/UX design patterns, user psychology, technical game architecture, feature prioritization |
| **Eliot** | User engagement psychology, UI features, game mechanics, cross-platform considerations |

---

## Research Summary

### What Makes a Good Slot Machine App

The team's research converged on a unified finding: **successful slot machine apps are built on simplicity, fast interaction, clear feedback, and visually engaging design — not complex mechanics.**

#### Core Mechanics
Slot machines operate on a simple loop: place a bet, spin reels, receive a payout based on symbol combinations. Common features include reels, paylines, balance displays, betting controls, win/loss feedback, bonus rounds, multipliers, jackpots, and themed visuals.

#### Player Psychology
Research identified the following key psychological drivers:

- **Variable Ratio Reinforcement** — rewards after an unpredictable number of actions keeps engagement constant. Players never know if the next spin will be the big one.
- **Near-miss effects** — two jackpot symbols landing while the third stops just short activates reward-processing areas of the brain, motivating continued play.
- **Losses disguised as wins** — celebrating net-negative outcomes as small wins keeps players engaged while balance slowly drains.
- **Dark flow** — many players seek rhythmic, repetitive immersion rather than pure excitement, explaining why some monetization tactics can destroy the product's emotional value.

#### Player Segments

Research identified five distinct player types:

1. **Thrill-seeking players** — respond to spectacle, volatility, jackpots, and urgency.
2. **Relax-and-zone players** — value rhythm, low cognitive load, and minimal interruption.
3. **Progression and collector players** — want missions, levels, and unlocks that make repetition feel meaningful.
4. **Social and status players** — care about clubs, gifting, and leaderboards.
5. **Fairness-sensitive players** — retained by transparency, legibility, and respectful monetization.

#### UI/UX Principles
The most important design insights from competitive analysis:

- The **spin button must be the most prominent element** on screen — always accessible, visually dominant, with clear hover/press states.
- **Balance, bet, and last-win** information must be visible at all times for player trust.
- **Paytable discoverability** matters — once outcomes feel confusing, hidden rules create distrust.
- **Tiered win feedback** — losses, small wins, and jackpots should have different animation intensity.
- **Avoid pop-up overload** — interruption is the most common complaint in existing slot apps.

#### Key Pain Points in Existing Apps
- Cluttered interfaces making spin button hard to find
- Payout rules hidden or confusing
- Too many simultaneous missions and pop-ups
- Crashes during bonus rounds interpreted as rigged outcomes
- Perceived tightening of odds after purchase events

---

## AI Tool Usage

### Strategy
The team followed a structured AI collaboration policy:

- Break tasks into small, well-scoped steps
- Use clear and specific prompts
- Review all AI-generated code carefully before accepting
- Run linting and testing frequently
- Record every AI interaction in the use log
- Only manually edit code if AI failed to fix an issue

### AI Use Log Summary (20 Entries)

The following table summarizes all 20 logged AI interactions across the project's development lifecycle:

| Entry | Goal | Outcome | Human Edits? |
|-------|------|---------|--------------|
| 1 | Show payout structure; backend setup for payout modification | AI separated game logic, UI, and payout system | No |
| 2 | More "friendly" payout structure; 3x3 grid with diagonal paylines | 3x3 grid and near-win payout scheme implemented | No |
| 3 | More "exciting" payouts with jackpot variance; visual reel continuity | Big wins occur infrequently; reel animation continuity added | No |
| 4 | Symbol-based payout structure; remove predictable per-turn rebate | Payouts feel more random and varied | No |
| 5 | Iteration on Entry 4 | Further refinement of payout feel | No |
| 6 (first) | Code documentation checkpoint | Full codebase documentation added | No |
| 6 (second) | Rakeback progress bar system (100-spin milestone rewards) | Rakeback milestones and asymmetric progress bar implemented (AI declined non-linear bar) | No |
| 7 | Quick spin toggle (0.25 second animation) | Quick spin toggle working | No |
| 8 | Simulate 10 spins at once; display highest-reward spin | 10x batch simulation working | No |
| 9 | Lifetime spin counter; tiered milestone progression reset every 5 minutes | Cleaner progression system implemented | No |
| 10 | Scale up all numbers (100,000 start balance, 50 cost/spin, EV=45) | Game feels like a slower bleed with occasional big swings | No |
| 11 | Cleaner rakeback values (rounded to nearest 5, starting at 25 spins) | Rakeback numbers look less calculated | No |
| 12 | Non-uniform "long shot" goals at high milestone values (250-spin with 10% chance) | Long-shot milestone goal added | No |
| 13 | Reel colors aligned with dark theme | Reel backgrounds match dark visual theme | No |
| 14 | Cosmic theme (planets/moon emojis, star background, lock to dark mode) | Cosmic theme looks compelling | No |
| 15 | Multi-theme architecture setup | Infrastructure for theme switching set up | No |
| 16–18 | Implement 3 additional themes from visual-theme-ideas.md | Three new themes added to themes directory | No |
| 19 | Theme switcher button | Theme switching works | No |
| 20 | Spin button visual redesign | Spin button is now visually distinctive | No |

**Zero entries required human code edits.** Every feature was implemented end-to-end by AI.

### Notable AI Limitation Observed
In Entry 6 (second), the AI **refused to implement a non-linear progress bar**, but successfully implemented all surrounding functionality (milestone rewards, asymmetric fill feel, rakeback calculations). This was the only documented case of AI declining a sub-feature.

---

## Product Development Log

The final product evolved through four distinct phases:

### Phase 1 — Core Mechanics (Entries 1–5)
Established the foundational game loop: a 3x3 grid replacing the classic 3-reel line, diagonal and adjacency paylines, and a mathematically calibrated payout structure with EV ≈ 4.25 per spin cost of 5. The focus was on making every spin feel like a "win" while ensuring gradual token depletion — the classic slot machine formula.

### Phase 2 — Engagement Systems (Entries 6–12)
Added documentation, a rakeback/milestone system rewarding players at 10, 20, 50, 75, and 100 spins, a quick-spin toggle, and a 10x batch simulation mode. Scaled the number system to large balances (starting at 100,000) to obscure the real cost of play through large-number abstraction. Added non-uniform "long shot" milestone goals for progression excitement.

### Phase 3 — Visual Polish (Entries 13–20)
Implemented a full cosmic/space theme (planets, moons, star backgrounds), a multi-theme architecture allowing runtime switching, three additional themes, and a redesigned spin button. All frontend changes were kept theme-agnostic from the backend payout logic.

---

## Final Product

### Technical Architecture

The final deliverable is `candidate-028-refinement-4`, a browser-based slot machine built with:

- **`index.html`** — Main game structure and layout
- **`script.js`** — Game logic, RNG, payout system, rakeback engine, animation control
- **`styles.css`** — Visual styling and animation definitions
- **`themes/`** — Modular theme files for visual customization

### Key Features Delivered

| Feature | Status |
|---------|--------|
| 3x3 reel grid with diagonal paylines | ✅ |
| Symbol-based payout system (negative EV, positive feel) | ✅ |
| Occasional "big win" jackpot events | ✅ |
| Reel animation with visual continuity | ✅ |
| Rakeback milestone progression system | ✅ |
| Asymmetric progress bar | ✅ |
| Quick spin toggle (0.25s) | ✅ |
| 10x batch simulation mode | ✅ |
| Lifetime spin counter | ✅ |
| Multi-theme architecture | ✅ |
| 4 distinct visual themes | ✅ |
| Full code documentation | ✅ |
| Unit tests (`payout-rules.test.js`) | ✅ |

### Product Goal (from Research)
The product optimizes for: **maximize repeat play and session satisfaction without reducing clarity or trust.**

This means fast time-to-first-spin, high spins-per-session, clear understanding of balance and outcomes, and replay desire after a session.

---

## Key Findings on AI as an Engineering Tool

### What AI Did Well

**1. Speed of iteration.** Every single one of 20 feature requests was implemented without requiring human code edits. The AI moved from prompt to working feature faster than manual implementation would have allowed in every case.

**2. Complex mathematical reasoning.** Entries 2–4 required designing payout structures with specific EV targets, variance characteristics, and psychological properties. The AI implemented all of these correctly on the first attempt.

**3. Code documentation.** Entry 6 (documentation pass) produced comprehensive documentation across the entire codebase in a single prompt. This is typically a time-consuming and deferred task in student projects.

**4. Architecture setup.** Entry 15 required designing a modular theming architecture. The AI proposed and implemented a clean separation that supported three additional themes being added in subsequent entries with no refactoring needed.

**5. Incremental iteration.** The AI effectively used context from prior entries to make changes that fit the existing codebase rather than rebuilding from scratch.

### What AI Did Less Well

**1. Non-linear visual elements.** In Entry 6, the AI declined to implement a non-linear progress bar. This may reflect training data biases toward conventional UI patterns or ethical caution around psychological manipulation mechanics.

**2. Potential blind spots in design judgment.** The AI did not proactively flag several design tensions identified in the research: specifically, the "losses disguised as wins" mechanic and the use of large-number abstraction to obscure token depletion. These are technically functional but ethically complex patterns that a human engineer might pause to evaluate.

**3. No cross-entry memory without context.** The AI required the full conversation context to maintain consistency across entries. Without careful prompt construction, it could have introduced regressions.

### AI as a Force Multiplier

The most important finding from this project is that **AI did not replace engineering judgment — it amplified it.** The quality of outputs was directly proportional to the quality of inputs. Entries with detailed, specific prompts (e.g., Entry 2: specific EV target, variance bounds, increment size) produced exactly the right output. Vague prompts produced adequate but less precise results.

The human role shifted from writing code to: researching the problem space, writing precise specifications, reviewing outputs, and catching design-level issues the AI did not raise independently.

---

## Conclusions

### Summary of Findings

1. **Generative AI is a highly effective engineering tool for well-scoped feature work.** All 20 development entries were completed without human code edits, demonstrating a consistent success rate on iterative feature requests.

2. **Research quality directly determines AI output quality.** The team's thorough pre-development research (8 individual research documents, 3 personas, user stories, system prompt) gave the AI the context it needed to make product-coherent decisions. Skipping this step would have produced technically correct but product-incorrect outputs.

3. **AI excels at execution; humans are still essential for specification.** The most valuable human contributions were: identifying the right product direction, writing precise prompts with mathematical constraints, and reviewing outputs for design-level correctness.

4. **AI has identifiable limits.** The refusal to implement a non-linear progress bar (Entry 6) and the lack of proactive ethical flagging on psychological manipulation mechanics are consistent and predictable limitations — not random failures.

5. **The "zero human edits" outcome should be interpreted carefully.** While it demonstrates AI capability, it also reflects the quality of the human-written prompts. A less experienced developer writing vaguer prompts would likely have needed more corrections.

### Recommendation for Future AI-Assisted Development

- **Invest heavily in the research and planning phase.** The quality of the system prompt and research documents was the single biggest factor in AI output quality.
- **Log all AI usage in real time.** The use log was invaluable for this report and for catching duplicate entries (Entries 4/5 appear identical, suggesting a logging error).
- **Review outputs for design judgment, not just correctness.** Code can be functionally correct but product-incorrect or ethically ambiguous. The human review pass should explicitly check for these.
- **Use AI for documentation and architecture early.** Entries 6 and 15 showed that AI can handle these high-effort, often-deferred tasks quickly when given early attention.

---

*Report compiled by CSE 110 Group 21 — "Always Bet on 21."*  
*Spring 2026 · University of California, San Diego*