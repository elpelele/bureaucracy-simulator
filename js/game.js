// ============================================
// GAME LOGIC
// ============================================

// --------------------------------------------
// Settings (dark mode, sound) — separate storage, survives hard reset
// --------------------------------------------
function loadSettings() {
  try {
    const raw = localStorage.getItem('bureaucracy_settings');
    if (raw) Object.assign(settings, JSON.parse(raw));
  } catch (e) { /* corrupted settings: keep defaults */ }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('bureaucracy_settings', JSON.stringify(settings));
}

function applySettings() {
  document.body.classList.toggle('dark', !!settings.darkMode);
  document.body.classList.toggle('discreet', !!settings.discreet);
  const darkBox = document.getElementById('setting-dark');
  const soundBox = document.getElementById('setting-sound');
  const discreetBox = document.getElementById('setting-discreet');
  if (darkBox) darkBox.checked = !!settings.darkMode;
  if (soundBox) soundBox.checked = !!settings.sound;
  if (discreetBox) discreetBox.checked = !!settings.discreet;
}

function toggleDarkMode(on) {
  settings.darkMode = !!on;
  saveSettings();
  applySettings();
}

function toggleDiscreet(on) {
  settings.discreet = !!on;
  saveSettings();
  applySettings();
}

function toggleSound(on) {
  settings.sound = !!on;
  saveSettings();
  if (on) playSound('stamp');
}

// The stage class must not clobber the dark-mode class.
// Also swaps the main button's label to the stage's flavor.
function setStageClass(stageId) {
  document.body.className = 'stage-' + stageId + (settings.darkMode ? ' dark' : '') + (settings.discreet ? ' discreet' : '');
  const stage = STAGES.find(s => s.id === stageId);
  if (stage && stage.clickLabel && els.stampBtn) {
    els.stampBtn.textContent = stage.clickLabel;
  }
}

// --------------------------------------------
// Sound — synthesized with WebAudio, no audio files needed
// --------------------------------------------
let audioCtx = null;

function playSound(type, pitch = 1) {
  if (!settings.sound) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;

    if (type === 'stamp') {
      // Slight random detune so rapid clicking sounds organic, not machine-gun
      const p = pitch * (0.95 + Math.random() * 0.1);

      // Round low thump (kick-drum style): sine diving into the bass
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 * p, t);
      osc.frequency.exponentialRampToValueAtTime(45 * p, t + 0.1);
      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);

      // Muffled paper "pat": noise through a lowpass so it thuds instead of hissing
      const len = Math.floor(audioCtx.sampleRate * 0.05);
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const noiseGain = audioCtx.createGain();
      noise.buffer = buf;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550 * p, t);
      filter.Q.value = 1;
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      noise.connect(filter).connect(noiseGain).connect(audioCtx.destination);
      noise.start(t);
    } else if (type === 'ding') {
      // Bright two-tone chime for rewards
      [[880, 0.15, 0.4], [1320, 0.08, 0.3]].forEach(([freq, vol, dur]) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * pitch, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + dur);
      });
    }
  } catch (e) { /* audio unavailable: play silently */ }
}

// --------------------------------------------
// Derived stats — single source of truth.
// Resets everything, then re-applies every owned effect in order.
// Called after any purchase, achievement, relic or absurdity change.
// --------------------------------------------
function recalcAll() {
  game.formsPerClick = 1;
  game.clickMultiplier = 1;
  game.clickFpsPercent = 0;
  game.globalMultiplier = 1;
  game.stampsPerSec = 0;
  game.stampsMultiplier = 1;
  game.staffCostMultiplier = 1;
  game.negativeEventMultiplier = 1;
  game.goldenFrequencyMultiplier = 1;
  game.goldenRewardMultiplier = 1;
  game.inboxCapacityBonus = 0;
  game.inboxCapacityMultiplier = 1;
  STAFF.forEach(s => { s.fps = s.baseFps; });

  UPGRADES.forEach(u => { if (game.purchasedUpgrades.has(u.id)) u.effect(); });
  DEPARTMENTS.forEach(d => { if (d.owned) d.effect(); });
  POLICIES.forEach(p => { if (game.activePolicies.has(p.id)) p.effect(); });
  INVESTMENTS.forEach(inv => {
    for (let i = 0; i < inv.level; i++) inv.effect();
  });
  RELICS.forEach(r => { if (game.relics.has(r.id)) r.effect(); });

  // Absurdity perks (multiplier-style; the others read hasPerk() at use-site)
  if (hasPerk('muscle_memory')) game.clickMultiplier *= 1.5;
  if (hasPerk('executive_inbox')) game.inboxCapacityBonus += 3600;
  if (hasPerk('priority_subscription')) game.goldenFrequencyMultiplier *= 0.75;
  if (hasPerk('notarized_everything')) game.stampsMultiplier *= 1.5;
  if (hasPerk('institutional_memory')) game.globalMultiplier *= 1.25;
  game.globalMultiplier *= Math.pow(1.05, game.shadowBudgetLevel);
  if (hasPerk('bureaucratic_singularity')) game.globalMultiplier *= 1.5;

  // Permanent bonuses: achievements +1% each, absurdity (sublinear curve),
  // bosses +5% each
  game.globalMultiplier *= 1 + 0.01 * game.unlockedAchievements.size;
  game.globalMultiplier *= absurdityFactor();
  game.globalMultiplier *= Math.pow(1.05, game.bossesDefeated);

  calculateRates();
}

function calculateRates() {
  let fps = 0;
  STAFF.forEach(staff => {
    fps += staff.fps * Math.max(0, staff.owned - sentCount(staff.id));
  });
  game.formsPerSec = fps * game.globalMultiplier;
}

function setBuyQty(qty) {
  game.buyQuantity = qty;
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const buttons = document.querySelectorAll('.qty-btn');
  const qtyMap = { 1: 0, 10: 1, 100: 2, '-1': 3 };
  if (buttons[qtyMap[qty]]) {
    buttons[qtyMap[qty]].classList.add('active');
  }
  renderActiveTab();
}

// --------------------------------------------
// Clicking (rate-limited to block autoclickers / held Enter key)
// --------------------------------------------
const CLICKS_PER_SEC_CAP = 15;
const clickTimes = [];

