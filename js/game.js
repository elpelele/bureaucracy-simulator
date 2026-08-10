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
  const darkBox = document.getElementById('setting-dark');
  const soundBox = document.getElementById('setting-sound');
  if (darkBox) darkBox.checked = !!settings.darkMode;
  if (soundBox) soundBox.checked = !!settings.sound;
}

function toggleDarkMode(on) {
  settings.darkMode = !!on;
  saveSettings();
  applySettings();
}

function toggleSound(on) {
  settings.sound = !!on;
  saveSettings();
  if (on) playSound('stamp');
}

// The stage class must not clobber the dark-mode class
function setStageClass(stageId) {
  document.body.className = 'stage-' + stageId + (settings.darkMode ? ' dark' : '');
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
  game.globalMultiplier = 1;
  game.stampsPerSec = 0;
  game.stampsMultiplier = 1;
  game.staffCostMultiplier = 1;
  game.negativeEventMultiplier = 1;
  game.goldenFrequencyMultiplier = 1;
  game.inboxCapacityBonus = 0;
  STAFF.forEach(s => { s.fps = s.baseFps; });

  UPGRADES.forEach(u => { if (game.purchasedUpgrades.has(u.id)) u.effect(); });
  DEPARTMENTS.forEach(d => { if (d.owned) d.effect(); });
  POLICIES.forEach(p => { if (game.activePolicies.has(p.id)) p.effect(); });
  INVESTMENTS.forEach(inv => {
    for (let i = 0; i < inv.level; i++) inv.effect();
  });
  RELICS.forEach(r => { if (game.relics.has(r.id)) r.effect(); });

  // Permanent bonuses: achievements +1% each, absurdity +2% each, bosses +5% each
  game.globalMultiplier *= 1 + 0.01 * game.unlockedAchievements.size;
  game.globalMultiplier *= 1 + 0.02 * game.absurdity;
  game.globalMultiplier *= Math.pow(1.05, game.bossesDefeated);

  game.stampsPerSec *= game.stampsMultiplier;

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
  renderStaff();
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

  const clickGain = game.formsPerClick * game.clickMultiplier;
  const collected = collectInbox();
  gainForms(clickGain, true);
  game.totalClicks++;

  let text = '+' + formatNumber(clickGain);
  if (collected > 0) text += ` (+${formatNumber(collected)} approved)`;
  showFloatText(e.clientX, e.clientY, text);
  playSound('stamp');

  checkUnlocks();
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
}

function buyPolicy(id) {
  const policy = POLICIES.find(p => p.id === id);
  if (!policy) return;

  if (game.activePolicies.has(id)) return;
  if (!canAfford(policy.cost, policy.costCurrency)) return;

  spend(policy.cost, policy.costCurrency);
  game.activePolicies.add(id);
  recalcAll();
  log(`Policy enacted: ${policy.name}!`, 'special');
  checkAchievements();
}

function buyInvestment(id) {
  const inv = INVESTMENTS.find(i => i.id === id);
  if (!inv) return;

  if (inv.level >= inv.maxLevel) return;

  const cost = Math.floor(inv.baseCost * Math.pow(inv.costMultiplier, inv.level));
  if (game.stamps < cost) return;

  game.stamps -= cost;
  inv.level++;
  recalcAll();
  log(`Investment: ${inv.name} upgraded to Lv.${inv.level}!`, 'success');
  renderInvestments();
  checkAchievements();
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
  return game.formsPerClick * game.clickMultiplier + game.formsPerSec * 0.05;
}

