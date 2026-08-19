// ===== SMOKE TESTS (appended after game scripts — run via dev/test.sh) =====
let __pass = 0, __fail = 0;
function assert(cond, label) {
  if (cond) { __pass++; console.log('  ✓ ' + label); }
  else { __fail++; console.log('  ✗ FAIL: ' + label); }
}
function resetClickLimiter() { clickTimes.length = 0; }
const fakeEvt = { clientX: 0, clientY: 0 };

console.log('--- 1. Initial state ---');
assert(game.formsPerSec === 0, 'no production at start');
assert(game.formsPerClick === 1 && game.clickMultiplier === 1, 'click power = 1');
assert(game.stageIndex === 0, 'starts at The Office');

console.log('--- 2. Click rate cap ---');
for (let i = 0; i < 30; i++) processClick(fakeEvt);
assert(game.totalClicks === 15, `30 rapid clicks -> only 15 counted (got ${game.totalClicks})`);
assert(game.forms === 15, 'forms match counted clicks');
resetClickLimiter();

console.log('--- 3. Staff purchase, active vs idle production ---');
game.forms = 1000;
game.buyQuantity = 1;
buyStaff('intern');
assert(STAFF.find(s => s.id === 'intern').owned === 1, 'intern hired');
assert(Math.abs(game.formsPerSec - 0.1 * game.globalMultiplier) < 1e-9, 'fps reflects intern');
// ACTIVE player: production flows straight into forms, inbox untouched
game.lastActiveAt = Date.now();
game.inbox = 0;
const formsBeforeActive = game.forms;
lastTick = Date.now() - 10000; // simulate 10s elapsed
tick();
assert(game.forms - formsBeforeActive > 0.9, `active: 10s of production went straight to forms (+${(game.forms - formsBeforeActive).toFixed(2)})`);
assert(game.inbox < 0.01, 'active: inbox stays empty');
// IDLE player (no input for 2 min): production piles up in the inbox
game.lastActiveAt = Date.now() - 120000;
const formsBeforeIdle = game.forms;
lastTick = Date.now() - 10000;
tick();
assert(game.inbox > 0.9 && game.inbox < 1.2, `idle: 10s of production landed in inbox (${game.inbox.toFixed(2)})`);
assert(Math.abs(game.forms - formsBeforeIdle) < 0.01, 'idle: forms counter did not move');
const beforeCollect = game.forms;
resetClickLimiter();
processClick(fakeEvt);
assert(game.inbox < 1, 'click collected the inbox');
assert(game.forms > beforeCollect, 'forms went up on collect');
resetClickLimiter();

console.log('--- 4. Inbox cap (overnight simulation) ---');
game.inbox = 0;
game.lastActiveAt = Date.now() - 8 * 3600 * 1000; // walked away 8h ago
const cap = getInboxCapacity();
lastTick = Date.now() - 8 * 3600 * 1000; // 8h "overnight"
tick();
assert(Math.abs(game.inbox - cap) < 1e-6, `8h idle -> inbox capped at ${cap.toFixed(0)} (30 min of prod), got ${game.inbox.toFixed(0)}`);
game.lastActiveAt = Date.now(); // back at the desk for the rest of the tests

console.log('--- 5. Stamp economy: NO refund exploit ---');
game.totalForms = 5000;
game.stampMilestones = 0;
game.stamps = 0;
lastTick = Date.now();
tick();
assert(Math.floor(game.stamps) === 5, `milestones granted 5 stamps (got ${game.stamps})`);
game.stamps -= 3; // spend 3
resetClickLimiter();
processClick(fakeEvt);
lastTick = Date.now();
tick();
assert(game.stamps < 3, `spent stamps NOT refunded by clicking/ticking (got ${game.stamps.toFixed(2)})`);

console.log('--- 6. Investments & upgrades via recalc ---');
game.stamps = 100;
const multBefore = game.globalMultiplier;
buyInvestment('efficiency_training');
assert(INVESTMENTS.find(i => i.id === 'efficiency_training').level === 1, 'investment level 1');
assert(game.globalMultiplier > multBefore, 'global multiplier increased');
assert(game.stamps < 100, 'stamps were spent');
const stampsAfterInvest = game.stamps;
resetClickLimiter();
processClick(fakeEvt);
assert(Math.abs(game.stamps - stampsAfterInvest) < 1, 'still no refund after investment');
game.forms = 500;
buyUpgrade('better_stamp');
assert(game.formsPerClick === 2, 'better_stamp applied via recalcAll');