function clickAllowed() {
  const now = Date.now();
  while (clickTimes.length && now - clickTimes[0] > 1000) clickTimes.shift();
  if (clickTimes.length >= CLICKS_PER_SEC_CAP) return false;
  clickTimes.push(now);
  return true;
}

function processClick(e) {
  if (!clickAllowed()) return;
  game.lastActiveAt = Date.now();

  let clickGain = effectiveClickBase() * rampageFactor() * clickBuffFactor();

  // Existential Office: reality flickers — some clicks echo across timelines
  let dejaVu = false;
  if (game.stageIndex >= 5 && Math.random() < 0.02) {
    dejaVu = true;
    clickGain *= 100;
    game.dejaVuCount++;
  }

  const collected = collectInbox();
  gainForms(clickGain, true);
  game.totalClicks++;

  if (dejaVu) {
    showFloatText(e.clientX, e.clientY - 30, 'DÉJÀ VU ×100');
    playSound('ding', 1.6);
  }
  let text = '+' + formatNumber(clickGain);
  if (collected > 0) text += ` (+${formatNumber(collected)} approved)`;
  stampImprint(e.clientX, e.clientY, getCurrentStage().stampText || 'APPROVED');
  deskWorkerPunch();
  showFloatText(e.clientX, e.clientY - 26, text);
  playSound('stamp');

  checkUnlocks();
  render(); // instant counter feedback instead of waiting for the next tick
}

// --------------------------------------------
// Approval inbox — passive production waits here for a signature
// --------------------------------------------
function collectInbox() {
  const n = Math.floor(game.inbox);
  if (n <= 0) return 0;
  game.inbox -= n;
  gainForms(n, true);
  return n;
}

function approveInbox(e) {
  game.lastActiveAt = Date.now();
  const collected = collectInbox();
  if (collected > 0) {
    if (e) showFloatText(e.clientX, e.clientY, `+${formatNumber(collected)} approved`);
    playSound('stamp', 0.8);
  }
}

// --------------------------------------------
// Purchases
// --------------------------------------------
function buyStaff(id) {
  const staff = STAFF.find(s => s.id === id);
  if (!staff) return;

  const quantity = game.buyQuantity;
  let toBuy = quantity;
  let totalCost = 0;

  if (quantity === -1) {
    const maxInfo = getMaxAffordable(staff, staff.costCurrency);
    toBuy = maxInfo.count;
    totalCost = maxInfo.totalCost;
  } else {
    totalCost = getCostForN(staff, quantity);
  }

  if (toBuy <= 0) return;
  if (!canAfford(totalCost, staff.costCurrency)) return;

  spend(totalCost, staff.costCurrency);
  staff.owned += toBuy;
  calculateRates();
  log(`Hired ${toBuy} ${staff.name}${toBuy > 1 ? 's' : ''}!`, 'success');
  checkAchievements();
  checkUnlocks();
  renderStaff();
  render();
}

function buyUpgrade(id) {
  const upgrade = UPGRADES.find(u => u.id === id);
  if (!upgrade) return;

  if (game.purchasedUpgrades.has(id)) return;
  if (!canAfford(upgrade.cost, upgrade.costCurrency)) return;

  spend(upgrade.cost, upgrade.costCurrency);
  game.purchasedUpgrades.add(id);
  recalcAll();
  log(`Purchased: ${upgrade.name}`, 'success');
  checkAchievements();
  render();
}

function buyDepartment(id) {
  const dept = DEPARTMENTS.find(d => d.id === id);
  if (!dept) return;

  if (dept.owned) return;
  if (!canAfford(dept.cost, dept.costCurrency)) return;

  spend(dept.cost, dept.costCurrency);
  dept.owned = true;
  recalcAll();
  log(`Created: ${dept.name}!`, 'special');
  checkAchievements();
  render();
}

function buyPolicy(id) {
  const policy = POLICIES.find(p => p.id === id);
  if (!policy) return;

  if (game.purchasedPolicies.has(id)) return;
  if (!canAfford(policy.cost, policy.costCurrency)) return;

  spend(policy.cost, policy.costCurrency);
  game.purchasedPolicies.add(id);
  game.activePolicies.add(id);
  game.policyCooldowns[id] = Date.now() + POLICY_TOGGLE_COOLDOWN;
  recalcAll();
  log(`Policy enacted: ${policy.name}!`, 'special');
  checkAchievements();
  render();
}

// Absurdity perks: paid from the balance, kept forever (survive reforms).
// The passive production bonus uses LIFETIME absurdity, so this costs nothing.
function buyPerk(id) {
  const perk = PERKS.find(pk => pk.id === id);
  if (!perk) return;
  if (game.purchasedPerks.has(id)) return;
  if (game.absurdity < perk.cost) return;

  game.absurdity -= perk.cost;
  game.purchasedPerks.add(id);
  recalcAll();
  playSound('ding', 0.9);
  log(`Perk acquired: ${perk.name} — ${perk.desc}`, 'special');
  toast(`Perk: ${perk.name}`, 'special');
  renderReform();
  checkAchievements();
}

// Repeatable absurdity sink: always a next level to save for, but the cost
// quintuples each time so the gain is bounded by your wealth
const SHADOW_BUDGET_BASE = 500e3;
const SHADOW_BUDGET_MAX = 40;

function shadowBudgetCost() {
  return SHADOW_BUDGET_BASE * Math.pow(5, game.shadowBudgetLevel);
}

function buyShadowBudget() {
  if (game.shadowBudgetLevel >= SHADOW_BUDGET_MAX) return;
  const cost = shadowBudgetCost();
  if (game.absurdity < cost) return;
  game.absurdity -= cost;
  game.shadowBudgetLevel++;
  recalcAll();
  playSound('ding', 0.9);
  log(`Shadow Budget approved at level ${game.shadowBudgetLevel}. Nobody asks where it goes. (+5% production)`, 'special');
  renderReform();
}

// Enacted policies can be suspended and reactivated, but each change needs
// 60s of administrative processing — no flipping Overtime off for every
// shopping spree and back on for free
const POLICY_TOGGLE_COOLDOWN = 60000;

function policyToggleReadyIn(id) {
  return Math.max(0, (game.policyCooldowns[id] || 0) - Date.now());
}

