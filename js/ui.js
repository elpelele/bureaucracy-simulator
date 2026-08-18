// ============================================
// DOM ELEMENTS
// ============================================

const els = {
  formsDisplay: document.getElementById('forms-display'),
  stampsDisplay: document.getElementById('stamps-display'),
  absurdityDisplay: document.getElementById('absurdity-display'),
  absurdityBonus: document.getElementById('absurdity-bonus'),
  absurdityContainer: document.getElementById('absurdity-container'),
  formsRate: document.getElementById('forms-rate'),
  stampsRate: document.getElementById('stamps-rate'),
  clickInfo: document.getElementById('click-info'),
  stageProgressLabel: document.getElementById('stage-progress-label'),
  totalForms: document.getElementById('total-forms'),
  totalClicks: document.getElementById('total-clicks'),
  timePlayed: document.getElementById('time-played'),
  sideStatus: document.getElementById('side-status'),
  stampBtn: document.getElementById('stamp-btn'),
  directiveContainer: document.getElementById('directive-container'),
  inboxDisplay: document.getElementById('inbox-display'),
  inboxAmount: document.getElementById('inbox-amount'),
  inboxFill: document.getElementById('inbox-fill'),
  inboxPile: document.getElementById('inbox-pile'),
  inboxCapLabel: document.getElementById('inbox-cap-label'),
  inboxPending: document.getElementById('inbox-pending'),
  inboxEmptyHint: document.getElementById('inbox-empty-hint'),
  approveBtn: document.getElementById('approve-btn'),
  bossContainer: document.getElementById('boss-container'),
  staffList: document.getElementById('staff-list'),
  upgradesList: document.getElementById('upgrades-list'),
  departmentsList: document.getElementById('departments-list'),
  policiesList: document.getElementById('policies-list'),
  investmentsList: document.getElementById('investments-list'),
  expeditionsList: document.getElementById('expeditions-list'),
  reformPanel: document.getElementById('reform-panel'),
  statsValues: document.getElementById('stats-values'),
  achievementsList: document.getElementById('achievements-list'),
  logContent: document.getElementById('log-content'),
  tabUpgrades: document.getElementById('tab-upgrades'),
  tabDepartments: document.getElementById('tab-departments'),
  tabPolicies: document.getElementById('tab-policies'),
  tabExpeditions: document.getElementById('tab-expeditions'),
  tabReform: document.getElementById('tab-reform'),
  stageDisplay: document.getElementById('stage-display'),
  stageName: document.getElementById('stage-name'),
  stageProgress: document.getElementById('stage-progress')
};

let activeTab = 'staff';

// ============================================
// FLOAT TEXT (click feedback)
// ============================================

function showFloatText(x, y, text) {
  const float = document.createElement('div');
  float.className = 'float-text';
  float.textContent = text;
  float.style.left = x + 'px';
  float.style.top = y + 'px';
  document.body.appendChild(float);

  // Animate and remove
  requestAnimationFrame(() => {
    float.style.transform = 'translateY(-50px)';
    float.style.opacity = '0';
  });

  setTimeout(() => float.remove(), 500);
}

// ============================================
// TOASTS (small transient notifications)
// ============================================

function toast(message, type = '') {
  const existing = document.querySelectorAll('.toast').length;
  if (existing >= 3) return; // don't flood the screen
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  el.style.top = (16 + existing * 52) + 'px';
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ============================================
// PROMOTION OVERLAY (stage-up / reform celebration)
// ============================================

function showPromotionOverlay(title, subtitle) {
  const el = document.createElement('div');
  el.className = 'promotion-overlay';
  el.innerHTML = `
    <div class="promotion-box">
      <div class="promotion-kicker">— OFFICIAL NOTICE —</div>
      <div class="promotion-title">${title}</div>
      <div class="promotion-sub">${subtitle}</div>
    </div>
  `;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 2800);
}

// ============================================
// LOGGING (limited to 20 entries)
// ============================================

function log(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `
    <div class="log-time">${new Date().toLocaleTimeString()}</div>
    <div class="log-message">${message}</div>
  `;
  els.logContent.prepend(entry);

  // Keep max 20 entries
  while (els.logContent.children.length > 20) {
    els.logContent.removeChild(els.logContent.lastChild);
  }
}

// ============================================
// RENDERING
// ============================================

let lastTitle = '';

function render() {
  const now = Date.now();
  const frenzy = frenzyFactor(now);
  const rampage = rampageFactor(now);

  els.formsDisplay.textContent = formatNumber(game.forms);
  els.stampsDisplay.textContent = formatNumber(game.stamps);
  els.absurdityDisplay.textContent = formatNumber(game.absurdity);
  if (els.absurdityBonus) els.absurdityBonus.textContent = `×${absurdityFactor().toFixed(2)} production`;

  const prodBuff = prodBuffFactor(now);
  const clickBuff = clickBuffFactor(now);
  const effectiveClickPower = effectiveClickBase() * game.clickMultiplier * rampage * clickBuff;
  let rateText = `+${formatNumber(game.formsPerSec * frenzy * prodBuff)}/sec`;
  if (frenzy > 1) rateText += ` [FRENZY ×${frenzy}]`;
  els.formsRate.textContent = rateText;
  els.formsRate.classList.toggle('frenzy', frenzy > 1 || prodBuff > 1);
  els.stampsRate.textContent = `+${formatNumber(game.stampsPerSec * stampBuffFactor(now))}/sec`;
  els.clickInfo.textContent = `${formatNumber(effectiveClickPower)} ${effectiveClickPower < 2 ? 'form' : 'forms'} per click`
    + (rampage > 1 ? ' [RAMPAGE!]' : '');

  // Tab title signals: boss waiting / priority form on screen
  const title = (game.boss.active || bossPending() ? '⚠ ' : '') + (game.goldenActive ? '★ ' : '') + 'Bureaucracy Simulator';
  if (title !== lastTitle) {
    lastTitle = title;
    document.title = title;
  }

  els.totalForms.textContent = formatNumber(game.totalForms);
  els.totalClicks.textContent = formatNumber(game.totalClicks);
  els.timePlayed.textContent = formatTime(now - game.startTime);

  renderSideStatus(now);
  renderInbox();
  renderBoss(now);
  renderDirective(now);
  renderStage();

  // Shop lists are signature-guarded (rebuilt only on structural change), so
  // refreshing the visible one at tick rate is cheap — affordability borders
  // and costs react instantly instead of once per second
  if (activeTab === 'staff') renderStaff();
  else if (activeTab === 'upgrades') renderUpgrades();
  else if (activeTab === 'departments') renderDepartments();
  else if (activeTab === 'policies') renderPolicies();
  else if (activeTab === 'investments') renderInvestments();
}