console.log('--- 7. Boss fight gates the stage ---');
game.totalForms = 1.2e6;
assert(bossPending(), 'boss pending at 1.2M forms');
assert(getCurrentStage().id === 'office', 'stage does NOT advance without boss kill');
startBossFight();
assert(game.boss.active && game.boss.hp > 0, 'boss fight started');
let guard = 0;
while (game.boss.active && guard < 200) {
  resetClickLimiter();
  attackBoss(fakeEvt);
  guard++;
}
assert(game.stageIndex === 1, `boss defeated -> Administration (took ${guard} attacks)`);
// ~40 base hits, minus random crits (10% chance, x5 dmg); theoretical minimum
// with all crits is 8, so the honest lower bound is 7
assert(guard >= 7 && guard <= 60, `fight required real clicking: ${guard} attacks`);
assert(game.bossesDefeated === 1, 'boss counter incremented');
assert(game.unlocks.expeditions, 'expeditions unlocked at Administration');

console.log('--- 8. Expedition ---');
STAFF.find(s => s.id === 'intern').owned = 10;
recalcAll();
toggleExpeditionStaff('intern');
assert(game.expedition.team.includes('intern'), 'intern squad selected');
const fpsBeforeExp = game.formsPerSec;
launchExpedition('unstable_pile');
assert(game.expedition.active, 'expedition launched');
assert(game.formsPerSec < fpsBeforeExp, 'production drops while squad is away');
const realRandom = Math.random;
Math.random = () => 0.01; // force success
game.expedition.endTime = Date.now() - 1;
expeditionTick(Date.now());
Math.random = realRandom;
assert(!game.expedition.active, 'expedition resolved');
assert(game.expeditionsWon === 1, 'expedition won');
assert(game.absurdity >= 1, `absurdity gained (${game.absurdity})`);
assert(game.relics.has('ancient_stamp'), 'relic granted on first kill');
assert(game.clickMultiplier > 1, 'relic effect active after recalc (+25% click)');

console.log('--- 9. Reform (prestige) ---');
game.totalForms = 4e9;
game.stageIndex = 2;
const absBefore = game.absurdity;
const expectedGain = Math.floor(Math.sqrt(4));
assert(canReform(), 'reform available');
doReform();
assert(game.absurdity === absBefore + expectedGain, `absurdity +${expectedGain}`);
assert(game.forms === 0 && game.totalForms === 0 && game.stageIndex === 0, 'run reset');
assert(STAFF.every(s => s.owned === 0), 'staff reset');
assert(game.purchasedUpgrades.size === 0, 'upgrades reset');
assert(game.relics.has('ancient_stamp'), 'relics kept');
assert(game.reformCount === 1, 'reform counted');
assert(game.globalMultiplier > 1, 'permanent bonuses (absurdity+achievements) survive reform');
assert(game.totalFormsAllTime > 0, 'lifetime forms kept');

console.log('--- 10. Save / load round-trip ---');
game.forms = 12345;
game.stamps = 67;
STAFF.find(s => s.id === 'intern').owned = 3;
recalcAll();
saveGame();
const fpsSaved = game.formsPerSec;
game.forms = 0; game.stamps = 0;
STAFF.find(s => s.id === 'intern').owned = 999;
loadGame();
assert(game.forms === 12345 && game.stamps === 67, 'resources restored');
assert(STAFF.find(s => s.id === 'intern').owned === 3, 'staff restored');
assert(Math.abs(game.formsPerSec - fpsSaved) < 1e-9, 'derived stats identical after reload');