function togglePolicy(id) {
  if (!game.purchasedPolicies.has(id)) return;
  const policy = POLICIES.find(p => p.id === id);
  if (!policy) return;

  if (policyToggleReadyIn(id) > 0) {
    log(`${policy.name}: the change request is still being processed (${Math.ceil(policyToggleReadyIn(id) / 1000)}s).`, 'warning');
    return;
  }
  game.policyCooldowns[id] = Date.now() + POLICY_TOGGLE_COOLDOWN;

  if (game.activePolicies.has(id)) {
    game.activePolicies.delete(id);
    log(`Policy suspended: ${policy.name}.`, 'info');
  } else {
    game.activePolicies.add(id);
    log(`Policy reactivated: ${policy.name}!`, 'success');
  }
  recalcAll();
  renderPolicies();
}

function buyInvestment(id) {
  const inv = INVESTMENTS.find(i => i.id === id);
  if (!inv) return;

  if (inv.level >= inv.maxLevel) return;

  // Respects the x1/x10/x100/Max buy-quantity selector
  const qty = game.buyQuantity;
  let toBuy, totalCost;
  if (qty === -1) {
    const maxInfo = getMaxAffordableInvestment(inv);
    toBuy = maxInfo.count;
    totalCost = maxInfo.totalCost;
  } else {
    toBuy = Math.min(qty, inv.maxLevel - inv.level);
    totalCost = getInvestmentCostForN(inv, toBuy);
  }

  if (toBuy <= 0 || game.stamps < totalCost) return;

  game.stamps -= totalCost;
  inv.level += toBuy;
  recalcAll();
  log(`Investment: ${inv.name} upgraded to Lv.${inv.level}!`, 'success');
  renderInvestments();
  checkAchievements();
  render();
}

// --------------------------------------------
// Unlocks & achievements
// --------------------------------------------
function checkUnlocks() {
  if (!game.unlocks.departments && getTotalStaff() >= 10) {
    game.unlocks.departments = true;
    log('UNLOCKED: Departments', 'special');
    updateTabLocks();
  }

  if (!game.unlocks.policies && game.totalForms >= 500000) {
    game.unlocks.policies = true;
    log('UNLOCKED: Policies', 'special');
    updateTabLocks();
  }

  if (!game.unlocks.absurdity && game.totalForms >= 1000000) {
    game.unlocks.absurdity = true;
    els.absurdityContainer.style.display = 'block';
    log('You sense the growing absurdity of bureaucracy...', 'special');
  }

  if (!game.unlocks.expeditions && game.stageIndex >= 1) {
    game.unlocks.expeditions = true;
    log('UNLOCKED: Expeditions into the Deep Archives. Something moves down there.', 'special');
    updateTabLocks();
  }

  if (!game.unlocks.reforms && game.stageIndex >= 2) {
    game.unlocks.reforms = true;
    log('UNLOCKED: Administrative Reform. Burn it all down. Become stronger.', 'special');
    updateTabLocks();
  }
}

function checkAchievements() {
  let newUnlocks = 0;
  ACHIEVEMENTS.forEach(ach => {
    if (!game.unlockedAchievements.has(ach.id) && ach.check()) {
      game.unlockedAchievements.add(ach.id);
      log(`Achievement: ${ach.name} (+1% production)`, 'special');
      toast(`Achievement: ${ach.name} (+1%)`);
      newUnlocks++;
    }
  });
  if (newUnlocks > 0) recalcAll();
}

// --------------------------------------------
// Random events (weighted pick, respects stage & negative multiplier)
// --------------------------------------------
function triggerRandomEvent() {
  const now = Date.now();
  if (now - game.lastEvent < game.eventCooldown) return;

  // 1% chance per tick
  if (Math.random() > 0.01) return;

  const eligibleEvents = EVENTS.filter(e => {
    if (game.forms < e.minForms) return false;
    return stageIdx(e.stage) <= game.stageIndex;
  });

  if (eligibleEvents.length === 0) return;

  // Weighted pick by chance
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.chance, 0);
  let roll = Math.random() * totalWeight;
  let event = eligibleEvents[eligibleEvents.length - 1];
  for (const e of eligibleEvents) {
    roll -= e.chance;
    if (roll <= 0) { event = e; break; }
  }

  const result = event.effect();
  log(`${event.name}: ${result}`, event.type);
  game.lastEvent = now;
}

// --------------------------------------------
// Stage bosses — The Inspector General
// Reaching a stage threshold spawns a boss that must be clicked down.
// Idle production cannot beat him: only clicks deal damage.
// --------------------------------------------
const BOSS_FIGHT_DURATION = 30000;
const BOSS_RETRY_COOLDOWN = 60000;

function bossPending() {
  return game.stageIndex < STAGES.length - 1 &&
    game.totalForms >= STAGES[game.stageIndex + 1].threshold &&
    !game.boss.active;
}

function bossClickDamage() {
  return effectiveClickBase() + game.formsPerSec * 0.05;
}

function startBossFight() {
  if (!bossPending()) return;
  const now = Date.now();
  if (now < game.boss.cooldownUntil) return;

  const hp = Math.max(10, Math.floor(bossClickDamage() * 40 * (hasPerk('inspectors_weak_spot') ? 0.75 : 1)));
  game.boss.active = true;
  game.boss.hp = hp;
  game.boss.maxHp = hp;
  game.boss.endTime = now + BOSS_FIGHT_DURATION;
  log(`THE INSPECTOR GENERAL blocks your promotion! Destroy ${formatNumber(hp)} compliance points in 30 seconds. CLICK!`, 'danger');
}

function attackBoss(e) {
  if (!game.boss.active) return;
  if (!clickAllowed()) return;
  game.lastActiveAt = Date.now();

  let dmg = bossClickDamage();
  const crit = Math.random() < 0.1;
  if (crit) dmg *= 5;
  game.boss.hp -= dmg;

  bossFigureHit();
  if (e) {
    if (crit) stampImprint(e.clientX, e.clientY, 'REJECTED', 'rejected');
    showFloatText(e.clientX, e.clientY - 26, (crit ? 'CRIT -' : '-') + formatNumber(dmg));
  }
  playSound('stamp', crit ? 1.5 : 1.1);

  if (game.boss.hp <= 0) bossDefeated();
}