// Small status lines in the left panel (frenzy timer, expedition countdown)
function renderSideStatus(now) {
  if (!els.sideStatus) return;
  const lines = [];
  if (now < game.frenzyUntil) {
    lines.push(`FRENZY ×${FRENZY_MULTIPLIER} — ${Math.ceil((game.frenzyUntil - now) / 1000)}s`);
  }
  if (now < game.rampageUntil) {
    lines.push(`STAMP RAMPAGE ×${RAMPAGE_MULTIPLIER} — ${Math.ceil((game.rampageUntil - now) / 1000)}s`);
  }
  if (now < game.buffs.prodUntil) {
    lines.push(`Directive: production ×${BUFF_PROD} — ${formatDuration(game.buffs.prodUntil - now)}`);
  }
  if (now < game.buffs.clickUntil) {
    lines.push(`Directive: clicks ×${BUFF_CLICK} — ${formatDuration(game.buffs.clickUntil - now)}`);
  }
  if (now < game.buffs.stampUntil) {
    lines.push(`Directive: stamps ×${BUFF_STAMP} — ${formatDuration(game.buffs.stampUntil - now)}`);
  }
  if (now < game.buffs.prodDebuffUntil) {
    lines.push(`Incident fallout: production ×0.7 — ${formatDuration(game.buffs.prodDebuffUntil - now)}`);
  }
  if (game.expedition.active) {
    const monster = MONSTERS.find(m => m.id === game.expedition.monsterId);
    lines.push(`Expedition: ${monster ? monster.name : '?'} — ${formatDuration(game.expedition.endTime - now)}`);
  }
  els.sideStatus.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
  els.sideStatus.style.display = lines.length ? 'block' : 'none';
}

let inboxPileKey = '';

function renderInbox() {
  if (!els.inboxDisplay) return;
  const cap = getInboxCapacity();
  if (cap <= 0) {
    els.inboxDisplay.style.display = 'none';
    return;
  }
  els.inboxDisplay.style.display = 'flex';

  const capInvestment = INVESTMENTS.find(i => i.id === 'inbox_capacity');
  const level = capInvestment ? capInvestment.level : 0;
  const capSeconds = INBOX_BASE_SECONDS + game.inboxCapacityBonus;
  els.inboxCapLabel.textContent =
    `Capacity: ${formatNumber(cap)} forms (${formatDuration(capSeconds * 1000)} of production)` +
    (level > 0 ? ` — Bigger Inbox Lv.${level}` : '');

  const hasPending = game.inbox >= 1;
  const pct = Math.min(100, (game.inbox / cap) * 100);

  if (els.inboxPending) els.inboxPending.style.display = hasPending ? 'block' : 'none';
  if (els.inboxEmptyHint) els.inboxEmptyHint.style.display = hasPending ? 'none' : 'block';
  els.inboxAmount.textContent = hasPending ? `${formatNumber(game.inbox)} / ${formatNumber(cap)}` : '';
  if (hasPending) {
    els.inboxFill.style.width = pct + '%';
    els.inboxFill.classList.toggle('full', pct >= 99);
  }

  // The paper pile: solid sheets = current fill, ghost sheets = remaining
  // capacity. Buying "Bigger Inbox" visibly makes the pile taller.
  if (els.inboxPile) {
    const maxSheets = 6 + level;
    const filled = Math.min(maxSheets, Math.ceil((pct / 100) * maxSheets));
    const key = filled + '/' + maxSheets;
    if (key !== inboxPileKey) {
      inboxPileKey = key;
      let html = '';
      for (let i = 0; i < maxSheets; i++) {
        const rot = ((i * 37) % 9) - 4; // deterministic messy-pile look
        html += `<div class="inbox-sheet ${i < filled ? '' : 'ghost'}" style="transform: rotate(${rot}deg)"></div>`;
      }
      els.inboxPile.innerHTML = html;
    }
    els.inboxPile.classList.toggle('full', pct >= 99);
  }
}

// --------------------------------------------
// Boss panel — rebuilt only on state change, updated in place otherwise
// --------------------------------------------
let bossUiState = 'hidden';