console.log('--- 11. v2 save migration ---');
localStorage.setItem('bureaucracy_save', JSON.stringify({
  version: 2,
  forms: 5e6, stamps: 100, stampMilestones: 4000, absurdity: 0,
  totalForms: 5e6, totalClicks: 500, startTime: Date.now() - 1000,
  formsPerClick: 999, globalMultiplier: 999, clickMultiplier: 999, // stale derived junk
  stampsPerSec: 999, staffCostMultiplier: 0.1, negativeEventMultiplier: 9,
  currentStage: 'administration', highestStage: 'administration',
  unlocks: { departments: true, policies: true, absurdity: true, reforms: false },
  purchasedUpgrades: ['better_stamp'],
  activePolicies: [], unlockedAchievements: ['first_form'],
  staff: [{ id: 'intern', owned: 5, fps: 0.15 }],
  departments: [{ id: 'hr', owned: true }],
  investments: [{ id: 'efficiency_training', level: 3 }]
}));
// wipe current run state so load fills it
game.relics.clear(); game.absurdity = 0; game.reformCount = 0; game.bossesDefeated = 0;
loadGame();
assert(game.stageIndex === 1, 'v2: stage derived from totalForms (Administration)');
assert(game.bossesDefeated === 1, 'v2: past stages grandfathered as boss kills');
assert(game.formsPerClick === 2, 'v2: stale formsPerClick=999 discarded, recomputed from upgrades');
assert(STAFF.find(s => s.id === 'intern').fps === 0.1, 'v2: stale staff fps discarded');
assert(game.totalStampsEarned === 5000, 'v2: lifetime stamps estimated from totalForms');
assert(game.stampMilestones === 5000, 'v2: milestones synced to totalForms (no refund burst)');
assert(DEPARTMENTS.find(d => d.id === 'hr').owned, 'v2: departments restored');
assert(INVESTMENTS.find(i => i.id === 'efficiency_training').level === 3, 'v2: investments restored');

console.log('--- 12. Offline progress ---');
STAFF.find(s => s.id === 'intern').owned = 10;
recalcAll();
game.inbox = 0;
saveGame();
const raw = JSON.parse(localStorage.getItem('bureaucracy_save'));
raw.savedAt = Date.now() - 3600 * 1000; // saved 1h ago
localStorage.setItem('bureaucracy_save', JSON.stringify(raw));
loadGame();
assert(game.inbox > 0, `offline production landed in inbox (${game.inbox.toFixed(0)})`);
assert(game.inbox <= getInboxCapacity() + 1e-6, 'offline gains respect inbox cap');

console.log('--- 13. Misc ---');
assert(formatNumber(1.23e37) === '1.23e+37', 'huge numbers -> scientific notation');
assert(formatNumber(1500) === '1.50K', 'K formatting intact');
game.negativeEventMultiplier = 1;
game.forms = 1000;
const lost = eventLoss(0.1);
assert(lost === 100 && game.forms === 900, 'eventLoss basic');
game.relics.add('red_stapler');
game.forms = 1000;
const lost2 = eventLoss(0.1);
assert(lost2 === 69 || lost2 === 70, `red stapler softens losses (lost ${lost2})`);
// weighted event pick never crashes
game.forms = 1e6; game.lastEvent = 0;
const realRandom2 = Math.random;
Math.random = () => 0.001;
triggerRandomEvent();
Math.random = realRandom2;
assert(true, 'triggerRandomEvent runs without error');

console.log('--- 14. Hard reset survives the beforeunload save ---');
saveGame();
assert(localStorage.getItem('bureaucracy_save') !== null, 'save exists before reset');
hardReset(); // confirm() stubbed to true, location.reload() is a noop
assert(localStorage.getItem('bureaucracy_save') === null, 'hard reset wiped the save');
saveGame(); // simulates the beforeunload handler firing during reload
assert(localStorage.getItem('bureaucracy_save') === null, 'auto-save suppressed during reset (save stays wiped)');
suppressSaving = false;

console.log('--- 15. Settings ---');
settings.darkMode = true;
saveSettings();
settings.darkMode = false;
loadSettings();
assert(settings.darkMode === true, 'settings persist through save/load');
assert(document.body.classList.contains('dark'), 'dark class applied to body');
setStageClass('ministry');
assert(document.body.className.includes('dark'), 'stage change preserves dark mode');
toggleDarkMode(false);
assert(!document.body.classList.contains('dark'), 'dark mode toggles off');
playSound('stamp'); // no AudioContext in the stub: must not throw
assert(true, 'playSound safe without AudioContext');