function bossDefeated() {
  game.boss.active = false;
  game.boss.hp = 0;
  game.stageIndex++;
  game.bossesDefeated++;

  // The hoard built up during the previous stage's tail would let the player
  // insta-buy the new stage's staff tiers and skip it — the Inspector takes it
  const confiscated = Math.floor(game.forms * (hasPerk('inspectors_weak_spot') ? 0.75 : 0.9));
  game.forms -= confiscated;

  const stage = STAGES[game.stageIndex];
  setStageClass(stage.id);
  playSound('ding', 0.8);
  log(`INSPECTOR DEFEATED! Welcome to ${stage.name}. (+5% permanent production)`, 'special');
  log(`He confiscated ${formatNumber(confiscated)} forms on his way out. "Evidence", he said.`, 'warning');
  showPromotionOverlay(stage.name, stage.desc);
  if (stage.newMechanic) {
    log(stage.newMechanic, 'special');
    toast(stage.newMechanic.split('—')[0].trim(), 'special');
  }

  // Tidy the shop lists: previous stages fold away (still expandable by hand)
  for (let i = 0; i < game.stageIndex; i++) {
    const sid = STAGES[i].id;
    ['staff', 'upgrades', 'departments'].forEach(list => game.collapsedStages.add(list + ':' + sid));
  }
  log(stage.desc, 'info');

  recalcAll();
  checkUnlocks();
  checkAchievements();
  saveGame();
}

function bossTick(now) {
  if (game.boss.active && now > game.boss.endTime) {
    game.boss.active = false;
    game.boss.cooldownUntil = now + BOSS_RETRY_COOLDOWN;
    log('The Inspector General filed a complaint and left. He returns in 60 seconds.', 'warning');
  }
}

// --------------------------------------------
// Expeditions into the Deep Archives
// Send half your owned units of up to 3 staff types. They stop producing
// while away. Success odds compare raw squad fps to the monster's power.
// --------------------------------------------
function toggleExpeditionStaff(id) {
  if (game.expedition.active) return;
  const team = game.expedition.team;
  const idx = team.indexOf(id);
  if (idx >= 0) {
    team.splice(idx, 1);
  } else {
    if (team.length >= 3) return;
    const staff = STAFF.find(s => s.id === id);
    if (!staff || staff.owned < 2) return;
    team.push(id);
  }
  renderExpeditions();
}

function squadPower(sent) {
  return sent.reduce((sum, entry) => {
    const staff = STAFF.find(s => s.id === entry.id);
    return sum + (staff ? entry.count * staff.baseFps : 0);
  }, 0);
}

function buildSquad() {
  return game.expedition.team
    .map(id => {
      const staff = STAFF.find(s => s.id === id);
      return { id, count: staff ? Math.floor(staff.owned / 2) : 0 };
    })
    .filter(entry => entry.count > 0);
}

// Monsters grow ×2.5 stronger with each kill THIS RUN — farming self-limits,
// but the archives reshuffle on reform so early monsters never stay dead
function monsterPower(monster) {
  const kills = game.monsterKillsRun[monster.id] || 0;
  return monster.power * Math.pow(2.5, kills);
}

function expeditionChance(monster, sent) {
  const power = squadPower(sent);
  if (power <= 0) return 0;
  const perkBonus = hasPerk('archive_maps') ? 0.10 : 0;
  return Math.max(0.05, Math.min(0.95, 0.6 * power / monsterPower(monster) + perkBonus));
}

function launchExpedition(monsterId) {
  if (game.expedition.active) return;
  const monster = MONSTERS.find(m => m.id === monsterId);
  if (!monster) return;

  const sent = buildSquad();
  if (sent.length === 0) return;

  game.expedition.active = true;
  game.expedition.monsterId = monsterId;
  game.expedition.sent = sent;
  game.expedition.endTime = Date.now() + monster.duration;

  calculateRates();
  log(`Expedition launched into the Deep Archives: ${monster.name}. The squad returns in ${formatDuration(monster.duration)}.`, 'special');
  saveGame();
  renderExpeditions();
}

function resolveExpedition() {
  const exp = game.expedition;
  const monster = MONSTERS.find(m => m.id === exp.monsterId);
  if (!monster) {
    exp.active = false;
    exp.sent = [];
    return;
  }

  const chance = expeditionChance(monster, exp.sent);
  const success = Math.random() < chance;

  if (success) {
    game.expeditionsWon++;
    game.monsterKills[monster.id] = (game.monsterKills[monster.id] || 0) + 1;
    game.monsterKillsRun[monster.id] = (game.monsterKillsRun[monster.id] || 0) + 1;
    gainAbsurdity(monster.absurdity);

    let msg = `EXPEDITION SUCCESS: ${monster.name} defeated! +${monster.absurdity} Absurdity.`;
    if (monster.relic && !game.relics.has(monster.relic)) {
      game.relics.add(monster.relic);
      const relic = RELICS.find(r => r.id === monster.relic);
      if (relic) {
        msg += ` Relic recovered: ${relic.name}!`;
        toast(`Relic: ${relic.name}`, 'special');
      }
    }
    log(msg, 'special');
  } else {
    game.expeditionsFailed++;
    const casualtyRate = hasPerk('archive_maps') ? 0.05 : 0.1;
    exp.sent.forEach(entry => {
      const staff = STAFF.find(s => s.id === entry.id);
      if (staff) staff.owned = Math.max(0, staff.owned - Math.ceil(entry.count * casualtyRate));
    });
    log(`EXPEDITION FAILED: the squad fled from ${monster.name}. 10% of them resigned on the spot.`, 'danger');
  }

  exp.active = false;
  exp.monsterId = null;
  exp.sent = [];

  recalcAll();
  checkAchievements();
  saveGame();
  renderExpeditions();
}

// Bribe the archivists: pay stamps to finish the current expedition now.
// Cost scales with the remaining time and your stamp income, so it stays a
// meaningful luxury at every stage (and a real late-game stamp sink).
function expeditionRushCost() {
  if (!game.expedition.active) return 0;
  const remaining = Math.max(0, (game.expedition.endTime - Date.now()) / 1000);
  return Math.ceil(remaining * Math.max(2 * game.stampsPerSec, 5));
}