function renderBoss(now) {
  if (!els.bossContainer) return;
  now = now || Date.now();

  let state = 'hidden';
  if (game.boss.active) state = 'active';
  else if (bossPending()) state = now < game.boss.cooldownUntil ? 'cooldown' : 'pending';

  if (state !== bossUiState) {
    bossUiState = state;
    if (state === 'hidden') {
      els.bossContainer.innerHTML = '';
    } else if (state === 'pending') {
      const nextStage = STAGES[game.stageIndex + 1];
      els.bossContainer.innerHTML = `
        <div class="boss-panel">
          <div class="boss-title">THE INSPECTOR GENERAL</div>
          <div class="boss-desc">He blocks your promotion to ${nextStage.name}. Only YOUR clicks can defeat him — production won't help.</div>
          <button class="boss-fight-btn" onclick="startBossFight()">CONFRONT HIM</button>
        </div>
      `;
    } else if (state === 'cooldown') {
      els.bossContainer.innerHTML = `
        <div class="boss-panel">
          <div class="boss-title">THE INSPECTOR GENERAL</div>
          <div class="boss-desc">He is reviewing his complaint file. He returns in <span id="boss-cooldown">?</span>s.</div>
        </div>
      `;
    } else if (state === 'active') {
      els.bossContainer.innerHTML = `
        <div class="boss-panel active">
          <div class="boss-title">THE INSPECTOR GENERAL — <span id="boss-timer">30</span>s</div>
          <div class="boss-hp-bar"><div id="boss-hp-fill" class="boss-hp-fill" style="width:100%"></div></div>
          <div class="boss-hp-text" id="boss-hp-text"></div>
          <button class="boss-attack-btn" id="boss-attack-btn">FILE OBJECTION (ATTACK)</button>
        </div>
      `;
      const attackBtn = document.getElementById('boss-attack-btn');
      if (attackBtn) attackBtn.addEventListener('click', attackBoss);
    }
  }

  // In-place updates
  if (state === 'active') {
    const fill = document.getElementById('boss-hp-fill');
    const text = document.getElementById('boss-hp-text');
    const timer = document.getElementById('boss-timer');
    if (fill) fill.style.width = Math.max(0, (game.boss.hp / game.boss.maxHp) * 100) + '%';
    if (text) text.textContent = `${formatNumber(Math.max(0, game.boss.hp))} / ${formatNumber(game.boss.maxHp)} compliance points`;
    if (timer) timer.textContent = Math.max(0, Math.ceil((game.boss.endTime - now) / 1000));
  } else if (state === 'cooldown') {
    const cd = document.getElementById('boss-cooldown');
    if (cd) cd.textContent = Math.max(0, Math.ceil((game.boss.cooldownUntil - now) / 1000));
  }
}

// --------------------------------------------
// Council Directive panel — rebuilt on state change, countdown updated in place
// --------------------------------------------
let directiveUiState = '';

function renderDirective(now) {
  if (!els.directiveContainer) return;
  now = now || Date.now();

  const state = game.directive.active ? 'active:' + game.directive.id : 'hidden';
  if (state !== directiveUiState) {
    directiveUiState = state;
    if (!game.directive.active) {
      els.directiveContainer.innerHTML = '';
    } else {
      const d = DIRECTIVES.find(x => x.id === game.directive.id);
      if (!d) return;
      const kindLabel = d.kind === 'incident' ? 'OFFICE INCIDENT' : 'COUNCIL DIRECTIVE';
      els.directiveContainer.innerHTML = `
        <div class="directive-panel ${d.kind === 'incident' ? 'incident' : ''}">
          <div class="directive-title">${kindLabel} — ${d.name} <span class="directive-timer">(<span id="directive-timer">60</span>s)</span></div>
          <div class="directive-desc">${d.desc}</div>
          <div class="directive-choices">
            <button class="directive-btn" title="${d.a.hint}" onclick="chooseDirective('a')">${d.a.label}</button>
            <button class="directive-btn" title="${d.b.hint}" onclick="chooseDirective('b')">${d.b.label}</button>
          </div>
        </div>
      `;
    }
  }

  if (game.directive.active) {
    const timer = document.getElementById('directive-timer');
    if (timer) timer.textContent = Math.max(0, Math.ceil((game.directive.expiresAt - now) / 1000));
  }
}

function renderStage() {
  const currentStage = getCurrentStage();
  const nextStage = STAGES[game.stageIndex + 1];

  if (els.stageName) {
    els.stageName.textContent = bossPending() || game.boss.active
      ? `${currentStage.name} — INSPECTOR AWAITS`
      : currentStage.name;
  }

  if (els.stageProgress && nextStage) {
    const progress = Math.min(100, (game.totalForms / nextStage.threshold) * 100);
    els.stageProgress.style.width = progress + '%';
  } else if (els.stageProgress) {
    els.stageProgress.style.width = '100%';
  }

  if (els.stageProgressLabel) {
    if (bossPending() || game.boss.active) {
      els.stageProgressLabel.textContent = 'Defeat the Inspector General to advance!';
    } else if (nextStage) {
      let text = `${formatNumber(game.totalForms)} / ${formatNumber(nextStage.threshold)} forms`;
      if (game.formsPerSec > 0) {
        const eta = (nextStage.threshold - game.totalForms) / game.formsPerSec;
        text += eta < 360000 // beyond ~100h the number is just noise
          ? ` (~${formatDuration(eta * 1000)} at current rate)`
          : ' (an eternity at this rate — consider a Reform)';
      }
      els.stageProgressLabel.textContent = text;
    } else {
      els.stageProgressLabel.textContent = 'Final stage — reality is fully documented';
    }
  }
}

// Toggle a stage group open/closed in one of the shop lists
function toggleStageCollapse(listName, stageId) {
  const key = listName + ':' + stageId;
  if (game.collapsedStages.has(key)) game.collapsedStages.delete(key);
  else game.collapsedStages.add(key);
  renderActiveTab();
}

function collapseHeader(listName, stageId, stageName, itemCount) {
  const collapsed = game.collapsedStages.has(listName + ':' + stageId);
  return `<div class="category-header collapsible" onclick="toggleStageCollapse('${listName}','${stageId}')">` +
    `${collapsed ? '▸' : '▾'} ${stageName}${collapsed ? ` <span class="collapsed-count">(${itemCount} hidden)</span>` : ''}</div>`;
}

