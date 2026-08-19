// ===== CONTENT AUDIT (run via dev/audit.sh) =====
// Static sanity checks over every purchasable: duplicate names, cost vs
// unlock-threshold ratios, cross-references, curve monotonicity.
let issues = 0;
function flag(msg) { issues++; console.log('  ✗ ' + msg); }
function info(msg) { console.log('  · ' + msg); }

console.log('--- Duplicate ids & display names across all purchasables ---');
const catalog = [];
STAFF.forEach(x => catalog.push(['staff', x.id, x.name]));
UPGRADES.forEach(x => catalog.push(['upgrade', x.id, x.name]));
DEPARTMENTS.forEach(x => catalog.push(['department', x.id, x.name]));
POLICIES.forEach(x => catalog.push(['policy', x.id, x.name]));
INVESTMENTS.forEach(x => catalog.push(['investment', x.id, x.name]));
RELICS.forEach(x => catalog.push(['relic', x.id, x.name]));
MONSTERS.forEach(x => catalog.push(['monster', x.id, x.name]));
EVENTS.forEach(x => catalog.push(['event', x.id, x.name]));
DIRECTIVES.forEach(x => catalog.push(['directive', x.id, x.name]));
PERKS.forEach(x => catalog.push(['perk', x.id, x.name]));
const idSeen = new Map(), nameSeen = new Map();
catalog.forEach(([kind, id, name]) => {
  const idKey = kind === 'event' || kind === 'directive' ? kind + ':' + id : id;
  if (idSeen.has(idKey)) flag(`duplicate id "${id}" (${kind} vs ${idSeen.get(idKey)})`);
  idSeen.set(idKey, kind);
  const nameKey = name.toLowerCase();
  if (nameSeen.has(nameKey)) flag(`duplicate display name "${name}" (${kind} vs ${nameSeen.get(nameKey)})`);
  nameSeen.set(nameKey, kind);
});

console.log('--- Stage references valid & thresholds sorted ---');
for (let i = 1; i < STAGES.length; i++) {
  if (STAGES[i].threshold <= STAGES[i - 1].threshold) flag(`stage thresholds not increasing at ${STAGES[i].id}`);
}
[...STAFF, ...UPGRADES, ...DEPARTMENTS, ...POLICIES, ...EVENTS].forEach(x => {
  if (stageIdx(x.stage) === -1) flag(`${x.id}: unknown stage "${x.stage}"`);
});

console.log('--- Staff: unlockAt inside its stage span, fps/cost monotonic ---');
STAFF.forEach(s => {
  const si = stageIdx(s.stage);
  const lo = STAGES[si].threshold;
  const hi = si + 1 < STAGES.length ? STAGES[si + 1].threshold : Infinity;
  if (s.unlockAt && (s.unlockAt < lo || s.unlockAt >= hi)) {
    flag(`staff ${s.id}: unlockAt ${s.unlockAt} outside stage span [${lo}, ${hi})`);
  }
});
// Monotonic within a stage only: a cheap old-stage staff staying relevant at
// the start of the next stage is intended (payback grows per stage).
for (let i = 1; i < STAFF.length; i++) {
  if (STAFF[i].stage !== STAFF[i - 1].stage) continue;
  if (STAFF[i].baseCost <= STAFF[i - 1].baseCost) flag(`staff cost not increasing: ${STAFF[i].id} (${STAFF[i].baseCost}) after ${STAFF[i - 1].id} (${STAFF[i - 1].baseCost})`);
  if (STAFF[i].fps <= STAFF[i - 1].fps) flag(`staff fps not increasing: ${STAFF[i].id}`);
}

console.log('--- Forms-priced content: cost vs unlock threshold ratio (sane: 2-20x) ---');
function unlockThreshold(item) {
  // parse "game.totalForms >= X" out of the unlocked() source if present
  const src = item.unlocked ? item.unlocked.toString() : '';
  const m = src.match(/totalForms\s*>=\s*([\d.e+]+)/i);
  return m ? parseFloat(m[1]) : null;
}
[...UPGRADES, ...DEPARTMENTS, ...POLICIES].forEach(item => {
  if (item.costCurrency !== 'forms') return;
  const thr = unlockThreshold(item);
  if (!thr) return; // gated by staff count / stamps / clicks: skip
  const ratio = item.cost / thr;
  if (ratio < 1.5 || ratio > 25) flag(`${item.id}: cost ${formatNumber(item.cost)} is ${ratio.toFixed(1)}x its unlock threshold ${formatNumber(thr)}`);
});

console.log('--- Content unlock thresholds inside their stage span ---');
[...UPGRADES, ...DEPARTMENTS, ...POLICIES].forEach(item => {
  const thr = unlockThreshold(item);
  if (!thr) return;
  const si = stageIdx(item.stage);
  const lo = STAGES[si].threshold;
  const hi = si + 1 < STAGES.length ? STAGES[si + 1].threshold : Infinity;
  if (thr < lo || thr >= hi) flag(`${item.id} (${item.stage}): unlock at ${formatNumber(thr)} outside stage span [${formatNumber(lo)}, ${formatNumber(hi)})`);
});