function rushExpedition() {
  if (!game.expedition.active) return;
  const cost = expeditionRushCost();
  if (game.stamps < cost) return;
  game.stamps -= cost;
  game.expeditionsRushed++;
  game.expedition.endTime = Date.now();
  log(`Bribed the archivists with ${formatNumber(cost)} stamps — the squad reports back immediately.`, 'success');
  playSound('ding', 1.1);
  // resolves on the next tick via expeditionTick
}

function expeditionTick(now) {
  if (game.expedition.active && now >= game.expedition.endTime) {
    resolveExpedition();
  }
}

// --------------------------------------------
// Administrative Reform (prestige)
// --------------------------------------------
function reformGain() {
  return Math.floor(Math.sqrt(game.totalForms / 1e9));
}

function canReform() {
  return game.stageIndex >= 2 && reformGain() >= 1;
}

function doReform() {
  if (!canReform()) return;
  const gain = reformGain();

  const newFactor = Math.pow(1 + game.absurdity + gain, 0.19);
  const ok = confirm(
    `ADMINISTRATIVE REFORM\n\n` +
    `You will LOSE: forms, stamps, staff, upgrades, departments, policies, investments, and your current stage.\n` +
    `You will KEEP: achievements, relics, monster kills, Absurdity, perks and Shadow Budget.\n\n` +
    `You gain +${formatNumber(gain)} Absurdity — permanent production bonus goes from ×${absurdityFactor().toFixed(2)} to ×${newFactor.toFixed(2)}.\n\nProceed?`
  );
  if (!ok) return;

  gainAbsurdity(gain);
  game.reformCount++;

  // Reset the run
  game.forms = 0;
  game.stamps = 0;
  game.inbox = 0;
  game.totalForms = 0;
  game.stampMilestones = 0;
  game.stageIndex = 0;
  game.runStartTime = Date.now();
  game.purchasedUpgrades.clear();
  game.purchasedPolicies.clear();
  game.activePolicies.clear();
  game.policyCooldowns = {};
  STAFF.forEach(s => { s.owned = 0; });
  DEPARTMENTS.forEach(d => { d.owned = false; });
  INVESTMENTS.forEach(i => { i.level = 0; });
  game.boss = { active: false, hp: 0, maxHp: 0, endTime: 0, cooldownUntil: 0 };
  game.expedition.active = false;
  game.expedition.monsterId = null;
  game.expedition.sent = [];
  game.expedition.team = [];
  game.frenzyUntil = 0;
  game.rampageUntil = 0;
  game.collapsedStages.clear();
  game.directive = { active: false, id: null, expiresAt: 0 };
  game.nextDirectiveAt = 0;
  game.buffs = { prodUntil: 0, clickUntil: 0, stampUntil: 0, prodDebuffUntil: 0 };
  game.monsterKillsRun = {}; // the archives reshuffle: adaptation resets
  game.unlocks.departments = false;
  game.unlocks.policies = false;
  // absurdity / expeditions / reforms stay unlocked

  // Perk-granted head starts
  if (hasPerk('severance_package')) {
    STAFF.find(s => s.id === 'intern').owned = 5;
    game.forms = 1000;
  }
  if (hasPerk('deep_state')) {
    game.stageIndex = 1;
    game.totalForms = 1e6;
    game.stampMilestones = 1000;
  }

  setStageClass(STAGES[game.stageIndex].id);
  recalcAll();
  updateTabLocks();
  switchTab('staff');
  checkAchievements();
  log(`ADMINISTRATIVE REFORM #${game.reformCount}! Everything burns. +${formatNumber(gain)} Absurdity — production bonus now ×${absurdityFactor().toFixed(2)}.`, 'special');
  showPromotionOverlay(`REFORM #${game.reformCount}`, `+${formatNumber(gain)} Absurdity — permanent bonus ×${absurdityFactor().toFixed(2)}`);
  saveGame();
  renderAll();
}

// --------------------------------------------
// Council Directives (Global Council+): periodic two-option decisions
// --------------------------------------------
const DIRECTIVE_STAGE = 1;          // incidents from The Administration; council directives gate on minStage (default 3)
const DIRECTIVE_LIFETIME = 60000;   // 60s to decide
const BUFF_DURATION = 300000;       // timed buffs last 5 minutes
const BUFF_PROD = 1.5;
const BUFF_CLICK = 3;
const BUFF_STAMP = 2;

function prodBuffFactor(now) {
  now = now || Date.now();
  let f = now < game.buffs.prodUntil ? BUFF_PROD : 1;
  if (now < game.buffs.prodDebuffUntil) f *= 0.7; // unresolved incidents sting
  return f;
}
function clickBuffFactor(now) {
  return (now || Date.now()) < game.buffs.clickUntil ? BUFF_CLICK : 1;
}
function stampBuffFactor(now) {
  return (now || Date.now()) < game.buffs.stampUntil ? BUFF_STAMP : 1;
}

function scheduleDirective(now) {
  game.nextDirectiveAt = now + 240000 + Math.random() * 240000; // 4-8 min
}

function directiveTick(now) {
  if (game.stageIndex < DIRECTIVE_STAGE) return;
  if (game.directive.active) {
    if (now > game.directive.expiresAt) {
      const expired = DIRECTIVES.find(d => d.id === game.directive.id);
      game.directive.active = false;
      game.directivesExpired++;
      if (expired && expired.onExpire) {
        const result = applyDirectiveEffect(expired.onExpire);
        log(`${expired.name} was ignored. It resolved itself, badly: ${result}`, 'warning');
      } else {
        log('The directive expired unanswered. The Council sighs and files it away.', 'warning');
      }
      scheduleDirective(now);
    }
    return;
  }
  if (!game.nextDirectiveAt) {
    scheduleDirective(now);
    return;
  }
  // Only demand decisions from a player who is actually there
  if (now >= game.nextDirectiveAt && playerIsActive(now)) {
    const pool = DIRECTIVES.filter(d => (d.minStage !== undefined ? d.minStage : 3) <= game.stageIndex);
    if (pool.length === 0) { scheduleDirective(now); return; }
    const directive = pool[Math.floor(Math.random() * pool.length)];
    game.directive.active = true;
    game.directive.id = directive.id;
    game.directive.expiresAt = now + DIRECTIVE_LIFETIME;
    playSound('ding', 1.2);
    const label = directive.kind === 'incident' ? 'OFFICE INCIDENT' : 'COUNCIL DIRECTIVE';
    log(`${label}: ${directive.name}. You have a minute to deal with it.`, 'special');
  }
}