console.log('--- 16. QoL: bulk investments, collapse persistence, rampage ---');
game.buyQuantity = 10;
game.stamps = 1e6;
const sp = INVESTMENTS.find(i => i.id === 'stamp_press');
const lvlBefore = sp.level;
buyInvestment('stamp_press');
assert(sp.level === lvlBefore + 10, `x10 bought 10 levels (${lvlBefore} -> ${sp.level})`);
game.buyQuantity = -1;
game.stamps = getInvestmentCostForN(sp, 3); // enough for exactly 3
buyInvestment('stamp_press');
assert(sp.level === lvlBefore + 13, `Max bought exactly what was affordable (${sp.level})`);
game.buyQuantity = 100;
game.stamps = 1e15;
buyInvestment('stamp_press');
assert(sp.level === sp.maxLevel, 'x100 capped at maxLevel');
game.buyQuantity = 1;

game.collapsedStages.add('staff:office');
saveGame();
game.collapsedStages.clear();
loadGame();
assert(game.collapsedStages.has('staff:office'), 'collapsed sections persist through save/load');
game.collapsedStages.clear();

game.inbox = 0;
game.rampageUntil = Date.now() + 5000;
resetClickLimiter();
const beforeRampage = game.forms;
processClick(fakeEvt);
const rampageGain = game.forms - beforeRampage;
assert(rampageGain >= game.formsPerClick * game.clickMultiplier * 77, `rampage multiplies clicks x77 (gained ${formatNumber(rampageGain)})`);
game.rampageUntil = 0;

console.log('--- 17. Absurdity curve & Council directives ---');
game.totalAbsurdityEarned = 100;
recalcAll();
assert(absurdityFactor() > 2 && absurdityFactor() < 3, `lifetime absurdity 100 -> x${absurdityFactor().toFixed(2)} (gentle curve)`);
game.totalAbsurdityEarned = 5477; // cosmic-entry reform scale
recalcAll();
assert(absurdityFactor() > 4 && absurdityFactor() < 7, `cosmic-scale reform -> x${absurdityFactor().toFixed(1)}, no longer x110`);
game.totalAbsurdityEarned = 0;
recalcAll();

game.stageIndex = 3;
game.directive = { active: true, id: 'budget_hearing', expiresAt: Date.now() + 60000 };
chooseDirective('a');
assert(!game.directive.active, 'directive resolved by choosing');
assert(prodBuffFactor(Date.now()) === 1.5, 'production buff active after choice');
game.buffs.prodUntil = 0;
game.directive = { active: true, id: 'summit', expiresAt: Date.now() - 1 };
directiveTick(Date.now());
assert(!game.directive.active, 'unanswered directive expires');
game.directive = { active: true, id: 'audit_committee', expiresAt: Date.now() + 60000 };
const absBeforeDir = game.absurdity;
chooseDirective('a');
assert(game.absurdity === absBeforeDir + 2, 'audit committee grants +2 absurdity');

console.log('--- 18. Toggleable policies, click %, staff training ---');
game.stageIndex = 1;
game.totalForms = 2e6;
game.forms = 20e6;
buyPolicy('mandatory_overtime');
assert(game.purchasedPolicies.has('mandatory_overtime') && game.activePolicies.has('mandatory_overtime'), 'policy enacted (paid once)');
const multWith = game.globalMultiplier;
togglePolicy('mandatory_overtime');
assert(game.activePolicies.has('mandatory_overtime'), 'toggle blocked right after enacting (60s processing)');
game.policyCooldowns['mandatory_overtime'] = 0;
togglePolicy('mandatory_overtime');
assert(!game.activePolicies.has('mandatory_overtime') && game.purchasedPolicies.has('mandatory_overtime'), 'policy suspended, still owned');
assert(game.globalMultiplier < multWith, 'suspension removed the bonus');
assert(game.negativeEventMultiplier === 1, 'suspension removed the malus too');
game.policyCooldowns['mandatory_overtime'] = 0;
togglePolicy('mandatory_overtime');
assert(game.activePolicies.has('mandatory_overtime'), 'policy reactivated for free');
game.policyCooldowns['mandatory_overtime'] = 0;
togglePolicy('mandatory_overtime'); // suspend again
saveGame();
game.purchasedPolicies.clear();
game.activePolicies.clear();
loadGame();
assert(game.purchasedPolicies.has('mandatory_overtime') && !game.activePolicies.has('mandatory_overtime'), 'suspended state survives save/load');