function startBossFight() {
  if (!bossPending()) return;
  const now = Date.now();
  if (now < game.boss.cooldownUntil) return;

  const hp = Math.max(10, Math.floor(bossClickDamage() * 40));
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

  if (e) showFloatText(e.clientX, e.clientY, (crit ? 'REJECTED! -' : '-') + formatNumber(dmg));
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
  const confiscated = Math.floor(game.forms * 0.9);
  game.forms -= confiscated;

  const stage = STAGES[game.stageIndex];
  setStageClass(stage.id);
  playSound('ding', 0.8);
  log(`INSPECTOR DEFEATED! Welcome to ${stage.name}. (+5% permanent production)`, 'special');
  log(`He confiscated ${formatNumber(confiscated)} forms on his way out. "Evidence", he said.`, 'warning');
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

// Monsters grow ×2.5 stronger with each kill — repeat farming self-limits
function monsterPower(monster) {
  const kills = game.monsterKills[monster.id] || 0;
  return monster.power * Math.pow(2.5, kills);
}

function expeditionChance(monster, sent) {
  const power = squadPower(sent);
  if (power <= 0) return 0;
  return Math.max(0.05, Math.min(0.95, 0.6 * power / monsterPower(monster)));
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
    game.absurdity += monster.absurdity;

    let msg = `EXPEDITION SUCCESS: ${monster.name} defeated! +${monster.absurdity} Absurdity.`;
    if (monster.relic && !game.relics.has(monster.relic)) {
      game.relics.add(monster.relic);
      const relic = RELICS.find(r => r.id === monster.relic);
      if (relic) msg += ` Relic recovered: ${relic.name}!`;
    }
    log(msg, 'special');
  } else {
    game.expeditionsFailed++;
    exp.sent.forEach(entry => {
      const staff = STAFF.find(s => s.id === entry.id);
      if (staff) staff.owned = Math.max(0, staff.owned - Math.ceil(entry.count * 0.1));
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

  const ok = confirm(
    `ADMINISTRATIVE REFORM\n\n` +
    `You will LOSE: forms, stamps, staff, upgrades, departments, policies, investments, and your current stage.\n` +
    `You will KEEP: achievements, relics, monster kills, and Absurdity.\n\n` +
    `You gain +${gain} Absurdity (each grants +2% permanent production).\n\nProceed?`
  );
  if (!ok) return;

  game.absurdity += gain;
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
  game.activePolicies.clear();
  STAFF.forEach(s => { s.owned = 0; });
  DEPARTMENTS.forEach(d => { d.owned = false; });
  INVESTMENTS.forEach(i => { i.level = 0; });
  game.boss = { active: false, hp: 0, maxHp: 0, endTime: 0, cooldownUntil: 0 };
  game.expedition.active = false;
  game.expedition.monsterId = null;
  game.expedition.sent = [];
  game.expedition.team = [];
  game.frenzyUntil = 0;
  game.unlocks.departments = false;
  game.unlocks.policies = false;
  // absurdity / expeditions / reforms stay unlocked

  setStageClass('office');
  recalcAll();
  updateTabLocks();
  switchTab('staff');
  checkAchievements();
  log(`ADMINISTRATIVE REFORM #${game.reformCount}! Everything burns. +${gain} Absurdity — the absurdity makes you stronger.`, 'special');
  saveGame();
  renderAll();
}

// --------------------------------------------
// Priority forms (golden clickable) & frenzy
// --------------------------------------------
const GOLDEN_LIFETIME = 8000;
const FRENZY_DURATION = 30000;
const FRENZY_MULTIPLIER = 7;

function frenzyFactor(now) {
  return (now || Date.now()) < game.frenzyUntil ? FRENZY_MULTIPLIER : 1;
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
  btn.textContent = 'PRIORITY FORM';
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
  const roll = Math.random();
  if (roll < 0.5) {
    game.frenzyUntil = Date.now() + FRENZY_DURATION;
    log(`PRIORITY FORM: Frenzy! Production ×${FRENZY_MULTIPLIER} for 30 seconds!`, 'special');
  } else if (roll < 0.85) {
    const bonus = Math.floor(game.formsPerSec * 120 + game.formsPerClick * game.clickMultiplier * 15 + 10);
    game.forms += bonus;
    log(`PRIORITY FORM: expedited processing! +${formatNumber(bonus)} forms!`, 'success');
  } else {
    const bonus = Math.floor(game.stampsPerSec * 120) + 5;
    gainStamps(bonus);
    log(`PRIORITY FORM: certified urgent! +${formatNumber(bonus)} stamps!`, 'success');
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

    // Lifetime stats
    totalFormsAllTime: game.totalFormsAllTime,
    totalStampsEarned: game.totalStampsEarned,
    totalClicks: game.totalClicks,
    reformCount: game.reformCount,
    expeditionsWon: game.expeditionsWon,
    expeditionsFailed: game.expeditionsFailed,
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
    relics: [...game.relics],
    frenzyUntil: game.frenzyUntil,

    // Unlocks
    unlocks: game.unlocks,

    // Purchases (facts only — multipliers are recomputed on load)
    purchasedUpgrades: [...game.purchasedUpgrades],
    activePolicies: [...game.activePolicies],
    unlockedAchievements: [...game.unlockedAchievements],
    staff: STAFF.map(s => ({ id: s.id, owned: s.owned })),
    departments: DEPARTMENTS.map(d => ({ id: d.id, owned: d.owned })),
    investments: INVESTMENTS.map(i => ({ id: i.id, level: i.level }))
  };

  localStorage.setItem('bureaucracy_save', JSON.stringify(saveData));
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
    game.relics = new Set(data.relics || []);
    game.frenzyUntil = data.frenzyUntil || 0;

    // Unlocks
    game.unlocks = Object.assign(game.unlocks, data.unlocks || {});

    // Purchases
    game.purchasedUpgrades = new Set(data.purchasedUpgrades || []);
    game.activePolicies = new Set(data.activePolicies || []);
    game.unlockedAchievements = new Set(data.unlockedAchievements || []);

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

  const OFFLINE_RATE = 0.5;

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