function applyDirectiveEffect(effect) {
  const now = Date.now();
  switch (effect) {
    case 'prod':
      game.buffs.prodUntil = now + BUFF_DURATION;
      return `Production ×${BUFF_PROD} for 5 minutes.`;
    case 'click':
      game.buffs.clickUntil = now + BUFF_DURATION;
      return `Clicks ×${BUFF_CLICK} for 5 minutes.`;
    case 'stamp':
      game.buffs.stampUntil = now + BUFF_DURATION;
      return `Stamp income ×${BUFF_STAMP} for 5 minutes.`;
    case 'forms': {
      const bonus = Math.floor(game.formsPerSec * 240);
      game.forms += bonus;
      return `Gained ${formatNumber(bonus)} forms.`;
    }
    case 'forms_big': {
      const bonus = Math.floor(game.formsPerSec * 600);
      game.forms += bonus;
      return `Gained ${formatNumber(bonus)} forms.`;
    }
    case 'stamps_burst': {
      const bonus = Math.floor(game.stampsPerSec * 600) + 50;
      gainStamps(bonus);
      return `Gained ${formatNumber(bonus)} stamps.`;
    }
    case 'absurdity':
      gainAbsurdity(2);
      recalcAll();
      return '+2 Absurdity. The Council appreciates the paperwork.';
    // Incident resolutions (shorter buffs/debuffs than council ones)
    case 'pay_prod_buff': {
      const spent = Math.min(game.forms, Math.floor(game.formsPerSec * 120));
      game.forms -= spent;
      game.buffs.prodUntil = now + 300000;
      return `Paid ${formatNumber(spent)} forms. Caffeine surge: production ×${BUFF_PROD} for 5 minutes!`;
    }
    case 'prod_debuff':
      game.buffs.prodDebuffUntil = now + 300000;
      return 'Morale sinks. Production ×0.7 for 5 minutes.';
    case 'pay_absurdity': {
      const spent = Math.min(game.forms, Math.floor(game.formsPerSec * 90));
      game.forms -= spent;
      gainAbsurdity(1);
      recalcAll();
      return `Paid ${formatNumber(spent)} forms. The reconstructed folder makes no sense: +1 Absurdity.`;
    }
    case 'pay_click_buff': {
      const spent = Math.min(game.stamps, Math.floor(game.stampsPerSec * 600));
      game.stamps -= spent;
      game.buffs.clickUntil = now + 300000;
      return `Paid ${formatNumber(spent)} stamps. The machine blesses you: clicks ×${BUFF_CLICK} for 5 minutes.`;
    }
    case 'pay_nothing': {
      const spent = Math.min(game.forms, Math.floor(game.formsPerSec * 60));
      game.forms -= spent;
      return `Paid ${formatNumber(spent)} forms in pastries. The inspectors saw nothing.`;
    }
    case 'stamps_and_debuff': {
      const bonus = Math.floor(game.stampsPerSec * 300) + 20;
      gainStamps(bonus);
      game.buffs.prodDebuffUntil = now + 180000;
      return `Certified! +${formatNumber(bonus)} stamps, but the disruption costs ×0.7 production for 3 minutes.`;
    }
    default:
      return 'Nothing happened. Suspiciously bureaucratic.';
  }
}

function chooseDirective(option) {
  if (!game.directive.active) return;
  const directive = DIRECTIVES.find(d => d.id === game.directive.id);
  game.directive.active = false;
  scheduleDirective(Date.now());
  if (!directive) return;
  const choice = option === 'a' ? directive.a : directive.b;
  const result = applyDirectiveEffect(choice.effect);
  game.directivesAnswered++;
  playSound('stamp', 1.2);
  log(`DIRECTIVE ${directive.name}: "${choice.label}" — ${result}`, 'success');
  checkAchievements();
}

// --------------------------------------------
// Priority forms (golden clickable) & frenzy
// --------------------------------------------
const GOLDEN_LIFETIME = 8000;
const FRENZY_DURATION = 30000;
const FRENZY_MULTIPLIER = 7;
const RAMPAGE_DURATION = 15000;
const RAMPAGE_MULTIPLIER = 77;

function frenzyFactor(now) {
  return (now || Date.now()) < game.frenzyUntil ? FRENZY_MULTIPLIER : 1;
}

// Rampage boosts manual clicks only (not boss damage, not production)
function rampageFactor(now) {
  return (now || Date.now()) < game.rampageUntil ? RAMPAGE_MULTIPLIER : 1;
}

function scheduleGolden(now) {
  const base = 120000 + Math.random() * 180000; // 2-5 minutes
  game.nextGoldenAt = now + base * game.goldenFrequencyMultiplier;
}

function goldenTick(now) {
  if (game.goldenActive) {
    if (now > game.goldenExpires) {
      removeGolden();
      scheduleGolden(now);
    }
    return;
  }
  if (!game.nextGoldenAt) {
    scheduleGolden(now);
    return;
  }
  if (now >= game.nextGoldenAt) spawnGolden(now);
}

function spawnGolden(now) {
  game.goldenActive = true;
  game.goldenExpires = now + GOLDEN_LIFETIME;

  const btn = document.createElement('button');
  btn.id = 'golden-form';
  btn.className = 'golden-form';
  btn.textContent = game.stageIndex >= 4 ? 'QUANTUM FORM' : 'PRIORITY FORM';
  btn.style.left = (15 + Math.random() * 60) + '%';
  btn.style.top = (20 + Math.random() * 50) + '%';
  btn.addEventListener('click', clickGolden);
  document.body.appendChild(btn);
}

function removeGolden() {
  game.goldenActive = false;
  const btn = document.getElementById('golden-form');
  if (btn) btn.remove();
}