game.purchasedUpgrades.add('click_nuke');
STAFF.find(st => st.id === 'intern').owned = 100;
recalcAll();
const expectedClick = game.formsPerClick * game.clickMultiplier + game.formsPerSec * 0.01;
assert(Math.abs(effectiveClickBase() - expectedClick) < 1e-9, `click gains +1% of production (${formatNumber(effectiveClickBase())})`);
game.purchasedUpgrades.delete('click_nuke');

game.purchasedUpgrades.add('civil_exam');
recalcAll();
assert(Math.abs(STAFF.find(st => st.id === 'civil_servant').fps - 140) < 1e-9, 'Civil Service Exam: administration staff +40%');
game.purchasedUpgrades.delete('civil_exam');
recalcAll();

console.log('--- 19. Absurdity perks & office incidents ---');
gainAbsurdity(50000);
const lifetimeBefore = game.totalAbsurdityEarned;
const factorBefore = absurdityFactor();
const balanceBefore = game.absurdity;
buyPerk('muscle_memory');
assert(game.purchasedPerks.has('muscle_memory'), 'perk purchased');
assert(game.absurdity === balanceBefore - 60, `balance debited by the perk cost (${game.absurdity})`);
assert(game.totalAbsurdityEarned === lifetimeBefore, 'lifetime untouched by spending');
assert(Math.abs(absurdityFactor() - factorBefore) < 1e-12, 'production bonus unchanged after spending');
assert(game.clickMultiplier >= 1.5, 'muscle memory applied via recalc');
buyPerk('severance_package');
buyPerk('inspectors_weak_spot');
game.totalForms = 4e9;
game.stageIndex = 2;
doReform();
assert(STAFF.find(st => st.id === 'intern').owned === 5 && game.forms === 1000, 'Severance Package: head start after reform');
assert(game.purchasedPerks.has('muscle_memory'), 'perks survive reform');
game.forms = 1e6;
const hpNormal = Math.floor(bossClickDamage() * 40);
game.totalForms = 1.2e6;
startBossFight();
assert(game.boss.maxHp <= hpNormal * 0.76, `Inspector's Weak Spot: boss HP reduced (${formatNumber(game.boss.maxHp)} vs ${formatNumber(hpNormal)})`);
game.boss.active = false;

game.stageIndex = 1;
game.directive = { active: true, id: 'coffee_crisis', expiresAt: Date.now() - 1 };
directiveTick(Date.now());
assert(!game.directive.active, 'ignored incident resolves itself');
assert(prodBuffFactor(Date.now()) < 1, `...badly: production debuff active (x${prodBuffFactor(Date.now())})`);
game.buffs.prodDebuffUntil = 0;
game.directive = { active: true, id: 'lost_folder', expiresAt: Date.now() + 60000 };
const absBeforeInc = game.absurdity;
chooseDirective('a');
assert(game.absurdity === absBeforeInc + 1, 'reconstructing folder B-12 grants +1 absurdity');

console.log('--- 20. Panel spawn path ---');
game.directive.active = false;
game.stageIndex = 0;
game.lastActiveAt = Date.now();
game.nextDirectiveAt = Date.now() - 1;
directiveTick(Date.now());
assert(!game.directive.active, 'no panels at The Office');
game.stageIndex = 1;
game.lastActiveAt = Date.now() - 600000; // AFK player
game.nextDirectiveAt = Date.now() - 1;
directiveTick(Date.now());
assert(!game.directive.active, 'no panels while the player is away');
game.lastActiveAt = Date.now(); // present player
directiveTick(Date.now());
assert(game.directive.active, 'panel spawns at Administration for an active player');
const spawned = DIRECTIVES.find(d => d.id === game.directive.id);
assert(spawned && (spawned.minStage !== undefined ? spawned.minStage : 3) <= 1, 'only stage-appropriate panels are drawn');
game.directive.active = false;

