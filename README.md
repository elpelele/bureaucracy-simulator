# Bureaucracy Simulator

Un idle/clicker en JavaScript pur (aucune dépendance, aucun build) où l'on gravit la hiérarchie administrative en tamponnant des formulaires — du petit bureau jusqu'à la documentation de la réalité elle-même.

**Jouer** : ouvrir `index.html` dans un navigateur. La sauvegarde est automatique (localStorage, toutes les 30 s et à la fermeture).

---

## La boucle de jeu

- **PROCESS FORM** : chaque clic produit des forms (limité à 15 clics/s comptabilisés — anti-autoclicker).
- **Staff** : produit des forms par seconde, coût ×1,15 par unité possédée.
- **Stamps** : la seconde monnaie. Gagnée par jalons (1 stamp / 1000 forms traités), par taux (stamps/s via upgrades) et par événements. Se dépense dans les **Investments** (bonus permanents à niveaux).
- **Absurdity** : monnaie de prestige. Bonus permanent de production = `(1+A)^0.19` — ×1,6 à 10 points, ×2,4 à 100, ×5 vers 5 000, et un plafond naturel vers ×50 : une réforme profonde accélère le run suivant ×2-3 sans jamais le plier.

### L'anti-AFK : la bannette d'approbation

Tant que le joueur est **actif** (une entrée clavier/souris dans les 90 dernières secondes, onglet visible), la production coule directement dans le compteur. Dès qu'il s'absente, elle s'empile dans l'**Approval Inbox**, plafonnée à **30 min de production** (+10 min par niveau de l'investissement *Bigger Inbox*, 12 niveaux max → 2 h 30). Une fois pleine, la production est perdue. Un clic (ou APPROVE ALL) encaisse le tas. La pile de papier à gauche du panneau montre le remplissage ; les feuilles en pointillés montrent la capacité restante.

**Hors-ligne** (onglet fermé) : au retour, la production est créditée à 50 % du taux, dans la bannette (donc plafonnée) ; les stamps à 50 % plafonnés à 2 h.

### Le formulaire prioritaire

Toutes les 2 à 5 minutes, un bouton doré **PRIORITY FORM** apparaît 8 secondes. Le cliquer donne au hasard : **Frenzy ×7** pendant 30 s (45 %), un burst de forms (30 %), un burst de stamps (15 %) ou **STAMP RAMPAGE** — clics ×77 pendant 15 s (10 %). La relique *Golden Paperclip* le fait apparaître 30 % plus souvent.

Au **Cosmic Bureau**, ils deviennent des **QUANTUM FORMS** : récompenses ×2, mais 15 % de chance de s'effondrer à l'observation (−5 % des forms en caisse).

### Les Directives du Conseil (Global Council+)

Toutes les 3 à 6 minutes de jeu actif, le Conseil exige une décision : un panneau propose **deux options** et 60 secondes pour trancher. Effets possibles : production ×1,5, clics ×3 ou stamps ×2 pendant 10 min, bursts instantanés de forms/stamps, ou +2 Absurdity. Ignorer une directive est sans pénalité — le Conseil soupire et la classe.

---

## Les 6 stages

Atteindre le seuil ne suffit pas : **l'Inspecteur Général** bloque chaque promotion.

Chaque stage a sa palette de couleurs, son bouton et sa nouveauté de gameplay :

| # | Stage | Seuil | Bouton | Nouveauté |
|---|-------|-------|--------|-----------|
| 1 | The Office | 0 | PROCESS FORM | les bases |
| 2 | The Administration | 1 000 000 | STAMP PERMIT | Expéditions |
| 3 | The Ministry | 1e9 | SIGN DECREE | Réforme (prestige) |
| 4 | The Global Council | 3e12 | RATIFY TREATY | Directives du Conseil |
| 5 | The Cosmic Bureau | 3e16 | APPROVE EXISTENCE | Formulaires quantiques |
| 6 | The Existential Office | 1e21 | DOCUMENT REALITY | Déjà vu (2 % des clics ×100) |

### Le boss : l'Inspecteur Général (5 combats)

Au seuil de stage, il apparaît. **Seuls les clics font des dégâts** (dégât = puissance de clic + 5 % de la production/s ; 10 % de critiques ×5 « REJECTED! »). Ses points de conformité valent ~40 coups, à détruire en **30 secondes** — impossible en AFK. Échec : il revient 60 s plus tard. Victoire : stage suivant + **+5 % de production permanent** — mais il **confisque 90 % des forms en caisse** en partant (« pièces à conviction »), pour que chaque stage démarre par une vraie reconstruction.

---

## Contenu

| Type | Nombre | Détail |
|------|--------|--------|
| Staff | **32** | 7 (Office) + 5 par stage suivant ; de l'Intern (0,1/s) à The Absolute (40M/s de base — les multiplicateurs font le reste) |
| Upgrades | **39** | uniques ; production, clic, stamps/s |
| Departments | **22** | achats uniques ; multiplicateurs et stamps/s ; HR : staff −10 % |
| Policies | **8** | uniques ; *Mandatory Overtime* : +50 % production mais événements négatifs +50 % |
| Investments | **9** (232 niveaux) | répétables, payés en stamps ; ~5e14 stamps pour tout maxer |
| Achievements | **45** | chacun donne **+1 % de production** |
| Événements aléatoires | **24** | toutes les ~30-60 s ; bonus basés sur la production/s, malus en % des forms en caisse |
| Monstres d'expédition | **7** | + 7 reliques permanentes |
| Directives du Conseil | **6** | choix binaires périodiques (Global+) |
| Boss | **5** | un par transition de stage |

---

## Expéditions dans les Archives Profondes

Débloquées à **The Administration**. On compose une escouade de **3 types de staff max** ; **la moitié** des effectifs de chaque type part (et ne produit plus pendant l'expédition). La puissance d'escouade = fps *brut* (sans multiplicateurs). Chance de succès = 60 % × (puissance / puissance du monstre), bornée [5 %, 95 %].

| Monstre | Puissance | Durée | Absurdity | Relique (1re victoire) |
|---------|-----------|-------|-----------|------------------------|
| The Unstable Pile | 2 500 | 10 min | +1 | Stamp of the Ancien Régime (+25 % clic) |
| The Duplicate Hydra | 35 000 | 30 min | +3 | The Red Stapler (événements négatifs −30 %) |
| The Eternal Paperclip | 1,5e6 | 1 h | +8 | Emergency Coffee Pot (+10 % production) |
| The Possessed Printer of Sub-Level 3 | 8e6 | 2 h | +20 | Laminated Org Chart (staff −10 %) |
| The Ghost of the Lost File (1974) | 450e6 | 4 h | +50 | Self-Inking Seal (+50 % stamps) |
| The Emeritus Director | 600e9 | 6 h | +120 | The Golden Paperclip (priority forms +30 %) |
| FORM A-0 | 40e15 | 8 h | +300 | FORM A-0 encadré (+50 % production) |

- **La bureaucratie s'adapte** : chaque victoire multiplie la puissance de ce monstre par **×2,5** — le farm s'auto-limite.
- **Échec** : 10 % de l'escouade démissionne (perdus définitivement).
- Les reliques et l'Absurdity survivent aux réformes.

---

## La Réforme Administrative (prestige)

Débloquée à **The Ministry**. Gain : `⌊√(forms traités du run / 1e9)⌋` points d'Absurdity ; le bonus de production `(1+A)^0.19` est permanent (voir plus haut).

- **Perdu** : forms, stamps, staff, upgrades, departments, policies, investments, stage.
- **Conservé** : achievements, reliques, kills de monstres, Absurdity, statistiques lifetime.

---

## Réglages & sauvegarde

Onglet **Settings** : mode sombre, sons de tampon (synthèse WebAudio, aucun fichier audio), export/import de sauvegarde (base64) et hard reset. Les réglages sont stockés à part et survivent au hard reset.

---

## Développement

```
index.html      structure
css/style.css   styles (dont thème sombre via body.dark)
js/data.js      tout le contenu (stages, staff, upgrades, monstres…)
js/state.js     l'état du jeu (les « faits » sauvegardés)
js/utils.js     helpers (formatage, coûts, gains)
js/ui.js        rendu (incrémental : DOM reconstruit seulement si la structure change)
js/game.js      logique (recalcAll, boss, expéditions, réforme, save/load v3)
js/main.js      boucle de jeu (tick 100 ms) et init
```

Principes :

- **Rien de dérivé n'est sauvegardé.** `recalcAll()` recalcule tous les multiplicateurs depuis les faits (possédé/acheté/niveaux) — on peut rééquilibrer `data.js` sans casser les sauvegardes. Les sauvegardes v2 migrent automatiquement.
- **Jamais de gain en % du solde de stamps** dans les événements : à ~90 événements/h, ça compose exponentiellement même AFK (mesuré ×2867 en une nuit avant correctif). Tous les gains d'événements sont basés sur le revenu (`stampsPerSec × durée`).
- **Courbe de progression** : les seuils de stage sont **super-exponentiels** (×1000, ×3000, ×10⁴, ×3×10⁴) parce que la croissance intra-stage compose (~×3000/stage) ; les fps du staff sont dérivés de `coût / (multiplicateur cumulé attendu × temps de rentabilisation)`, ce dernier croissant par stage ; le contenu est étalé sur toute la largeur de chaque stage et chaque investment de production se finance un stage plus tard que le précédent (les jalons de stamps étant linéaires en forms). Rythme mesuré au bot optimal (humain ≈ ×1,5-2) : Office 23 min, Administration 20, Ministry 28, Global 20, Cosmic ~1 h 40, Existential ~2 h 20 — ~5 h 30 pour un premier clear complet. Après une réforme à l'entrée du Cosmic (~5,5K Absurdity, ×5,1), le second run complet prend ~1 h 40 : la réforme accélère ×3, elle ne plie pas le jeu (courbe validée par `SIM_ABSURDITY=5477 ./dev/sim.sh`).
- Tests : harnais headless Node (stubs DOM + fichiers concaténés + assertions), 71 tests, plus des simulations de rythme (bot glouton) et d'économie.