function clickGolden(e) {
  removeGolden();
  scheduleGolden(Date.now());

  playSound('ding');

  // Cosmic Bureau+: quantum forms — double rewards, but they can collapse
  const quantum = game.stageIndex >= 4;
  const kind = quantum ? 'QUANTUM FORM' : 'PRIORITY FORM';
  const magnitude = (quantum ? 2 : 1) * game.goldenRewardMultiplier;

  const roll = Math.random();
  if (roll < 0.45) {
    game.frenzyUntil = Date.now() + FRENZY_DURATION * magnitude;
    log(`${kind}: Frenzy! Production ×${FRENZY_MULTIPLIER} for ${Math.round(30 * magnitude)} seconds!`, 'special');
  } else if (roll < 0.75) {
    const bonus = Math.floor((game.formsPerSec * 120 + game.formsPerClick * game.clickMultiplier * 15 + 10) * magnitude);
    game.forms += bonus;
    log(`${kind}: expedited processing! +${formatNumber(bonus)} forms!`, 'success');
  } else if (roll < 0.9) {
    const bonus = Math.floor(game.stampsPerSec * 120 * magnitude) + 5;
    gainStamps(bonus);
    log(`${kind}: certified urgent! +${formatNumber(bonus)} stamps!`, 'success');
  } else {
    game.rampageUntil = Date.now() + RAMPAGE_DURATION * magnitude;
    game.rampagesTriggered++;
    log(`${kind}: STAMP RAMPAGE! Your clicks are worth ×${RAMPAGE_MULTIPLIER} for ${Math.round(15 * magnitude)} seconds!`, 'special');
  }

  if (quantum && Math.random() < 0.15) {
    const lost = Math.floor(game.forms * 0.05);
    game.forms -= lost;
    game.quantumCollapses++;
    log(`The quantum form collapsed on observation! Superposition tax: -${formatNumber(lost)} forms.`, 'warning');
  }
  if (e) showFloatText(e.clientX, e.clientY, 'PRIORITY!');
}

// ============================================
// SAVE/LOAD
// ============================================

// Blocks auto-save while a hard reset / import is replacing the stored save —
// otherwise the beforeunload save re-writes the state we just wiped
let suppressSaving = false;

function saveGame() {
  if (suppressSaving) return;
  const saveData = {
    version: 3,
    savedAt: Date.now(),

    // Resources
    forms: game.forms,
    stamps: game.stamps,
    inbox: game.inbox,
    absurdity: game.absurdity,
    totalAbsurdityEarned: game.totalAbsurdityEarned,

    // Lifetime stats
    totalFormsAllTime: game.totalFormsAllTime,
    totalStampsEarned: game.totalStampsEarned,
    totalClicks: game.totalClicks,
    reformCount: game.reformCount,
    expeditionsWon: game.expeditionsWon,
    expeditionsFailed: game.expeditionsFailed,
    expeditionsRushed: game.expeditionsRushed,
    bossesDefeated: game.bossesDefeated,
    startTime: game.startTime,

    // Run stats
    totalForms: game.totalForms,
    runStartTime: game.runStartTime,

    // Progression
    stageIndex: game.stageIndex,
    boss: {
      cooldownUntil: game.boss.cooldownUntil
      // an active fight is not saved: reloading mid-fight just cancels it
    },
    expedition: {
      active: game.expedition.active,
      monsterId: game.expedition.monsterId,
      endTime: game.expedition.endTime,
      sent: game.expedition.sent,
      team: game.expedition.team
    },
    monsterKills: game.monsterKills,
    monsterKillsRun: game.monsterKillsRun,
    relics: [...game.relics],
    frenzyUntil: game.frenzyUntil,
    rampageUntil: game.rampageUntil,
    collapsedStages: [...game.collapsedStages],
    buffs: game.buffs,

    // Unlocks
    unlocks: game.unlocks,

    // Purchases (facts only — multipliers are recomputed on load)
    purchasedUpgrades: [...game.purchasedUpgrades],
    purchasedPolicies: [...game.purchasedPolicies],
    policyCooldowns: game.policyCooldowns,
    purchasedPerks: [...game.purchasedPerks],
    shadowBudgetLevel: game.shadowBudgetLevel,
    activePolicies: [...game.activePolicies],
    unlockedAchievements: [...game.unlockedAchievements],

    // Lifetime mechanic counters
    directivesAnswered: game.directivesAnswered,
    directivesExpired: game.directivesExpired,
    dejaVuCount: game.dejaVuCount,
    quantumCollapses: game.quantumCollapses,
    rampagesTriggered: game.rampagesTriggered,
    staff: STAFF.map(s => ({ id: s.id, owned: s.owned })),
    departments: DEPARTMENTS.map(d => ({ id: d.id, owned: d.owned })),
    investments: INVESTMENTS.map(i => ({ id: i.id, level: i.level }))
  };

  localStorage.setItem('bureaucracy_save', JSON.stringify(saveData));

  const indicator = document.getElementById('save-indicator');
  if (indicator) indicator.textContent = 'saved ' + new Date().toLocaleTimeString();
}

function deriveStageIndex(totalForms) {
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (totalForms >= s.threshold) idx = i;
  });
  return idx;
}