// "(N) affordable" badges on the shop tab buttons
function updateTabBadges() {
  const badge = (el, base, count) => {
    if (!el || el.classList.contains('locked')) return;
    const text = count > 0 ? `${base} (${count})` : base;
    if (el.textContent !== text) el.textContent = text;
  };
  badge(els.tabUpgrades, 'Upgrades', UPGRADES.filter(u =>
    stageIdx(u.stage) <= game.stageIndex && u.unlocked() && !game.purchasedUpgrades.has(u.id) && canAfford(u.cost, u.costCurrency)
  ).length);
  badge(els.tabDepartments, 'Departments', DEPARTMENTS.filter(d =>
    stageIdx(d.stage) <= game.stageIndex && !d.owned && d.unlocked() && canAfford(d.cost, d.costCurrency)
  ).length);
  badge(els.tabPolicies, 'Policies', POLICIES.filter(p =>
    stageIdx(p.stage) <= game.stageIndex && !game.purchasedPolicies.has(p.id) && p.unlocked() && canAfford(p.cost, p.costCurrency)
  ).length);
  badge(els.tabInvestments, 'Investments', INVESTMENTS.filter(inv =>
    inv.unlocked() && inv.level < inv.maxLevel && game.stamps >= getInvestmentCost(inv, inv.level)
  ).length);
}

// --------------------------------------------
// Shop lists: incremental rendering.
// The DOM is only rebuilt when the list's STRUCTURE changes (signature:
// new unlocks, one-shot purchases, buy-quantity switch). Otherwise only
// texts and classes are updated in place — so hover/:active states survive
// rapid clicking, no click ever lands on a destroyed node, and refreshing
// at tick rate (10/s) is cheap enough to make affordability feedback instant.
// --------------------------------------------
let staffUiSignature = null;
let staffNodes = {};

function renderStaff() {
  const unlockedStaff = STAFF.filter(s => isStaffUnlocked(s));

  if (unlockedStaff.length === 0) {
    if (staffUiSignature !== 'empty') {
      staffUiSignature = 'empty';
      els.staffList.innerHTML = '<div class="empty-state">No staff available yet.</div>';
    }
    return;
  }

  // Next staff to unlock (teaser row)
  const nextLocked = STAFF
    .filter(s => stageIdx(s.stage) <= game.stageIndex && game.totalForms < (s.unlockAt || 0))
    .sort((a, b) => a.unlockAt - b.unlockAt)[0];

  const signature = game.buyQuantity + '|' + unlockedStaff.map(s => s.id).join(',') +
    '|' + [...game.collapsedStages].sort().join(',') + '|' + (nextLocked ? nextLocked.id : '');
  if (signature !== staffUiSignature) {
    staffUiSignature = signature;
    staffNodes = {};

    // Group by stage
    const byStage = {};
    unlockedStaff.forEach(staff => {
      if (!byStage[staff.stage]) byStage[staff.stage] = [];
      byStage[staff.stage].push(staff);
    });

    let html = '';
    for (const [stageId, staffList] of Object.entries(byStage)) {
      const stage = STAGES.find(s => s.id === stageId);
      html += collapseHeader('staff', stageId, stage ? stage.name : stageId, staffList.length);
      if (game.collapsedStages.has('staff:' + stageId)) continue;
      staffList.forEach(staff => {
        html += `
          <div class="shop-item" data-id="${staff.id}" onclick="buyStaff('${staff.id}')">
            <div class="item-info">
              <div class="item-name">${staff.name}</div>
              <div class="item-desc">${staff.desc}</div>
              <div class="item-stats"></div>
            </div>
            <div class="item-cost"></div>
          </div>
        `;
      });
    }
    if (nextLocked) {
      html += `
        <div class="shop-item locked-teaser">
          <div class="item-info">
            <div class="item-name">???</div>
            <div class="item-desc">Unlocks at ${formatNumber(nextLocked.unlockAt)} forms processed.</div>
          </div>
        </div>
      `;
    }
    els.staffList.innerHTML = html;

    els.staffList.querySelectorAll('.shop-item[data-id]').forEach(node => {
      staffNodes[node.dataset.id] = {
        root: node,
        stats: node.querySelector('.item-stats'),
        cost: node.querySelector('.item-cost')
      };
    });
  }

  // In-place update of the dynamic bits
  unlockedStaff.forEach(staff => {
    const n = staffNodes[staff.id];
    if (!n) return;

    const qty = game.buyQuantity;
    let cost, canBuy, displayQty;
    if (qty === -1) {
      const maxInfo = getMaxAffordable(staff, staff.costCurrency);
      cost = maxInfo.totalCost;
      canBuy = maxInfo.count > 0;
      displayQty = maxInfo.count;
      if (displayQty === 0) cost = getCostForN(staff, 1); // show what the next one would cost
    } else {
      cost = getCostForN(staff, qty);
      canBuy = canAfford(cost, staff.costCurrency);
      displayQty = qty;
    }

    const away = sentCount(staff.id);
    const working = Math.max(0, staff.owned - away);
    const currentProduction = staff.fps * working * game.globalMultiplier;
    const totalGain = staff.fps * game.globalMultiplier * displayQty;

    n.root.classList.toggle('affordable', canBuy);
    n.stats.textContent =
      `Owned: ${staff.owned}${away > 0 ? ` (${away} exploring)` : ''} (${formatNumber(currentProduction)}/sec)` +
      (displayQty > 0 ? ` | +${formatNumber(totalGain)}/sec` : '');
    n.cost.textContent = `${qty === -1 && displayQty > 0 ? `(${displayQty}) ` : ''}${formatNumber(cost)} ${staff.costCurrency}`;
    n.cost.classList.toggle('affordable', canBuy);
    n.cost.classList.toggle('expensive', !canBuy);
  });
}

let upgradesUiSignature = null;
let upgradeNodes = {};