console.log('--- 21. Console dev helpers ---');
game.directive.active = false;
game.stageIndex = 0; // dev.panel must bypass stage gating
const panelMsg = window.dev.panel('coffee_crisis');
assert(game.directive.active && game.directive.id === 'coffee_crisis', `dev.panel forces a panel even at The Office (${panelMsg})`);
game.directive.active = false;
assert(window.dev.panel('nope').startsWith('unknown id'), 'dev.panel rejects unknown ids with the list');

console.log('--- 22. Monster adaptation is per-run ---');
game.monsterKillsRun = { unstable_pile: 3 };
game.monsterKills.unstable_pile = (game.monsterKills.unstable_pile || 0) + 3;
const pileM = MONSTERS.find(x => x.id === 'unstable_pile');
assert(Math.abs(monsterPower(pileM) - pileM.power * Math.pow(2.5, 3)) < 1e-9, 'adaptation follows THIS run\'s kills');
game.totalForms = 4e9;
game.stageIndex = 2;
doReform();
assert(monsterPower(pileM) === pileM.power, 'archives reshuffle: adaptation resets on reform');
assert((game.monsterKills.unstable_pile || 0) >= 3, 'lifetime kill count preserved for achievements');

console.log('--- 23. Policy downsides bite (and stop when suspended) ---');
game.stageIndex = 1;
game.purchasedPolicies.clear();
game.activePolicies.clear();
recalcAll();
const intern23 = STAFF.find(st => st.id === 'intern');
const costBefore = getCostForN(intern23, 1);
game.purchasedPolicies.add('mandatory_overtime');
game.activePolicies.add('mandatory_overtime');
recalcAll();
assert(getCostForN(intern23, 1) > costBefore, `Mandatory Overtime raises staff prices (${costBefore} -> ${getCostForN(intern23, 1)})`);
game.policyCooldowns['mandatory_overtime'] = 0;
togglePolicy('mandatory_overtime');
assert(getCostForN(intern23, 1) === costBefore, 'suspending it restores prices');
const prodBefore = game.globalMultiplier;
game.purchasedPolicies.add('expedited_stamps');
game.activePolicies.add('expedited_stamps');
recalcAll();
assert(game.globalMultiplier < prodBefore, 'Expedited Stamp Lane costs production');
assert(game.stampsMultiplier >= 1.5, '...but boosts stamps');
game.activePolicies.delete('expedited_stamps');
recalcAll();

console.log('--- 24. Late-game stamp sinks ---');
STAFF.find(st => st.id === 'intern').owned = 10;
recalcAll();
game.expedition.team = ['intern'];
launchExpedition('unstable_pile');
assert(game.expedition.active, 'expedition launched for rush test');
game.stampsPerSec = 100; // pretend late-game stamp income
const rushCost = expeditionRushCost();
assert(rushCost > 0, `rush has a real cost (${formatNumber(rushCost)} stamps)`);
game.stamps = rushCost - 1;
rushExpedition();
assert(game.expedition.active, 'cannot rush without enough stamps');
game.stamps = rushCost + 10;
const rushedAt = game.expeditionsRushed;
rushExpedition();
assert(game.expeditionsRushed === rushedAt + 1 && game.expedition.endTime <= Date.now(), 'rush paid: squad returns now');
const realRandom24 = Math.random;
Math.random = () => 0.01;
expeditionTick(Date.now() + 1);
Math.random = realRandom24;
assert(!game.expedition.active, 'rushed expedition resolves on next tick');

game.totalStampsEarned = 1e12;
game.stamps = 5e12;
game.buyQuantity = 1;
const cab = INVESTMENTS.find(i => i.id === 'golden_cabinets');
assert(cab.unlocked(), 'Golden Cabinets available late game');
const multBeforeCab = game.globalMultiplier;
buyInvestment('golden_cabinets');
assert(cab.level === 1 && game.globalMultiplier > multBeforeCab, 'endless sink buys +2% production');
assert(getInvestmentCost(cab, cab.level) === 3e12, 'next level costs x3 (always a next target)');

