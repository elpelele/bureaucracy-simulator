// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n);
  if (n >= 1e36) return n.toExponential(2);
  if (n >= 1e33) return (n / 1e33).toFixed(2) + 'D';   // Decillion
  if (n >= 1e30) return (n / 1e30).toFixed(2) + 'N';   // Nonillion
  if (n >= 1e27) return (n / 1e27).toFixed(2) + 'Oc';  // Octillion
  if (n >= 1e24) return (n / 1e24).toFixed(2) + 'Sp';  // Septillion
  if (n >= 1e21) return (n / 1e21).toFixed(2) + 'Sx';  // Sextillion
  if (n >= 1e18) return (n / 1e18).toFixed(2) + 'Qi';  // Quintillion
  if (n >= 1e15) return (n / 1e15).toFixed(2) + 'Qa';  // Quadrillion
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';   // Trillion
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';     // Billion
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';     // Million
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';     // Thousand
  if (n < 1 && n > 0) return n.toFixed(1);             // Small decimals
  return Math.floor(n).toString();
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

// Human-friendly duration, e.g. "2h 05m", "12m 30s", "45s"
function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
  return `${seconds}s`;
}

function getTotalStaff() {
  return STAFF.reduce((sum, s) => sum + s.owned, 0);
}

function getCurrentStage() {
  return STAGES[game.stageIndex] || STAGES[0];
}

function stageIdx(stageId) {
  return STAGES.findIndex(s => s.id === stageId);
}

function isStaffUnlocked(staff) {
  if (stageIdx(staff.stage) > game.stageIndex) return false;
  if (!staff.unlockAt) return true;
  return game.totalForms >= staff.unlockAt;
}

function canAfford(cost, currency) {
  if (currency === 'forms') return game.forms >= cost;
  if (currency === 'stamps') return game.stamps >= cost;
  return false;
}

function spend(cost, currency) {
  if (currency === 'forms') game.forms -= cost;
  if (currency === 'stamps') game.stamps -= cost;
}

// Add forms; production/clicks count toward totals, event windfalls do not
function gainForms(n, countsAsProcessed) {
  game.forms += n;
  if (countsAsProcessed) {
    game.totalForms += n;
    game.totalFormsAllTime += n;
  }
}

function gainStamps(n) {
  game.stamps += n;
  game.totalStampsEarned += n;
}

// Absurdity production bonus. Deliberately gentle: the walls it must help
// climb are only ~30-60x too hard, so even a x5 bonus roughly halves them.
// Sim-tuned so a cosmic-entry reform (~5.5K pts) speeds the next run ~2-3x
// instead of folding it. 10 pts -> x1.6 | 100 -> x2.4 | 5.5K -> x5.1 |
// 1M -> x14 | 1B -> x51 (chained reforms self-limit around there).
function absurdityFactor() {
  return Math.pow(1 + game.absurdity, 0.19);
}

// Negative event severity: policies make it worse, the Red Stapler softens it
function negFactor() {
  let f = game.negativeEventMultiplier;
  if (game.relics.has('red_stapler')) f *= 0.7;
  return f;
}

// Lose a fraction of current forms to a negative event; returns amount lost
function eventLoss(fraction) {
  const f = Math.min(0.9, fraction * negFactor());
  const lost = Math.floor(game.forms * f);
  game.forms -= lost;
  return lost;
}

// The approval inbox holds this many forms (scales with production)
const INBOX_BASE_SECONDS = 1800; // 30 minutes of production
function getInboxCapacity() {
  return game.formsPerSec * (INBOX_BASE_SECONDS + game.inboxCapacityBonus) * game.inboxCapacityMultiplier;
}

// Base click value: flat forms/click plus a share of production (late-game
// click upgrades feed clickFpsPercent so clicking stays relevant forever)
function effectiveClickBase() {
  return game.formsPerClick + game.formsPerSec * game.clickFpsPercent;
}

// Staff units currently away on an expedition
function sentCount(staffId) {
  if (!game.expedition.active) return 0;
  const entry = game.expedition.sent.find(s => s.id === staffId);
  return entry ? entry.count : 0;
}

// Calculate total cost for buying N items (exponential cost)
function getCostForN(item, n) {
  let total = 0;
  const currentOwned = item.owned || 0;
  for (let i = 0; i < n; i++) {
    let cost = Math.floor(item.baseCost * Math.pow(1.15, currentOwned + i));
    if (DEPARTMENTS.find(d => d.id === 'hr')?.owned) {
      cost = Math.floor(cost * 0.9);
    }
    if (item.fps !== undefined && game.staffCostMultiplier) {
      cost = Math.floor(cost * game.staffCostMultiplier);
    }
    total += cost;
  }
  return total;
}

// Investment level costs (stamps)
function getInvestmentCost(inv, level) {
  return Math.floor(inv.baseCost * Math.pow(inv.costMultiplier, level));
}

function getInvestmentCostForN(inv, n) {
  let total = 0;
  for (let i = 0; i < n; i++) total += getInvestmentCost(inv, inv.level + i);
  return total;
}

function getMaxAffordableInvestment(inv) {
  let count = 0;
  let totalCost = 0;
  while (inv.level + count < inv.maxLevel) {
    const next = getInvestmentCost(inv, inv.level + count);
    if (totalCost + next > game.stamps) break;
    totalCost += next;
    count++;
  }
  return { count, totalCost };
}

// Calculate max affordable
function getMaxAffordable(item, currency) {
  const available = currency === 'forms' ? game.forms : game.stamps;
  let count = 0;
  let totalCost = 0;
  const currentOwned = item.owned || 0;

  while (count < 1000) { // Cap at 1000 to prevent infinite loops
    let nextCost = Math.floor(item.baseCost * Math.pow(1.15, currentOwned + count));
    if (DEPARTMENTS.find(d => d.id === 'hr')?.owned) {
      nextCost = Math.floor(nextCost * 0.9);
    }
    if (item.fps !== undefined && game.staffCostMultiplier) {
      nextCost = Math.floor(nextCost * game.staffCostMultiplier);
    }
    if (totalCost + nextCost > available) break;
    totalCost += nextCost;
    count++;
  }
  return { count, totalCost };
}