function renderUpgrades() {
  const availableUpgrades = UPGRADES.filter(u =>
    stageIdx(u.stage) <= game.stageIndex && u.unlocked() && !game.purchasedUpgrades.has(u.id)
  );

  if (availableUpgrades.length === 0) {
    if (upgradesUiSignature !== 'empty') {
      upgradesUiSignature = 'empty';
      els.upgradesList.innerHTML = '<div class="empty-state">No upgrades available. Keep playing to unlock more.</div>';
    }
    return;
  }

  const signature = availableUpgrades.map(u => u.id).join(',') + '|' + [...game.collapsedStages].sort().join(',');
  if (signature !== upgradesUiSignature) {
    upgradesUiSignature = signature;
    upgradeNodes = {};

    const byStage = {};
    availableUpgrades.forEach(upgrade => {
      if (!byStage[upgrade.stage]) byStage[upgrade.stage] = [];
      byStage[upgrade.stage].push(upgrade);
    });

    let html = '';
    for (const [stageId, upgradeList] of Object.entries(byStage)) {
      const stage = STAGES.find(s => s.id === stageId);
      html += collapseHeader('upgrades', stageId, stage ? stage.name : stageId, upgradeList.length);
      if (game.collapsedStages.has('upgrades:' + stageId)) continue;
      upgradeList.forEach(upgrade => {
        const currency = upgrade.costCurrency === 'stamps' ? 'stamps' : 'forms';
        html += `
          <div class="upgrade-item" data-id="${upgrade.id}" onclick="buyUpgrade('${upgrade.id}')">
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-desc">${upgrade.desc}</div>
            <div class="upgrade-cost">${formatNumber(upgrade.cost)} ${currency}</div>
          </div>
        `;
      });
    }
    els.upgradesList.innerHTML = html;

    els.upgradesList.querySelectorAll('.upgrade-item[data-id]').forEach(node => {
      upgradeNodes[node.dataset.id] = node;
    });
  }

  availableUpgrades.forEach(upgrade => {
    const node = upgradeNodes[upgrade.id];
    if (node) node.classList.toggle('affordable', canAfford(upgrade.cost, upgrade.costCurrency));
  });
}

let deptsUiSignature = null;
let deptNodes = {};

function renderDepartments() {
  if (!game.unlocks.departments) {
    if (deptsUiSignature !== 'locked') {
      deptsUiSignature = 'locked';
      els.departmentsList.innerHTML = '<div class="empty-state">Departments not unlocked yet.</div>';
    }
    return;
  }

  const availableDepts = DEPARTMENTS.filter(d => stageIdx(d.stage) <= game.stageIndex && d.unlocked());

  if (availableDepts.length === 0) {
    if (deptsUiSignature !== 'empty') {
      deptsUiSignature = 'empty';
      els.departmentsList.innerHTML = '<div class="empty-state">No departments available yet.</div>';
    }
    return;
  }

  // owned state is part of the structure: buying rebuilds once (name, onclick)
  const signature = availableDepts.map(d => d.id + (d.owned ? '*' : '')).join(',') + '|' + [...game.collapsedStages].sort().join(',');
  if (signature !== deptsUiSignature) {
    deptsUiSignature = signature;
    deptNodes = {};

    const byStage = {};
    availableDepts.forEach(dept => {
      if (!byStage[dept.stage]) byStage[dept.stage] = [];
      byStage[dept.stage].push(dept);
    });

    let html = '';
    for (const [stageId, deptList] of Object.entries(byStage)) {
      const stage = STAGES.find(s => s.id === stageId);
      html += collapseHeader('departments', stageId, stage ? stage.name : stageId, deptList.length);
      if (game.collapsedStages.has('departments:' + stageId)) continue;
      deptList.forEach(dept => {
        html += `
          <div class="shop-item ${dept.owned ? 'owned' : ''}" data-id="${dept.id}"
               onclick="${dept.owned ? '' : `buyDepartment('${dept.id}')`}">
            <div class="item-info">
              <div class="item-name">${dept.name}${dept.owned ? ' [OWNED]' : ''}</div>
              <div class="item-desc">${dept.desc}</div>
            </div>
            <div class="item-cost">${dept.owned ? '' : formatNumber(dept.cost) + ' ' + dept.costCurrency}</div>
          </div>
        `;
      });
    }
    els.departmentsList.innerHTML = html;

    els.departmentsList.querySelectorAll('.shop-item[data-id]').forEach(node => {
      deptNodes[node.dataset.id] = {
        root: node,
        cost: node.querySelector('.item-cost')
      };
    });
  }

  availableDepts.forEach(dept => {
    const n = deptNodes[dept.id];
    if (!n || dept.owned) return;
    const affordable = canAfford(dept.cost, dept.costCurrency);
    n.root.classList.toggle('affordable', affordable);
    n.cost.classList.toggle('affordable', affordable);
    n.cost.classList.toggle('expensive', !affordable);
  });
}

let policiesUiSignature = null;
let policyNodes = {};

