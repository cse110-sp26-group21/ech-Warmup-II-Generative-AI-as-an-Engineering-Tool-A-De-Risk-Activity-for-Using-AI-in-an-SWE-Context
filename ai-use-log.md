## Entry 1
- **Goal:** Show the player the payout structure as well as begin to setup backend for payout structure modificiation.
- **Prompt Sent to AI:** lets start with showing the payout rules. can you modify the backend to have the ability to change the payout rules based on some variables as well as show these rules to the user. refer to system-rpompt.md to understand generally how to go about this.
- **AI Output Summary:** AI suggested separating game logic, UI, and payout system
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 2
- **Goal:** Make payout structure more "friendly"
- **Prompt Sent to AI:** Now lets update the script that determines the payout frequency, as well as the payout structure. Just like a real slot machine, we want users to "win" significantly more frequently than they lose, even if overall this is negative EV. Lets make it so that instead of just the 3 reels theres a 3x3 grid where diagonals and being next to each other has value too. Setup the payout structure such that the expected outcome of each spin is 4.25 with a variance of 1.5. This will ensure that over time the user is slowly burning tokens, but still feels like theyre winning. Payouts should be structured starting at 0.25 by increments of 0.25 for more precision. This will allow us to ensure there is little if not not spins that result in 0 "winnings"
- **AI Output Summary:** Almost every turn is a "win" however, tokens always go down. 3x3 grid and payout scheme implimented properly
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 3
- **Goal:** Make payout structure more "exciting", visual continuity on reels
- **Prompt Sent to AI:** Lets change it even more. We want to have EV be roughly 4.25 with insane potential variance. while most turns should sit around 4.25 it's fine to have some payout 10 or more as long as most of the time its 4 or less. Effectively we want to have a "big win" or "jackpot" every now and again. Also during the "spinning phase" we want the reels to have continuity, so at t0 what is in the top left corner goes to the middle left at t1 then at t2 the bottom left. while the outcome is predermined, we want the illusion of moving reels.
- **AI Output Summary:** big wins now occur, granted infrequently.
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 4
- **Goal:** Make payout structure even more "exciting", remove unnecesary data to the user
- **Prompt Sent to AI:** It feels like im getting 3.75 or 3.25 tokens per turn every turn. can we vary the payout structure some way, now doing incriments of 0.05 such that every turn the payouts seem based on the board more, like can we give 0.05 for every diamond or somehting such that everytime the payouts feel diffrent enough. also there should not be an every turn rebate, the payout structure should simlpy be set up in such a way. for example, every diamond is 0.05, every up graph is 0.01, etc. this will ensure it is virtually impossible to not "win". only make note of the big ticket wins in the payout rules, do not disclose EV or variance, the amount won should feel somewhat arbitrary every turn, although it is mathematically determined.
- **AI Output Summary:** Works significantly better now. Things are more "random"/"exciting"
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 5
- **Goal:** Make payout structure even more "exciting", remove unnecesary data to the user
- **Prompt Sent to AI:** It feels like im getting 3.75 or 3.25 tokens per turn every turn. can we vary the payout structure some way, now doing incriments of 0.05 such that every turn the payouts seem based on the board more, like can we give 0.05 for every diamond or somehting such that everytime the payouts feel diffrent enough. also there should not be an every turn rebate, the payout structure should simlpy be set up in such a way. for example, every diamond is 0.05, every up graph is 0.01, etc. this will ensure it is virtually impossible to not "win". only make note of the big ticket wins in the payout rules, do not disclose EV or variance, the amount won should feel somewhat arbitrary every turn, although it is mathematically determined.
- **AI Output Summary:** Works significantly better now. Things are more "random"/"exciting"
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 6
- **Goal:** Clean up the code a bit, bit of a checkpoint
- **Prompt Sent to AI:** Now lets focus on code cleanliness for a bit. Lets go through the entire codebase and add documentation to everything we have so far outlining what every method does and how things work and what the purpose is 
- **AI Output Summary:** Added lots of good docs
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 6
- **Goal:** Introduce rake back as a method of encouraging more play
- **Prompt Sent to AI:** Now lets remove the idea of "total burn". We dont want to show the user how much volume theyre running through the system but do want to give them even more insentive to play more. Lets replace this with a progress bar that fills up over the course of 100 spins and 1/10 1/5 1/2 3/4 and all the way through gives the user varying rewards. We of course want to make sure this is tunable based on our EV calculations as this is a business so we will set a cap variable for what percent of EV these will pay. Meaning if the cap is 1.0 at the 1/10 mark the system will pay exactly what 10 spins of negative ev is, meaning if the spin cost is 5 and the payout ev is 4.25 it will pay 10*.75 = 7.5. We will round the output of this formula down to the nearest 0.5 or in cases where the value is greater than say 50 to the nearest 1 and greater than 200 to the nearest 5. We also want the progress bar to fill asymetrically. early on the user should feel like they are making incredible progress towards the goal, and later on as they are super close they should always feel like they are on the cusp. The 1/10, 1/5, etc are arbitrary and should be set up in a array that has the number of spins to hit the "target". For example in this case we would have an array of 10, 20, 50, 75, 100. after 100 spins the bar will reset. We also want the Rake back cap variable to consider previous payouts, so the payout at 20 should be for the last 10 spins(20-10) and at 100 should be the last 25 (100-75).
- **AI Output Summary:** AI refused to make a non-linear progress bar. Payouts and everything else work well.
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 7
- **Goal:** Add ability for higher spin rate
- **Prompt Sent to AI:** Now lets add a quick spin toddle which makes the animation complete in just 0.25 seconds
- **AI Output Summary:** Quick spin button works like a charm
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 8
- **Goal:** Add ability for even higher spin rate/more simulations run per "spin"
- **Prompt Sent to AI:** Now lets add 2 more toggles to simulate 10 spins at a time. This will cost 10 times the tokens, give rewards for each simulation run in the background, and only display on screen the spin that gave the highest rewards. This will count as 10 spins towards the rakeback
- **AI Output Summary:** Works like a charm. we have the ability to do 10 spins in background at once
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 9
- **Goal:** Make the rakeback even more exciting/more of a task progression.
- **Prompt Sent to AI:** Now lets change the rakeback to be 85% and change the spin cycle to show total number of lifetime spins. for the milestone track lets have instead of raw numbers lets do multiples. So for example we will have the starting array, which should be strictly increasing in gap, so we cannot have 20,50,75 and then incrimentatlly grows nonlinearly but slowly. For example at fisrst we have 1 spin, 5, 10, 25, 50, 85, etc. Lets cap this though at a gap of 100 spins per reward so as not to make the user feel bad and reset the number of spins required per reward tier every 5 minutes(with a timer)
- **AI Output Summary:** Works really well, new progression system seems a lot cleaner
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 10
- **Goal:** Blow up all the numbers. Make the game more appealing by making things no tied to dollars and cents but rather large currency that is harder for human mind to equate to real money
- **Prompt Sent to AI:** Now Lets blow up all the numbers. Instead of starting with 100 lets start will 100,000. While logically this should make everthing multiplied by 1000 we are not going to do that. We will make each spin cost just 50 and make EV 45. We will eliminate all wierd rounding so now everything is rounded to the nearest 1 or higher. The intention is although the balance should be draining over time it should fluctuate up and down. By using bigger numbers we also want to have the ability to have some big payouts like 10,000 or higher but usually small losses. We should preserve negative EV but setup non-linear variance such that 1 in 10 spins or so is a big win but usually we take small incimental losses. like lose 1-2 every spin on average but every 10 spins get a big win of 10 of 50 or something like this(while preserving negative EV)
- **AI Output Summary:** Works well, game "feels" like a much slower bleed now
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 11
- **Goal:** Cleaner rakeback numbers that look less calculated
- **Prompt Sent to AI:** Can you make the rakebacks all rounded down to the nearest 5, with rakebacks starting at 25 spins.
- **AI Output Summary:** Rakeback looks a lot cleaner now
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 12
- **Goal:** Make goals non-uniform at higher values
- **Prompt Sent to AI:** Now when we are at a point where every one in the row is 100 spins can we with a 10% chance add one that is 250 spins with the associated reward. like a big goal with big gain coming up.
- **AI Output Summary:** Looks great, added a "long shot" goal
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 13
- **Goal:** Align wheel colors with theme
- **Prompt Sent to AI:** Now lets add some level of theming to the wheels themselves. Instead of white background some reasonable color for the current dark theme. 
- **AI Output Summary:** Looks great, wheel color now aligns
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 14
- **Goal:** Align wheel emojis with theme and add background
- **Prompt Sent to AI:** Now lets focus on the theme of the game. Lets remove the ability to change to light mode and make some dots in the background like stars. Lets also change the emojis to be planets/the moon. We can keep the rocket as the big winner but change the others. Front end only change. The bahvior of the backend should be theme agnostic.
- **AI Output Summary:** Cosmic theming looks amazing.
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 15
- **Goal:** Setup architecture for multiple themes
- **Prompt Sent to AI:** Now lets set up architecture for multiple themes. payouts and everything on the backend will stay the same, but point to different files or folders for colors/emojis
- **AI Output Summary:** infra now setup
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 16
- **Goal:** impliment idea 1 from visual theme ideas
- **Prompt Sent to AI:** Now lets add to the themes directory the theme from  idea 1 from visual-theme-ideas.md
- **AI Output Summary:** Now in themes
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 17
- **Goal:** impliment idea 2 from visual theme ideas
- **Prompt Sent to AI:** Now lets add to the themes directory the theme from  idea 2 from visual-theme-ideas.md
- **AI Output Summary:** Now in themes
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 18
- **Goal:** impliment idea 3 from visual theme ideas
- **Prompt Sent to AI:** Now lets add to the themes directory the theme from idea 3 from visual-theme-ideas.md
- **AI Output Summary:** Now in themes
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 19
- **Goal:** add a theme switcher button
- **Prompt Sent to AI:** Now lets add a button that switches between the themes
- **AI Output Summary:** Works like a charm. have cool themes now
- **Issues Found:** None
- **Human Edits Needed?:** No

## Entry 20
- **Goal:** make the spin button look cool
- **Prompt Sent to AI:** make the spin button look cool. right now its just a white box that says spin. it doesnt need to align with the theming per se, just look cool.
- **AI Output Summary:** Spin button looks cool now
- **Issues Found:** None
- **Human Edits Needed?:** No