console.log('--- 25. Shadow Budget (repeatable absurdity sink) ---');
gainAbsurdity(600e3);
const sbLvl = game.shadowBudgetLevel;
const sbCostBefore = shadowBudgetCost();
const multBeforeSB = game.globalMultiplier;
buyShadowBudget();
assert(game.shadowBudgetLevel === sbLvl + 1, 'shadow budget level bought');
assert(game.globalMultiplier > multBeforeSB, '+5% production applied');
assert(shadowBudgetCost() === sbCostBefore * 5, 'next level costs x5');
game.totalForms = 4e9;
game.stageIndex = 2;
doReform();
assert(game.shadowBudgetLevel === sbLvl + 1, 'shadow budget survives reform');

console.log('--- 26. Stamp multiplier is global; golden rewards; discreet mode ---');
game.stampsMultiplier = 2;
const stampsBefore26 = game.stamps;
gainStamps(10);
assert(Math.abs(game.stamps - stampsBefore26 - 20) < 1e-9, 'gainStamps applies the multiplier to every gain');
game.stampMilestones = Math.floor(game.totalForms / 1000);
game.totalForms += 1000;
const stampsBeforeMile = game.stamps;
lastTick = Date.now();
tick();
assert(game.stamps - stampsBeforeMile >= 2, `milestone stamps are multiplied too (+${(game.stamps - stampsBeforeMile).toFixed(1)})`);
game.stampsMultiplier = 1;

game.purchasedUpgrades.add('golden_stamp');
recalcAll();
assert(game.goldenRewardMultiplier === 1.5, 'Golden Stamp boosts priority form rewards (no longer a click x2 duplicate)');
game.purchasedUpgrades.delete('golden_stamp');
const af = INVESTMENTS.find(i => i.id === 'automation_fund');
af.level = 3;
recalcAll();
assert(Math.abs(game.clickFpsPercent - 0.003) < 1e-12, 'Automation Fund now feeds clicks (%% of production), no longer a duplicate of Efficiency Training');
af.level = 0;
recalcAll();

settings.discreet = true;
const imprintsBefore = imprintCount;
stampImprint(10, 10, 'APPROVED');
assert(imprintCount === imprintsBefore, 'discreet mode: no stamp imprints spawned');
spawnDeskPapers(1);
paperConfetti(5);
assert(true, 'discreet mode: desk papers and confetti are no-ops');
settings.discreet = false;

console.log('--- 27. Counters & QoL helpers ---');
game.stampsPerSec = 10;
game.stampsMultiplier = 2;
STAFF.find(st => st.id === 'intern').owned = 100; // some fps
recalcAll();
game.stampsPerSec = 10;
game.stampsMultiplier = 2;
const expectedIncome = (10 + game.formsPerSec / 1000) * 2;
assert(Math.abs(stampIncomePerSec() - expectedIncome) < 1e-9, `stamp income counter includes milestones (${formatNumber(stampIncomePerSec())}/s)`);
game.forms = 0;
const eta = affordEtaText(game.formsPerSec * 60, 'forms');
assert(eta.includes('1m'), `affordability ETA shown (${eta.trim()})`);
game.forms = 1e12;
assert(affordEtaText(100, 'forms') === '', 'no ETA when already affordable');
game.stampsPerSec = 0;
game.stampsMultiplier = 1;
recalcAll();

console.log('--- 28. Counter smoothing: spends and big jumps are instant ---');
assert(smoothTowards(1000, 400) === 400, 'spending snaps down instantly');
assert(smoothTowards(0, 1e6) === 1e6, 'huge arrivals snap up instantly');
assert(smoothTowards(999, 1000) === 1000, 'tiny gaps settle crisply (no decimal crawl)');
const mid = smoothTowards(800, 1000);
assert(mid > 800 && mid < 1000, 'mid-range gains animate smoothly');

console.log('--- 29. Sections auto-unfold for buyable items ---');
game.collapsedStages.add('departments:office');
assert(effectiveCollapsed('departments', 'office', true, false) === false, 'affordable item -> section unfolds despite collapse');
assert(effectiveCollapsed('departments', 'office', false, true) === true, 'everything bought -> section folds itself');
assert(effectiveCollapsed('departments', 'office', false, false) === true, 'otherwise the manual collapse is respected');
game.collapsedStages.delete('departments:office');
assert(effectiveCollapsed('departments', 'office', false, false) === false, 'and the manual open state too');

