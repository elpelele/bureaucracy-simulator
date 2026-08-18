// ============================================
// GAME STATE
// ============================================
// Only "facts" (resources, owned counts, purchased sets, levels, counters)
// are saved. Every derived value (multipliers, rates, click power) is
// recomputed from scratch by recalcAll() — never persisted.

// User preferences — stored separately from the save so a hard reset keeps them
const settings = {
  darkMode: false,
  sound: true
};

const game = {
  // Resources
  forms: 0,
  stamps: 0,
  inbox: 0,               // passive production waiting for approval
  stampMilestones: 0,     // floor(totalForms / 1000), tracks milestone stamps
  absurdity: 0,             // prestige currency BALANCE (spent on perks)
  totalAbsurdityEarned: 0,  // lifetime — drives the passive production bonus

  // Lifetime stats (survive reforms)
  totalFormsAllTime: 0,
  totalStampsEarned: 0,
  totalClicks: 0,
  reformCount: 0,
  expeditionsWon: 0,
  expeditionsFailed: 0,
  expeditionsRushed: 0,
  bossesDefeated: 0,
  startTime: Date.now(),

  // Current run stats (reset on reform)
  totalForms: 0,
  runStartTime: Date.now(),

  // Derived rates & multipliers — recomputed by recalcAll(), never saved
  formsPerClick: 1,
  formsPerSec: 0,
  stampsPerSec: 0,
  globalMultiplier: 1,
  clickMultiplier: 1,
  clickFpsPercent: 0,     // clicks also gain this fraction of production
  stampsMultiplier: 1,
  staffCostMultiplier: 1,
  negativeEventMultiplier: 1,
  goldenFrequencyMultiplier: 1,
  inboxCapacityBonus: 0,  // extra seconds of inbox capacity
  inboxCapacityMultiplier: 1,

  // Stage progression — advancing requires defeating the stage boss
  stageIndex: 0,

  // Boss fight (The Inspector General)
  boss: {
    active: false,
    hp: 0,
    maxHp: 0,
    endTime: 0,
    cooldownUntil: 0
  },

  // Expeditions into the Deep Archives
  expedition: {
    active: false,
    monsterId: null,
    endTime: 0,
    sent: [],   // [{id, count}] staff units away from their desks
    team: []    // staff ids selected in the team builder (max 3)
  },
  monsterKills: {},       // monsterId -> times defeated (lifetime, achievements)
  monsterKillsRun: {},    // this run only — drives the x2.5 adaptation, reset on reform
  relics: new Set(),

  // Priority form (golden clickable), frenzy & rampage
  frenzyUntil: 0,
  rampageUntil: 0,
  nextGoldenAt: 0,
  goldenActive: false,
  goldenExpires: 0,

  // Collapsed stage sections in the shop lists ("staff:office", ...)
  collapsedStages: new Set(),

  // Directives & incidents (non-blocking decision panels) and timed effects
  directive: { active: false, id: null, expiresAt: 0 },
  nextDirectiveAt: 0,
  buffs: { prodUntil: 0, clickUntil: 0, stampUntil: 0, prodDebuffUntil: 0 },

  // Absurdity perks (persist through reforms)
  purchasedPerks: new Set(),

  // Unlocks
  unlocks: {
    departments: false,
    policies: false,
    absurdity: false,
    reforms: false,
    expeditions: false
  },

  // Purchases
  purchasedUpgrades: new Set(),
  purchasedPolicies: new Set(),  // enacted once (paid)
  activePolicies: new Set(),     // currently in effect (toggleable subset)
  unlockedAchievements: new Set(),

  // Lifetime mechanic counters (achievements & stats)
  directivesAnswered: 0,
  directivesExpired: 0,
  dejaVuCount: 0,
  quantumCollapses: 0,
  rampagesTriggered: 0,

  // Event cooldowns
  lastEvent: 0,
  eventCooldown: 30000, // 30 seconds minimum between events

  // Last user input (click/key/mouse) — drives active vs idle production
  lastActiveAt: Date.now(),

  // Buy quantity (1, 10, 100, or -1 for max)
  buyQuantity: 1
};