function loadGame() {
  const saved = localStorage.getItem('bureaucracy_save');
  if (!saved) {
    recalcAll();
    return;
  }

  try {
    const data = JSON.parse(saved);

    // Resources
    game.forms = data.forms || 0;
    game.stamps = data.stamps || 0;
    game.inbox = data.inbox || 0;
    game.absurdity = data.absurdity || 0;
    game.totalAbsurdityEarned = Math.max(data.totalAbsurdityEarned || 0, game.absurdity);

    // Stats
    game.totalForms = data.totalForms || 0;
    game.totalClicks = data.totalClicks || 0;
    game.startTime = data.startTime || Date.now();
    game.runStartTime = data.runStartTime || game.startTime;
    game.totalFormsAllTime = data.totalFormsAllTime !== undefined ? data.totalFormsAllTime : game.totalForms;
    game.totalStampsEarned = data.totalStampsEarned !== undefined
      ? data.totalStampsEarned
      : Math.max(data.stamps || 0, Math.floor(game.totalForms / 1000));
    game.reformCount = data.reformCount || 0;
    game.expeditionsWon = data.expeditionsWon || 0;
    game.expeditionsFailed = data.expeditionsFailed || 0;
    game.expeditionsRushed = data.expeditionsRushed || 0;

    // Milestones derive from totalForms (prevents the old refund exploit)
    game.stampMilestones = Math.floor(game.totalForms / 1000);

    // Progression (v2 saves: derive stage from forms, grandfather bosses in)
    game.stageIndex = data.stageIndex !== undefined ? data.stageIndex : deriveStageIndex(game.totalForms);
    game.bossesDefeated = data.bossesDefeated !== undefined ? data.bossesDefeated : game.stageIndex;
    if (data.boss) game.boss.cooldownUntil = data.boss.cooldownUntil || 0;

    // Expedition
    if (data.expedition) {
      game.expedition.active = !!data.expedition.active;
      game.expedition.monsterId = data.expedition.monsterId || null;
      game.expedition.endTime = data.expedition.endTime || 0;
      game.expedition.sent = data.expedition.sent || [];
      game.expedition.team = data.expedition.team || [];
    }
    game.monsterKills = data.monsterKills || {};
    game.monsterKillsRun = data.monsterKillsRun || {};
    game.relics = new Set(data.relics || []);
    game.frenzyUntil = data.frenzyUntil || 0;
    game.rampageUntil = data.rampageUntil || 0;
    game.collapsedStages = new Set(data.collapsedStages || []);
    game.buffs = Object.assign({ prodUntil: 0, clickUntil: 0, stampUntil: 0, prodDebuffUntil: 0 }, data.buffs || {});

    // Unlocks
    game.unlocks = Object.assign(game.unlocks, data.unlocks || {});

    // Purchases
    game.purchasedUpgrades = new Set(data.purchasedUpgrades || []);
    game.activePolicies = new Set(data.activePolicies || []);
    // Older saves had no purchased/active distinction: active = purchased
    game.purchasedPolicies = new Set(data.purchasedPolicies || data.activePolicies || []);
    game.policyCooldowns = data.policyCooldowns || {};
    // Migration: the bonus-only policies became upgrades — carry ownership over
    [...game.purchasedPolicies].forEach(id => {
      if (!POLICIES.find(pl => pl.id === id) && UPGRADES.find(u => u.id === id)) {
        game.purchasedPolicies.delete(id);
        game.activePolicies.delete(id);
        delete game.policyCooldowns[id];
        game.purchasedUpgrades.add(id);
      }
    });
    game.purchasedPerks = new Set(data.purchasedPerks || []);
    game.shadowBudgetLevel = data.shadowBudgetLevel || 0;
    game.unlockedAchievements = new Set(data.unlockedAchievements || []);

    game.directivesAnswered = data.directivesAnswered || 0;
    game.directivesExpired = data.directivesExpired || 0;
    game.dejaVuCount = data.dejaVuCount || 0;
    game.quantumCollapses = data.quantumCollapses || 0;
    game.rampagesTriggered = data.rampagesTriggered || 0;

    if (data.staff) {
      data.staff.forEach(savedStaff => {
        const staff = STAFF.find(s => s.id === savedStaff.id);
        if (staff) staff.owned = savedStaff.owned || 0;
        // saved fps (v2) is deliberately ignored — recomputed from base values
      });
    }

    if (data.departments) {
      data.departments.forEach(savedDept => {
        const dept = DEPARTMENTS.find(d => d.id === savedDept.id);
        if (dept) dept.owned = savedDept.owned;
      });
    }

    if (data.investments) {
      data.investments.forEach(savedInv => {
        const inv = INVESTMENTS.find(i => i.id === savedInv.id);
        if (inv) inv.level = Math.min(savedInv.level || 0, inv.maxLevel);
      });
    }

    // Everything derived is recomputed from the facts above
    recalcAll();

    // UI state
    updateTabLocks();
    if (game.unlocks.absurdity) els.absurdityContainer.style.display = 'block';
    setStageClass((STAGES[game.stageIndex] || STAGES[0]).id);

    // Offline progress (capped by the inbox, 50% efficiency)
    if (data.savedAt) applyOfflineProgress(data.savedAt);

    log('Game loaded!', 'info');
  } catch (e) {
    console.error('Failed to load save:', e);
    recalcAll();
  }
}

function applyOfflineProgress(lastSaved) {
  const now = Date.now();
  const dtSeconds = (now - lastSaved) / 1000;
  if (dtSeconds < 30) return;

  const OFFLINE_RATE = hasPerk('dream_bureaucracy') ? 0.75 : 0.5;

  // Forms land in the approval inbox, which caps them naturally
  let offlineForms = 0;
  if (game.formsPerSec > 0) {
    const cap = getInboxCapacity();
    const before = game.inbox;
    game.inbox = Math.min(game.inbox + game.formsPerSec * dtSeconds * OFFLINE_RATE, Math.max(cap, game.inbox));
    offlineForms = Math.floor(game.inbox - before);
  }

  // Stamps: 50% rate, at most 2 hours' worth
  const stampSeconds = Math.min(dtSeconds, 7200);
  const offlineStamps = Math.floor(game.stampsPerSec * stampSeconds * OFFLINE_RATE);
  if (offlineStamps > 0) gainStamps(offlineStamps);

  log(`While you were away (${formatDuration(dtSeconds * 1000)}): +${formatNumber(offlineForms)} forms piled up in your inbox, +${formatNumber(offlineStamps)} stamps. Sign here.`, 'info');
  toast(`Away ${formatDuration(dtSeconds * 1000)}: +${formatNumber(offlineForms)} in inbox, +${formatNumber(offlineStamps)} stamps`);
}

// --------------------------------------------
// Export / import / hard reset
// --------------------------------------------
function exportSave() {
  saveGame();
  const data = localStorage.getItem('bureaucracy_save');
  const area = document.getElementById('export-area');
  if (!area) return;
  area.value = btoa(unescape(encodeURIComponent(data)));
  area.select();
  try {
    document.execCommand('copy');
    log('Save exported and copied to clipboard.', 'success');
  } catch (err) {
    log('Save exported — copy the text manually.', 'info');
  }
}

function importSave() {
  const area = document.getElementById('export-area');
  if (!area) return;
  const text = area.value.trim();
  if (!text) return;
  try {
    const json = decodeURIComponent(escape(atob(text)));
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    suppressSaving = true;
    localStorage.setItem('bureaucracy_save', json);
    location.reload();
  } catch (err) {
    log('Import failed: invalid save data.', 'danger');
  }
}

function hardReset() {
  if (!confirm('HARD RESET: wipe EVERYTHING, including achievements, relics and Absurdity?')) return;
  if (!confirm('Are you sure? There is no form to appeal this decision.')) return;
  suppressSaving = true;
  localStorage.removeItem('bureaucracy_save');
  location.reload();
}