function renderPolicies() {
  if (!game.unlocks.policies) {
    if (policiesUiSignature !== 'locked') {
      policiesUiSignature = 'locked';
      els.policiesList.innerHTML = '<div class="empty-state">Policies not unlocked yet.</div>';
    }
    return;
  }

  const availablePolicies = POLICIES.filter(p =>
    stageIdx(p.stage) <= game.stageIndex && p.unlocked() && !game.purchasedPolicies.has(p.id)
  );
  const enactedPolicies = POLICIES.filter(p => game.purchasedPolicies.has(p.id));

  if (availablePolicies.length === 0 && enactedPolicies.length === 0) {
    if (policiesUiSignature !== 'empty') {
      policiesUiSignature = 'empty';
      els.policiesList.innerHTML = '<div class="empty-state">No policies available yet.</div>';
    }
    return;
  }

  const signature = enactedPolicies.map(p => p.id + (game.activePolicies.has(p.id) ? '*' : 'o')).join(',')
    + '|' + availablePolicies.map(p => p.id).join(',');
  if (signature !== policiesUiSignature) {
    policiesUiSignature = signature;
    policyNodes = {};

    let html = '';
    if (enactedPolicies.length > 0) {
      html += '<div class="category-header">Enacted Policies (click to suspend / reactivate)</div>';
      enactedPolicies.forEach(policy => {
        const isActive = game.activePolicies.has(policy.id);
        html += `
          <div class="shop-item ${isActive ? 'owned' : 'suspended'}" onclick="togglePolicy('${policy.id}')">
            <div class="item-info">
              <div class="item-name">${policy.name} ${isActive ? '[ACTIVE]' : '[SUSPENDED]'}</div>
              <div class="item-desc">${policy.desc}</div>
            </div>
            <div class="item-cost">
              <button class="policy-toggle-btn">${isActive ? 'SUSPEND' : 'REACTIVATE'}</button>
            </div>
          </div>
        `;
      });
    }
    if (availablePolicies.length > 0) {
      html += '<div class="category-header">Available Policies</div>';
      availablePolicies.forEach(policy => {
        html += `
          <div class="shop-item" data-id="${policy.id}" onclick="buyPolicy('${policy.id}')">
            <div class="item-info">
              <div class="item-name">${policy.name}</div>
              <div class="item-desc">${policy.desc}</div>
            </div>
            <div class="item-cost">${formatNumber(policy.cost)} ${policy.costCurrency}</div>
          </div>
        `;
      });
    }
    els.policiesList.innerHTML = html;

    els.policiesList.querySelectorAll('.shop-item[data-id]').forEach(node => {
      policyNodes[node.dataset.id] = {
        root: node,
        cost: node.querySelector('.item-cost')
      };
    });
  }

  availablePolicies.forEach(policy => {
    const n = policyNodes[policy.id];
    if (!n) return;
    const affordable = canAfford(policy.cost, policy.costCurrency);
    n.root.classList.toggle('affordable', affordable);
    n.cost.classList.toggle('affordable', affordable);
    n.cost.classList.toggle('expensive', !affordable);
  });
}

let investmentsUiSignature = null;
let investmentNodes = {};

function renderInvestments() {
  const available = INVESTMENTS.filter(inv => inv.unlocked());

  if (available.length === 0) {
    if (investmentsUiSignature !== 'empty') {
      investmentsUiSignature = 'empty';
      els.investmentsList.innerHTML = '<div class="empty-state">No investments available yet. Earn more stamps!</div>';
    }
    return;
  }

  // maxed state changes the structure (onclick removed); levels update in place
  const signature = available.map(inv => inv.id + (inv.level >= inv.maxLevel ? '*' : '')).join(',');
  if (signature !== investmentsUiSignature) {
    investmentsUiSignature = signature;
    investmentNodes = {};

    let html = '';
    available.forEach(inv => {
      const maxed = inv.level >= inv.maxLevel;
      html += `
        <div class="shop-item ${maxed ? 'owned' : ''}" data-id="${inv.id}"
             onclick="${maxed ? '' : `buyInvestment('${inv.id}')`}">
          <div class="item-info">
            <div class="item-name"></div>
            <div class="item-desc">${inv.desc}</div>
          </div>
          <div class="item-cost"></div>
        </div>
      `;
    });
    els.investmentsList.innerHTML = html;

    els.investmentsList.querySelectorAll('.shop-item[data-id]').forEach(node => {
      investmentNodes[node.dataset.id] = {
        root: node,
        name: node.querySelector('.item-name'),
        cost: node.querySelector('.item-cost')
      };
    });
  }

  available.forEach(inv => {
    const n = investmentNodes[inv.id];
    if (!n) return;
    const maxed = inv.level >= inv.maxLevel;

    // Respects the x1/x10/x100/Max buy-quantity selector
    const qty = game.buyQuantity;
    let toBuy = 0, cost = 0;
    if (!maxed) {
      if (qty === -1) {
        const maxInfo = getMaxAffordableInvestment(inv);
        toBuy = maxInfo.count;
        cost = maxInfo.count > 0 ? maxInfo.totalCost : getInvestmentCost(inv, inv.level);
      } else {
        toBuy = Math.min(qty, inv.maxLevel - inv.level);
        cost = getInvestmentCostForN(inv, toBuy);
      }
    }
    const affordable = !maxed && toBuy > 0 && game.stamps >= cost;
    const qtyPrefix = qty === -1
      ? (toBuy > 0 ? `(${toBuy}) ` : '')
      : (toBuy > 1 ? `x${toBuy} ` : '');

    n.name.textContent = `${inv.name} ${maxed ? '[MAX]' : `[Lv.${inv.level}/${inv.maxLevel}]`}`;
    n.cost.textContent = maxed ? '' : `${qtyPrefix}${formatNumber(cost)} stamps`;
    n.root.classList.toggle('affordable', affordable);
    n.cost.classList.toggle('affordable', affordable);
    n.cost.classList.toggle('expensive', !maxed && !affordable);
  });
}