console.log('--- Cross-references ---');
MONSTERS.forEach(m => {
  if (!RELICS.find(r => r.id === m.relic)) flag(`monster ${m.id}: unknown relic "${m.relic}"`);
});
for (let i = 1; i < MONSTERS.length; i++) {
  if (MONSTERS[i].power <= MONSTERS[i - 1].power) flag(`monster power not increasing: ${MONSTERS[i].id}`);
  if (MONSTERS[i].absurdity <= MONSTERS[i - 1].absurdity) flag(`monster absurdity not increasing: ${MONSTERS[i].id}`);
}
const knownEffects = ['prod', 'click', 'stamp', 'forms', 'forms_big', 'stamps_burst', 'absurdity',
  'pay_prod_buff', 'prod_debuff', 'pay_absurdity', 'pay_click_buff', 'pay_nothing', 'stamps_and_debuff'];
DIRECTIVES.forEach(d => {
  [d.a, d.b].forEach(opt => {
    if (!knownEffects.includes(opt.effect)) flag(`directive ${d.id}: unknown effect "${opt.effect}"`);
    if (!opt.hint) flag(`directive ${d.id}: option missing hint`);
  });
  if (d.onExpire && !knownEffects.includes(d.onExpire)) flag(`directive ${d.id}: unknown onExpire "${d.onExpire}"`);
  if (d.kind === 'incident' && !d.onExpire) flag(`incident ${d.id}: missing onExpire (ignoring must have a consequence)`);
  if (d.kind === 'incident' && d.minStage === undefined) flag(`incident ${d.id}: missing minStage`);
});
POLICIES.forEach(pl => {
  const src = pl.effect.toString();
  const looksMalus = /\*= 0\.|staffCostMultiplier \*= 1\.|negativeEventMultiplier \*= 1\.|inboxCapacityMultiplier/.test(src);
  if (looksMalus && !pl.downside) flag(`policy ${pl.id}: effect has a malus but no visible downside field`);
  if (pl.downside && !looksMalus) flag(`policy ${pl.id}: declares a downside but effect has no malus`);
});
for (let i = 1; i < PERKS.length; i++) {
  if (PERKS[i].cost <= PERKS[i - 1].cost) flag(`perk costs not increasing: ${PERKS[i].id}`);
}
INVESTMENTS.forEach(inv => {
  if (inv.costMultiplier <= 1) flag(`investment ${inv.id}: costMultiplier ${inv.costMultiplier} <= 1`);
});
const achIds = new Set();
ACHIEVEMENTS.forEach(a => {
  if (achIds.has(a.id)) flag(`duplicate achievement id ${a.id}`);
  achIds.add(a.id);
  if (!['forms', 'staff', 'progress', 'endgame', 'other'].includes(a.cat)) flag(`achievement ${a.id}: unknown cat "${a.cat}"`);
});

console.log('--- Economy shape rules (learned from manual one-by-one review) ---');
// Flat +N forms/click dies past The Office (production dwarfs it): later
// click upgrades must use clickFpsPercent (% of production per click).
UPGRADES.forEach(u => {
  if (/formsPerClick \+=/.test(u.effect.toString()) && stageIdx(u.stage) > 0) {
    flag(`${u.id} (${u.stage}): flat forms/click past The Office — use clickFpsPercent`);
  }
});
// Flat +N stamps/sec dies past The Ministry (milestone income dwarfs it):
// Global+ stamp sources must multiply all stamp gains instead.
[...UPGRADES, ...DEPARTMENTS, ...POLICIES].forEach(item => {
  if (/stampsPerSec \+=/.test(item.effect.toString()) && stageIdx(item.stage) >= 3) {
    flag(`${item.id} (${item.stage}): flat stamps/sec at Global+ — use stampsMultiplier`);
  }
});
// Two upgrades in the same stage with the same effect body = a duplicate
const effectSeen = new Map();
[...UPGRADES, ...DEPARTMENTS, ...POLICIES].forEach(u => {
  const body = u.effect.toString().replace(/\s+/g, '');
  if (body === '()=>{}') return; // intentionally empty (HR)
  const key = u.stage + '|' + body;
  if (effectSeen.has(key)) flag(`duplicate effect in ${u.stage}: ${u.id} vs ${effectSeen.get(key)}`);
  effectSeen.set(key, u.id);
});
const invEffectSeen = new Map();
INVESTMENTS.forEach(inv => {
  const key = inv.effect.toString().replace(/\s+/g, '');
  if (invEffectSeen.has(key)) flag(`duplicate investment effect: ${inv.id} vs ${invEffectSeen.get(key)}`);
  invEffectSeen.set(key, inv.id);
});

console.log('--- Visual fields present (icons, stamp texts, labels) ---');
STAFF.forEach(st => { if (!st.icon) flag(`staff ${st.id}: missing icon`); });
MONSTERS.forEach(m => { if (!m.icon) flag(`monster ${m.id}: missing icon`); });
STAGES.forEach(st => {
  if (!st.clickLabel) flag(`stage ${st.id}: missing clickLabel`);
  if (!st.stampText) flag(`stage ${st.id}: missing stampText`);
});

console.log('--- Upgrade effects reference valid staff ids ---');
UPGRADES.forEach(u => {
  const src = u.effect.toString();
  const refs = [...src.matchAll(/s\.id === '([a-z_]+)'/g)].map(m => m[1]);
  refs.forEach(id => {
    if (!STAFF.find(s => s.id === id)) flag(`upgrade ${u.id}: references unknown staff "${id}"`);
  });
});

console.log(issues === 0 ? '\n===== AUDIT CLEAN =====' : `\n===== ${issues} ISSUE(S) FOUND =====`);
process.exit(issues > 0 ? 1 : 0);
