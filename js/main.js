// ============================================
// GAME LOOP
// ============================================

let lastTick = Date.now();
let tickCounter = 0;

// How long after the last input the player still counts as "at their desk"
const ACTIVE_WINDOW_MS = 90000;

function playerIsActive(now) {
  if (typeof document !== 'undefined' && document.hidden) return false;
  return now - game.lastActiveAt < ACTIVE_WINDOW_MS;
}

function tick() {
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  // While the player is at their desk, production flows normally.
  // When they walk away (no input for 90s, or hidden tab), it piles up in
  // the approval inbox instead — which is capped, so idling overnight
  // stops paying quickly.
  const produced = game.formsPerSec * frenzyFactor(now) * prodBuffFactor(now) * delta;
  if (produced > 0) {
    if (playerIsActive(now)) {
      gainForms(produced, true);
    } else {
      const cap = getInboxCapacity();
      game.inbox = Math.min(game.inbox + produced, Math.max(cap, game.inbox));
    }
  }

  // Passive stamp income
  const stampsGain = game.stampsPerSec * stampBuffFactor(now) * delta;
  if (stampsGain > 0) gainStamps(stampsGain);

  // Milestone stamps: 1 per 1000 forms processed (tracked, no refunds)
  const stampMilestone = Math.floor(game.totalForms / 1000);
  if (stampMilestone > game.stampMilestones) {
    gainStamps(stampMilestone - game.stampMilestones);
    game.stampMilestones = stampMilestone;
  }

  // Timed systems
  goldenTick(now);
  bossTick(now);
  directiveTick(now);
  expeditionTick(now);
  triggerRandomEvent();
  checkUnlocks();

  // Achievements are cheap but there's no need to scan 10×/sec
  tickCounter++;
  if (tickCounter % 10 === 0) checkAchievements();

  render();
}

// ============================================
// INIT
// ============================================

function init() {
  // Remember base staff output before any effect touches it —
  // recalcAll() resets to these values then re-applies purchased effects
  STAFF.forEach(s => { s.baseFps = s.fps; });

  // Settings first: setStageClass() during loadGame reads settings.darkMode
  loadSettings();

  // Load saved game (recomputes all derived stats, applies offline progress)
  loadGame();

  // Init tabs
  initTabs();
  updateTabLocks();

  // Event listeners
  els.stampBtn.addEventListener('click', processClick);
  if (els.approveBtn) els.approveBtn.addEventListener('click', approveInbox);

  // Any input keeps the player "at their desk" (see ACTIVE_WINDOW_MS)
  const markActive = () => { game.lastActiveAt = Date.now(); };
  ['pointerdown', 'pointermove', 'keydown', 'wheel'].forEach(ev =>
    document.addEventListener(ev, markActive, { passive: true })
  );

  // Initial render
  renderAll();

  // Game loop (10 ticks per second)
  setInterval(tick, 100);

  // Refresh the visible shop/list and tab badges once per second
  setInterval(() => {
    renderActiveTab();
    updateTabBadges();
  }, 1000);

  // Auto-save every 30 seconds, plus when leaving the page
  setInterval(saveGame, 30000);
  window.addEventListener('beforeunload', saveGame);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveGame();
  });

  // Welcome message
  log('Welcome to Bureaucracy Simulator!', 'info');
  log('Click the stamp to process forms.', 'info');
}

init();

// ============================================
// CONSOLE HELPERS (testing only — type dev.help() in the browser console)
// These bypass normal gating (stage, activity, timers) on purpose.
// ============================================
window.dev = {
  help() {
    return 'dev.panel(id?) | dev.golden() | dev.give(forms?) | dev.stamps(n?) | dev.absurdity(n?) | dev.stage(0-5) | dev.boss()';
  },
  panel(id) {
    const d = id ? DIRECTIVES.find(x => x.id === id) : DIRECTIVES[Math.floor(Math.random() * DIRECTIVES.length)];
    if (!d) return 'unknown id — try: ' + DIRECTIVES.map(x => x.id).join(', ');
    game.directive = { active: true, id: d.id, expiresAt: Date.now() + DIRECTIVE_LIFETIME };
    return `${d.kind === 'incident' ? 'incident' : 'directive'}: ${d.name} (60s)`;
  },
  golden() {
    removeGolden();
    spawnGolden(Date.now());
    return 'priority form on screen for 8s';
  },
  give(n) {
    gainForms(n || 1e6, true);
    return formatNumber(game.forms) + ' forms';
  },
  stamps(n) {
    gainStamps(n || 1000);
    return formatNumber(game.stamps) + ' stamps';
  },
  absurdity(n) {
    gainAbsurdity(n || 100);
    recalcAll();
    return `balance ${formatNumber(game.absurdity)}, lifetime ${formatNumber(game.totalAbsurdityEarned)}`;
  },
  stage(n) {
    game.stageIndex = Math.max(0, Math.min(STAGES.length - 1, n));
    setStageClass(STAGES[game.stageIndex].id);
    recalcAll();
    checkUnlocks();
    updateTabLocks();
    renderAll();
    return STAGES[game.stageIndex].name;
  },
  boss() {
    if (game.stageIndex >= STAGES.length - 1) return 'already at the final stage';
    game.totalForms = Math.max(game.totalForms, STAGES[game.stageIndex + 1].threshold);
    game.boss.cooldownUntil = 0;
    return 'boss pending — click CONFRONT HIM';
  }
};