// --------------------------------------------
// Expeditions
// --------------------------------------------
function renderExpeditions() {
  if (!els.expeditionsList) return;

  if (!game.unlocks.expeditions) {
    els.expeditionsList.innerHTML = '<div class="empty-state">The Deep Archives are sealed. Reach The Administration to unlock expeditions.</div>';
    return;
  }

  const now = Date.now();
  let html = '';

  if (game.expedition.active) {
    const monster = MONSTERS.find(m => m.id === game.expedition.monsterId);
    const teamDesc = game.expedition.sent.map(entry => {
      const s = STAFF.find(x => x.id === entry.id);
      return `${entry.count}× ${s ? s.name : entry.id}`;
    }).join(', ');
    const chance = monster ? Math.round(expeditionChance(monster, game.expedition.sent) * 100) : 0;

    html += `
      <div class="expedition-active">
        <div class="category-header">Expedition in progress</div>
        <div class="monster-card active">
          <div class="monster-name">${monster ? monster.name : '?'}</div>
          <div class="monster-desc">${monster ? monster.desc : ''}</div>
          <div class="monster-stats">
            Squad: ${teamDesc}<br>
            Success odds: ${chance}%<br>
            Returns in: <strong>${formatDuration(game.expedition.endTime - now)}</strong>
          </div>
        </div>
        <div class="expedition-hint">Your squad is away from their desks — their production is paused.</div>
      </div>
    `;
    els.expeditionsList.innerHTML = html;
    return;
  }

  // Team builder
  const eligible = STAFF.filter(s => isStaffUnlocked(s) && s.owned >= 2);
  html += '<div class="category-header">Assemble a squad (max 3 staff types — half of each type is sent)</div>';
  if (eligible.length === 0) {
    html += '<div class="empty-state">You need at least 2 of a staff type to send an expedition.</div>';
  } else {
    html += '<div class="team-builder">';
    eligible.forEach(s => {
      const selected = game.expedition.team.includes(s.id);
      const count = Math.floor(s.owned / 2);
      html += `
        <button class="team-chip ${selected ? 'selected' : ''}" onclick="toggleExpeditionStaff('${s.id}')">
          ${s.name} (${count})
        </button>
      `;
    });
    html += '</div>';

    const squad = buildSquad();
    const power = squadPower(squad);
    html += `<div class="squad-power">Squad power: <strong>${formatNumber(power)}</strong> (raw output, no multipliers)</div>`;
  }

  // Monster list
  html += '<div class="category-header">Monsters of the Deep Archives</div>';
  const squad = buildSquad();
  MONSTERS.forEach(monster => {
    const kills = game.monsterKills[monster.id] || 0;
    const relic = RELICS.find(r => r.id === monster.relic);
    const hasRelic = game.relics.has(monster.relic);
    const effPower = monsterPower(monster);
    const chance = squad.length ? Math.round(expeditionChance(monster, squad) * 100) : 0;
    const canLaunch = squad.length > 0;

    html += `
      <div class="monster-card ${kills > 0 ? 'defeated' : ''}">
        <div class="monster-name">${monster.name} ${kills > 0 ? `[defeated ×${kills}]` : ''}</div>
        <div class="monster-desc">${monster.desc}</div>
        <div class="monster-stats">
          Power: ${formatNumber(effPower)}${kills > 0 ? ' (it adapted to your tactics)' : ''} | Duration: ${formatDuration(monster.duration)} | Reward: +${monster.absurdity} Absurdity${relic && !hasRelic ? ` + ${relic.name}` : ''}
          ${squad.length ? `<br>Success odds with current squad: <strong>${chance}%</strong>` : ''}
        </div>
        <button class="launch-btn" ${canLaunch ? '' : 'disabled'} onclick="launchExpedition('${monster.id}')">LAUNCH EXPEDITION</button>
      </div>
    `;
  });

  html += '<div class="expedition-hint">Failure means 10% of the squad resigns. Victory grants Absurdity (+2% production each) and, the first time, a permanent relic. Beware: each defeated monster returns ×2.5 stronger — the bureaucracy adapts.</div>';

  // Relics collection
  if (game.relics.size > 0) {
    html += '<div class="category-header">Relics collected</div>';
    RELICS.forEach(r => {
      if (!game.relics.has(r.id)) return;
      html += `
        <div class="shop-item owned">
          <div class="item-info">
            <div class="item-name">${r.name}</div>
            <div class="item-desc">${r.desc}</div>
          </div>
        </div>
      `;
    });
  }

  els.expeditionsList.innerHTML = html;
}

// --------------------------------------------
// Reform (prestige)
// --------------------------------------------
function renderReform() {
  if (!els.reformPanel) return;

  if (!game.unlocks.reforms) {
    els.reformPanel.innerHTML = '<div class="empty-state">Reach The Ministry to unlock Administrative Reform.</div>';
    return;
  }

  const gain = reformGain();
  const currentFactor = absurdityFactor();
  const newFactor = Math.pow(1 + game.absurdity + gain, 0.19);
  const ready = canReform();

  els.reformPanel.innerHTML = `
    <div class="reform-panel">
      <div class="reform-title">ADMINISTRATIVE REFORM</div>
      <p class="reform-desc">
        Dissolve the entire administration and start over from a small office.
        The sheer absurdity of it all makes you permanently stronger.
      </p>
      <div class="reform-stats">
        <div>Current Absurdity: <strong>${formatNumber(game.absurdity)}</strong> (×${currentFactor.toFixed(2)} production)</div>
        <div>Reform now for: <strong>+${formatNumber(gain)} Absurdity</strong> (bonus becomes ×${newFactor.toFixed(2)})</div>
        <div>Reforms completed: ${game.reformCount}</div>
      </div>
      <div class="reform-keeps">
        <div><strong>You keep:</strong> achievements, relics, monster kills, Absurdity</div>
        <div><strong>You lose:</strong> forms, stamps, staff, upgrades, departments, policies, investments, stage</div>
      </div>
      <button class="reform-btn" ${ready ? '' : 'disabled'} onclick="doReform()">
        ${ready ? `REFORM (+${formatNumber(gain)} Absurdity)` : 'Requires The Ministry and at least 1 Absurdity of progress (1B forms)'}
      </button>
    </div>
    ${renderPerkShopHtml()}
  `;
}