console.log('--- 30. Expedition needs 2+ of a type (half is sent) ---');
game.expedition.active = false;
game.expedition.team = [];
STAFF.find(st => st.id === 'commissioner').owned = 1;
toggleExpeditionStaff('commissioner');
assert(!game.expedition.team.includes('commissioner'), 'a single unit cannot join a squad (half of 1 is 0)');
STAFF.find(st => st.id === 'commissioner').owned = 2;
toggleExpeditionStaff('commissioner');
assert(game.expedition.team.includes('commissioner'), 'two units make the type eligible (sends 1)');
game.expedition.team = [];
STAFF.find(st => st.id === 'commissioner').owned = 0;

console.log('--- 31. Policies tab holds only trade-offs; old saves migrate ---');
assert(POLICIES.length === 4 && POLICIES.every(pl => pl.downside), 'every remaining policy declares a downside');
assert(UPGRADES.find(u => u.id === 'triple_redundancy'), 'former bonus-only policies now live in UPGRADES');
saveGame();
const rawSave = JSON.parse(localStorage.getItem('bureaucracy_save'));
rawSave.purchasedPolicies = ['mandatory_overtime', 'triple_redundancy'];
rawSave.activePolicies = ['mandatory_overtime', 'triple_redundancy'];
rawSave.purchasedUpgrades = [];
localStorage.setItem('bureaucracy_save', JSON.stringify(rawSave));
loadGame();
assert(!game.purchasedPolicies.has('triple_redundancy') && game.purchasedUpgrades.has('triple_redundancy'), 'old save: triple_redundancy migrated to upgrades');
assert(game.purchasedPolicies.has('mandatory_overtime'), 'real policies stay policies');
assert(game.globalMultiplier > 1, 'migrated bonus still applies via recalc');

console.log('--- 32. Reform re-locks tabs and clears stale badges ---');
game.purchasedPerks.delete('deep_state');
game.unlocks.expeditions = true;
els.tabPolicies.classList.remove('locked');
els.tabPolicies.textContent = 'Policies (2)'; // stale badge from before
game.totalForms = 4e9;
game.stageIndex = 2;
doReform();
assert(game.unlocks.expeditions === false, 'expeditions re-lock on reform (re-earned at Administration)');
assert(els.tabPolicies.textContent === 'Policies', `stale badge cleared on locked tab (${els.tabPolicies.textContent})`);
game.purchasedPerks.add('deep_state');
gainAbsurdity(1); // any gain, then reform again with Deep State
game.totalForms = 4e9;
game.stageIndex = 2;
doReform();
assert(game.stageIndex === 1 && game.unlocks.expeditions === true, 'Deep State: restart at Administration re-unlocks expeditions instantly');
game.purchasedPerks.delete('deep_state');

console.log('--- 33. The ending: The Final Form ---');
game.stageIndex = 5;
game.totalForms = 1e24;
game.forms = 1e25;
assert(game.finalFormAt === 0, 'no ending yet');
buyUpgrade('the_final_form');
assert(game.finalFormAt > 0, 'purchasing The Final Form marks the ending');
checkAchievements();
assert(game.unlockedAchievements.has('the_last_stamp'), 'The Last Stamp achievement unlocks');
const endingStamp = game.finalFormAt;
saveGame();
loadGame();
assert(game.finalFormAt === endingStamp, 'the ending timestamp survives save/load');

console.log('--- 34. FORM B-∞: filing yourself leaves only the Legacy ---');
assert(game.finalFormAt > 0, 'ending reached earlier in the suite');
localStorage.removeItem('bureaucracy_legacy');
selfFile(); // location.reload is a noop in the stub
const legacy = readLegacy();
assert(legacy && legacy.endings === 1, 'legacy written on self-filing');
assert(legacy.bestMs === game.finalFormAt - game.startTime, 'best service time recorded');
assert(localStorage.getItem('bureaucracy_save') === null, 'the save is erased');
saveGame();
assert(localStorage.getItem('bureaucracy_save') === null, 'auto-save suppressed during the wipe');
suppressSaving = false;
selfFile(); // second run's ending increments the count
assert(readLegacy().endings === 2, 'the Archives count every filing');
suppressSaving = false;

console.log(`\n===== ${__pass} passed, ${__fail} failed =====`);
process.exit(__fail > 0 ? 1 : 0);
