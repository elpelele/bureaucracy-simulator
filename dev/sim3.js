// ===== FULL-RUN PACING SIM (run via dev/sim.sh) =====
// Greedy bot: 5 clicks/s, buys everything affordable, fights bosses.
// NOTE: each "->" line reports the duration of the stage JUST COMPLETED.
let fakeNow = Date.now();
Date.now = () => fakeNow;
lastTick = fakeNow;

const evt = { clientX: 0, clientY: 0 };

// SIM_ABSURDITY=5477 ./dev/sim.sh -> simulates a post-reform run
if (typeof process !== 'undefined' && process.env.SIM_ABSURDITY) {
  gainAbsurdity(parseFloat(process.env.SIM_ABSURDITY));
  recalcAll();
  console.log(`(post-reform run: absurdity=${formatNumber(game.absurdity)}, production x${absurdityFactor().toFixed(1)})`);
}
let simSeconds = 0;
let lastStageAt = 0;

function hms(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
}

function tryBuyEverything() {
  game.buyQuantity = 1;
  const buyable = STAFF.filter(st => isStaffUnlocked(st))
    .sort((a, b) => getCostForN(a, 1) - getCostForN(b, 1));
  for (const st of buyable) {
    while (canAfford(getCostForN(st, 1), st.costCurrency) && game.forms > getCostForN(st, 1) * 2) buyStaff(st.id);
  }
  UPGRADES.forEach(u => {
    if (stageIdx(u.stage) <= game.stageIndex && u.unlocked() && !game.purchasedUpgrades.has(u.id) && canAfford(u.cost, u.costCurrency)) buyUpgrade(u.id);
  });
  DEPARTMENTS.forEach(d => {
    if (stageIdx(d.stage) <= game.stageIndex && !d.owned && d.unlocked() && canAfford(d.cost, d.costCurrency)) buyDepartment(d.id);
  });
  POLICIES.forEach(pl => {
    if (stageIdx(pl.stage) <= game.stageIndex && !game.purchasedPolicies.has(pl.id) && pl.unlocked() && canAfford(pl.cost, pl.costCurrency)) buyPolicy(pl.id);
  });
  INVESTMENTS.forEach(i => {
    let cost = getInvestmentCost(i, i.level);
    while (i.unlocked() && i.level < i.maxLevel && game.stamps >= cost) {
      buyInvestment(i.id);
      cost = getInvestmentCost(i, i.level);
    }
  });
}

const MAX = 48 * 3600; // 48h sim cap
console.log('stage transitions (active play, 5 clicks/s, greedy buying):');
while (game.stageIndex < 5 && simSeconds < MAX) {
  for (let i = 0; i < 5; i++) {
    fakeNow += 200;
    tick();
    processClick(evt);
  }
  simSeconds++;
  if (simSeconds % 5 === 0) tryBuyEverything();
  // an attentive player answers incidents/directives instead of eating debuffs
  if (game.directive.active) chooseDirective(Math.random() < 0.5 ? 'a' : 'b');
  if (bossPending() && Date.now() >= game.boss.cooldownUntil) {
    startBossFight();
    let g = 0;
    while (game.boss.active && g < 500) { fakeNow += 100; clickTimes.length = 0; attackBoss(evt); g++; }
    if (game.stageIndex >= 1) {
      const stage = STAGES[game.stageIndex];
      console.log(`  -> ${stage.name.padEnd(24)} at ${hms(simSeconds)} (previous stage took ${hms(simSeconds - lastStageAt)}) | fps=${formatNumber(game.formsPerSec)} | staff=${getTotalStaff()} | mult=x${formatNumber(game.globalMultiplier)}`);
      lastStageAt = simSeconds;
    }
  }
}

if (game.stageIndex >= 5) {
  // final stage: run until The Final Form is purchased or 6 more sim-hours
  const start = simSeconds;
  while (!game.purchasedUpgrades.has('the_final_form') && simSeconds - start < 6 * 3600) {
    for (let i = 0; i < 5; i++) { fakeNow += 200; tick(); processClick(evt); }
    simSeconds++;
    if (simSeconds % 5 === 0) tryBuyEverything();
  }
  console.log(`  -> The Final Form ${game.purchasedUpgrades.has('the_final_form') ? 'purchased' : 'NOT purchased'} at ${hms(simSeconds)} (final stage: ${hms(simSeconds - start)}+)`);
} else {
  console.log(`  (stopped at ${STAGES[game.stageIndex].name} after ${hms(simSeconds)} — cap reached)`);
  console.log(`  totalForms=${formatNumber(game.totalForms)} fps=${formatNumber(game.formsPerSec)} next threshold=${formatNumber((STAGES[game.stageIndex + 1] || {}).threshold || 0)}`);
}
console.log(`\nreform gain if reforming now: +${formatNumber(reformGain())} absurdity`);
process.exit(0);