// The Absurdity perk tree (inside the Reform tab)
function renderPerkShopHtml() {
  let html = '<div class="category-header">Absurdity Perks</div>';
  html += `<div class="investments-header">Spend your Absurdity <strong>balance</strong> (${formatNumber(game.absurdity)}) on permanent perks.
    The production bonus (×${absurdityFactor().toFixed(2)}) is based on <strong>lifetime</strong> Absurdity (${formatNumber(game.totalAbsurdityEarned)}) — spending here never lowers it. Perks survive reforms.</div>`;

  PERKS.forEach(perk => {
    const owned = game.purchasedPerks.has(perk.id);
    const affordable = game.absurdity >= perk.cost;
    html += `
      <div class="shop-item ${owned ? 'owned' : (affordable ? 'affordable' : '')}"
           onclick="${owned ? '' : `buyPerk('${perk.id}')`}">
        <div class="item-info">
          <div class="item-name">${perk.name}${owned ? ' [OWNED]' : ''}</div>
          <div class="item-desc">${perk.desc}</div>
        </div>
        <div class="item-cost ${owned ? '' : (affordable ? 'affordable' : 'expensive')}">
          ${owned ? '' : formatNumber(perk.cost) + ' absurdity'}
        </div>
      </div>
    `;
  });
  return html;
}

// --------------------------------------------
// Stats tab (values only — save tools are static HTML)
// --------------------------------------------
function updateStats() {
  if (!els.statsValues) return;
  const relicNames = [...game.relics]
    .map(id => (RELICS.find(r => r.id === id) || {}).name)
    .filter(Boolean);

  els.statsValues.innerHTML = `
    <div class="category-header">Statistics</div>
    <div class="stats-grid">
      <div>Forms processed (all time)</div><div>${formatNumber(game.totalFormsAllTime)}</div>
      <div>Forms processed (this run)</div><div>${formatNumber(game.totalForms)}</div>
      <div>Stamps earned (all time)</div><div>${formatNumber(game.totalStampsEarned)}</div>
      <div>Total clicks</div><div>${formatNumber(game.totalClicks)}</div>
      <div>Current production</div><div>${formatNumber(game.formsPerSec)}/sec</div>
      <div>Absurdity (balance / lifetime)</div><div>${formatNumber(game.absurdity)} / ${formatNumber(game.totalAbsurdityEarned)} (×${absurdityFactor().toFixed(2)} production)</div>
      <div>Perks owned</div><div>${game.purchasedPerks.size} / ${PERKS.length}</div>
      <div>Administrative reforms</div><div>${game.reformCount}</div>
      <div>Inspectors General defeated</div><div>${game.bossesDefeated}</div>
      <div>Expeditions won / failed</div><div>${game.expeditionsWon} / ${game.expeditionsFailed}</div>
      <div>Directives answered / ignored</div><div>${game.directivesAnswered} / ${game.directivesExpired}</div>
      <div>Déjà vus / quantum collapses / rampages</div><div>${game.dejaVuCount} / ${game.quantumCollapses} / ${game.rampagesTriggered}</div>
      <div>Relics</div><div>${relicNames.length ? relicNames.join(', ') : 'none'}</div>
      <div>Achievements</div><div>${game.unlockedAchievements.size} / ${ACHIEVEMENTS.length} (+${game.unlockedAchievements.size}%)</div>
      <div>Time played</div><div>${formatTime(Date.now() - game.startTime)}</div>
    </div>
  `;
}

function renderAchievements() {
  const categories = [
    { name: 'Forms', key: 'forms' },
    { name: 'Staff', key: 'staff' },
    { name: 'Progress', key: 'progress' },
    { name: 'Endgame', key: 'endgame' },
    { name: 'Other', key: 'other' }
  ];

  let html = '<div class="investments-header">Each achievement grants +1% global production.</div>';
  categories.forEach(cat => {
    const items = ACHIEVEMENTS.filter(a => a.cat === cat.key);
    if (items.length === 0) return;

    const unlocked = items.filter(a => game.unlockedAchievements.has(a.id)).length;
    html += `<div class="category-header">${cat.name} (${unlocked}/${items.length})</div>`;

    items.forEach(ach => {
      const isUnlocked = game.unlockedAchievements.has(ach.id);
      html += `
        <div class="achievement ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-name">${isUnlocked ? '[X]' : '[ ]'} ${ach.name}</div>
          <div class="achievement-desc">${isUnlocked ? ach.desc : '???'}</div>
        </div>
      `;
    });
  });

  els.achievementsList.innerHTML = html;
}

function renderAll() {
  render();
  renderStaff();
  renderUpgrades();
  renderDepartments();
  renderPolicies();
  renderInvestments();
  renderExpeditions();
  renderReform();
  renderAchievements();
  updateStats();
}

// Re-render only what the player is looking at (called once per second)
function renderActiveTab() {
  if (activeTab === 'staff') renderStaff();
  else if (activeTab === 'upgrades') renderUpgrades();
  else if (activeTab === 'departments') renderDepartments();
  else if (activeTab === 'policies') renderPolicies();
  else if (activeTab === 'investments') renderInvestments();
  else if (activeTab === 'expeditions') renderExpeditions();
  else if (activeTab === 'reform') renderReform();
  else if (activeTab === 'stats') updateStats();
  else if (activeTab === 'achievements') renderAchievements();
}

// ============================================
// TABS
// ============================================

function updateTabLocks() {
  const locks = [
    [els.tabDepartments, game.unlocks.departments],
    [els.tabPolicies, game.unlocks.policies],
    [els.tabExpeditions, game.unlocks.expeditions],
    [els.tabReform, game.unlocks.reforms]
  ];
  locks.forEach(([el, unlocked]) => {
    if (!el) return;
    el.classList.toggle('locked', !unlocked);
  });
}

function switchTab(tabName) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (!btn || btn.classList.contains('locked')) return;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  btn.classList.add('active');
  const content = document.getElementById('tab-content-' + tabName);
  if (content) content.classList.add('active');

  activeTab = tabName;
  renderActiveTab();
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}
