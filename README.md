# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/nandorp28/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/nandorp28/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

SIMMER & SERVE — run a night-market kitchen for one 3-minute rush: pick 6 ingredients, chop, wok, plate and serve 6 original recipes to 4 impatient customers before their patience runs out. 3 hearts, combo tips, burn risk, 1/2/3-star shifts.

## Run it

```sh
node --version  # 22.18 or later
python3 -m http.server 8080 --directory game
# open http://localhost:8080 in desktop Chrome
```

Or open `game/index.html` through any static server — the game loads no network resources at all. `main.ts` hands the game in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## How to play

1. **Pick** an ingredient from the bins (click, or keys 1–6). The chef carries one at a time.
2. **Chop** chicken, chilli and greens on the CHOP BOARD (2.5 s each) — other ingredients stage straight onto the tray from the board.
3. **Cook** the tray on the STOVE — every dish needs its exact ingredients; a finished dish burns if left 6 s.
4. **Plate** the dish on the SERVE COUNTER, then **click the matching order** to serve it. Fast serves pay tips; consecutive serves build a x1.00–x2.00 combo.
5. Reach **150 coins** before the 3:00 shift ends (120/180/260 coins = 1/2/3 stars). Lose a heart when a customer walks out; 3 lost hearts ends the shift.

## The kitchen

- **6 recipes**: Mie Goreng, Chicken Rice, Chilli Noodle, Broth Bowl, Egg Fried Rice, Ayam Penyet — each with its own ingredient set, cook time and price.
- **3 stations**: chop board, two-burner stove, serve counter — plus a trash bin for burned pans.
- **4 order slots** with live patience bars and moods; orders spawn every 12 s.
- **Synthesised sound** (WebAudio, no files): chop, sizzle, serve ding, burn alarm, win/lose jingles. M mutes.
- **Screenshots** are real renders of the game's own code in a browser (`?scene=cover|orders|cook|serve` loads mid-play states).

---

<sub>Entered on [make.fun](https://make.fun/?ref=qyk2abaw&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
