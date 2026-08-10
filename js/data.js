// ============================================
// GAME DATA - BUREAUCRACY SIMULATOR
// ============================================

// ============================================
// STAGES DEFINITION
// ============================================
// Reaching a threshold no longer advances the stage by itself:
// the Inspector General (stage boss) must be defeated first.
const STAGES = [
  {
    id: 'office',
    name: 'The Office',
    desc: 'A small office drowning in paperwork.',
    threshold: 0,
    color: '#4caf50'
  },
  {
    id: 'administration',
    name: 'The Administration',
    desc: 'You now control a local government branch.',
    threshold: 1e6,
    color: '#2196f3'
  },
  {
    id: 'ministry',
    name: 'The Ministry',
    desc: 'An entire ministry bends to your bureaucratic will.',
    threshold: 1e9,
    color: '#9c27b0'
  },
  {
    id: 'global',
    name: 'The Global Council',
    desc: 'International bureaucracy. Every nation requires your approval.',
    threshold: 1e12,
    color: '#ff9800'
  },
  {
    id: 'cosmic',
    name: 'The Cosmic Bureau',
    desc: 'Alien civilizations must file their existence permits.',
    threshold: 1e15,
    color: '#e91e63'
  },
  {
    id: 'existential',
    name: 'The Existential Office',
    desc: 'Reality itself requires proper documentation.',
    threshold: 1e18,
    color: '#00bcd4'
  }
];

// ============================================
// STAFF - All stages
// ============================================
const STAFF = [
  // === STAGE 1: THE OFFICE ===
  {
    id: 'intern',
    name: 'Intern',
    desc: 'Eager but untrained. Makes coffee sometimes.',
    baseCost: 10,
    costCurrency: 'forms',
    fps: 0.1,
    owned: 0,
    stage: 'office',
    unlockAt: 0
  },
  {
    id: 'clerk',
    name: 'Clerk',
    desc: 'Entry-level form processor.',
    baseCost: 50,
    costCurrency: 'forms',
    fps: 0.5,
    owned: 0,
    stage: 'office',
    unlockAt: 15
  },
  {
    id: 'secretary',
    name: 'Secretary',
    desc: 'Handles multiple forms at once.',
    baseCost: 200,
    costCurrency: 'forms',
    fps: 2,
    owned: 0,
    stage: 'office',
    unlockAt: 100
  },
  {
    id: 'bureaucrat',
    name: 'Bureaucrat',
    desc: 'A true paper-pushing professional.',
    baseCost: 1000,
    costCurrency: 'forms',
    fps: 8,
    owned: 0,
    stage: 'office',
    unlockAt: 500
  },
  {
    id: 'manager',
    name: 'Middle Manager',
    desc: 'Manages the managers who manage.',
    baseCost: 5000,
    costCurrency: 'forms',
    fps: 30,
    owned: 0,
    stage: 'office',
    unlockAt: 2500
  },
  {
    id: 'director',
    name: 'Director',
    desc: 'Has a corner office and a parking spot.',
    baseCost: 25000,
    costCurrency: 'forms',
    fps: 100,
    owned: 0,
    stage: 'office',
    unlockAt: 15000
  },
  {
    id: 'executive',
    name: 'Executive',
    desc: 'Nobody knows what they actually do.',
    baseCost: 100000,
    costCurrency: 'forms',
    fps: 400,
    owned: 0,
    stage: 'office',
    unlockAt: 75000
  },

  // === STAGE 2: THE ADMINISTRATION ===
  {
    id: 'civil_servant',
    name: 'Civil Servant',
    desc: 'Lifetime job security. Processes forms in their sleep.',
    baseCost: 500000,
    costCurrency: 'forms',
    fps: 1500,
    owned: 0,
    stage: 'administration',
    unlockAt: 1e6
  },
  {
    id: 'inspector',
    name: 'Inspector',
    desc: 'Inspects the inspectors who inspect.',
    baseCost: 2e6,
    costCurrency: 'forms',
    fps: 5000,
    owned: 0,
    stage: 'administration',
    unlockAt: 2e6
  },
  {
    id: 'auditor',
    name: 'Auditor',
    desc: 'Finds forms you didn\'t know existed.',
    baseCost: 8e6,
    costCurrency: 'forms',
    fps: 18000,
    owned: 0,
    stage: 'administration',
    unlockAt: 5e6
  },
  {
    id: 'commissioner',
    name: 'Commissioner',
    desc: 'Commands an army of paper pushers.',
    baseCost: 30e6,
    costCurrency: 'forms',
    fps: 60000,
    owned: 0,
    stage: 'administration',
    unlockAt: 20e6
  },
  {
    id: 'prefect',
    name: 'Prefect',
    desc: 'Regional authority. Forms tremble before them.',
    baseCost: 100e6,
    costCurrency: 'forms',
    fps: 200000,
    owned: 0,
    stage: 'administration',
    unlockAt: 50e6
  },

  // === STAGE 3: THE MINISTRY ===
  {
    id: 'undersecretary',
    name: 'Undersecretary',
    desc: 'The power behind the throne of paperwork.',
    baseCost: 500e6,
    costCurrency: 'forms',
    fps: 800000,
    owned: 0,
    stage: 'ministry',
    unlockAt: 1e9
  },
  {
    id: 'deputy_minister',
    name: 'Deputy Minister',
    desc: 'Signs documents without reading them.',
    baseCost: 2e9,
    costCurrency: 'forms',
    fps: 3e6,
    owned: 0,
    stage: 'ministry',
    unlockAt: 2e9
  },
  {
    id: 'minister',
    name: 'Minister',
    desc: 'Creates new forms to process old forms.',
    baseCost: 10e9,
    costCurrency: 'forms',
    fps: 12e6,
    owned: 0,
    stage: 'ministry',
    unlockAt: 5e9
  },
  {
    id: 'prime_bureaucrat',
    name: 'Prime Bureaucrat',
    desc: 'The ultimate form-processing entity.',
    baseCost: 50e9,
    costCurrency: 'forms',
    fps: 50e6,
    owned: 0,
    stage: 'ministry',
    unlockAt: 20e9
  },
  {
    id: 'shadow_council',
    name: 'Shadow Council',
    desc: 'They control the bureaucracy from the shadows.',
    baseCost: 200e9,
    costCurrency: 'forms',
    fps: 200e6,
    owned: 0,
    stage: 'ministry',
    unlockAt: 100e9
  },

  // === STAGE 4: THE GLOBAL COUNCIL ===
  {
    id: 'diplomat',
    name: 'Diplomat',
    desc: 'Makes international paperwork possible.',
    baseCost: 1e12,
    costCurrency: 'forms',
    fps: 1e9,
    owned: 0,
    stage: 'global',
    unlockAt: 1e12
  },
  {
    id: 'ambassador',
    name: 'Ambassador',
    desc: 'Every country needs their forms approved.',
    baseCost: 5e12,
    costCurrency: 'forms',
    fps: 5e9,
    owned: 0,
    stage: 'global',
    unlockAt: 3e12
  },
  {
    id: 'secretary_general',
    name: 'Secretary General',
    desc: 'The world\'s chief bureaucrat.',
    baseCost: 25e12,
    costCurrency: 'forms',
    fps: 25e9,
    owned: 0,
    stage: 'global',
    unlockAt: 10e12
  },
  {
    id: 'world_council',
    name: 'World Council',
    desc: 'A council of councils. Bureaucracy squared.',
    baseCost: 100e12,
    costCurrency: 'forms',
    fps: 100e9,
    owned: 0,
    stage: 'global',
    unlockAt: 50e12
  },
  {
    id: 'global_overseer',
    name: 'Global Overseer',
    desc: 'Sees all forms. Approves none.',
    baseCost: 500e12,
    costCurrency: 'forms',
    fps: 500e9,
    owned: 0,
    stage: 'global',
    unlockAt: 200e12
  },

  // === STAGE 5: THE COSMIC BUREAU ===
  {
    id: 'space_clerk',
    name: 'Space Clerk',
    desc: 'Processes alien visa applications.',
    baseCost: 1e15,
    costCurrency: 'forms',
    fps: 1e12,
    owned: 0,
    stage: 'cosmic',
    unlockAt: 1e15
  },
  {
    id: 'galactic_auditor',
    name: 'Galactic Auditor',
    desc: 'Audits entire solar systems.',
    baseCost: 10e15,
    costCurrency: 'forms',
    fps: 10e12,
    owned: 0,
    stage: 'cosmic',
    unlockAt: 5e15
  },
  {
    id: 'void_administrator',
    name: 'Void Administrator',
    desc: 'Manages the bureaucracy of empty space.',
    baseCost: 100e15,
    costCurrency: 'forms',
    fps: 100e12,
    owned: 0,
    stage: 'cosmic',
    unlockAt: 50e15
  },
  {
    id: 'cosmic_emperor',
    name: 'Cosmic Emperor',
    desc: 'Rules the universe through proper documentation.',
    baseCost: 500e15,
    costCurrency: 'forms',
    fps: 500e12,
    owned: 0,
    stage: 'cosmic',
    unlockAt: 200e15
  },
  {
    id: 'dimension_lord',
    name: 'Dimension Lord',
    desc: 'Controls bureaucracy across dimensions.',
    baseCost: 1e18,
    costCurrency: 'forms',
    fps: 2e15,
    owned: 0,
    stage: 'cosmic',
    unlockAt: 500e15
  },

  // === STAGE 6: THE EXISTENTIAL OFFICE ===
  {
    id: 'time_clerk',
    name: 'Time Clerk',
    desc: 'Files forms before they\'re submitted.',
    baseCost: 5e18,
    costCurrency: 'forms',
    fps: 10e15,
    owned: 0,
    stage: 'existential',
    unlockAt: 1e18
  },
  {
    id: 'reality_auditor',
    name: 'Reality Auditor',
    desc: 'Ensures reality complies with regulations.',
    baseCost: 50e18,
    costCurrency: 'forms',
    fps: 100e15,
    owned: 0,
    stage: 'existential',
    unlockAt: 10e18
  },
  {
    id: 'entropy_manager',
    name: 'Entropy Manager',
    desc: 'Manages the heat death of bureaucracy.',
    baseCost: 500e18,
    costCurrency: 'forms',
    fps: 1e18,
    owned: 0,
    stage: 'existential',
    unlockAt: 100e18
  },
  {
    id: 'god_of_forms',
    name: 'God of Forms',
    desc: 'The divine entity of paperwork.',
    baseCost: 5e21,
    costCurrency: 'forms',
    fps: 10e18,
    owned: 0,
    stage: 'existential',
    unlockAt: 1e21
  },
  {
    id: 'the_absolute',
    name: 'The Absolute',
    desc: 'IS bureaucracy. Always was. Always will be.',
    baseCost: 50e21,
    costCurrency: 'forms',
    fps: 100e18,
    owned: 0,
    stage: 'existential',
    unlockAt: 10e21
  }
];

// ============================================
// UPGRADES - All stages
// ============================================
const UPGRADES = [
  // === STAGE 1: THE OFFICE ===
  // Click upgrades
  {
    id: 'better_stamp',
    name: 'Better Stamp',
    desc: 'A higher quality stamp. +1 form per click.',
    cost: 100,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 1; },
    unlocked: () => true,
    stage: 'office'
  },
  {
    id: 'ergonomic_chair',
    name: 'Ergonomic Chair',
    desc: 'Comfort increases productivity. +2 forms per click.',
    cost: 500,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 2; },
    unlocked: () => game.totalClicks >= 100,
    stage: 'office'
  },
  {
    id: 'red_tape',
    name: 'Red Tape Dispenser',
    desc: 'Essential bureaucratic tool. +5 forms per click.',
    cost: 2500,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 5; },
    unlocked: () => game.totalForms >= 1000,
    stage: 'office'
  },
  {
    id: 'coffee_machine',
    name: 'Coffee Machine',
    desc: 'Interns work 50% faster.',
    cost: 200,
    costCurrency: 'forms',
    effect: () => { STAFF.find(s => s.id === 'intern').fps *= 1.5; },
    unlocked: () => STAFF.find(s => s.id === 'intern').owned >= 5,
    stage: 'office'
  },
  {
    id: 'filing_system',
    name: 'Filing System',
    desc: 'All staff 10% more efficient.',
    cost: 5000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 1.1; },
    unlocked: () => game.totalForms >= 5000,
    stage: 'office'
  },
  {
    id: 'motivational_poster',
    name: 'Motivational Poster',
    desc: '"Hang in there!" - All staff +20% speed.',
    cost: 10000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 1.2; },
    unlocked: () => getTotalStaff() >= 20,
    stage: 'office'
  },
  {
    id: 'auto_stamper',
    name: 'Auto-Stamper 3000',
    desc: 'Clicks are worth 2x more.',
    cost: 50000,
    costCurrency: 'forms',
    effect: () => { game.clickMultiplier *= 2; },
    unlocked: () => game.totalClicks >= 500,
    stage: 'office'
  },
  {
    id: 'overtime_policy',
    name: 'Mandatory Overtime',
    desc: 'Nobody goes home. +50% production.',
    cost: 100000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 1.5; },
    unlocked: () => game.totalForms >= 50000,
    stage: 'office'
  },
  {
    id: 'paper_supplier',
    name: 'Premium Paper Supplier',
    desc: 'Better paper = more forms. +100% production.',
    cost: 250000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2; },
    unlocked: () => game.totalForms >= 100000,
    stage: 'office'
  },
  {
    id: 'digital_scanner',
    name: 'Digital Scanner',
    desc: 'Scan forms instantly. +10 forms per click.',
    cost: 500000,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 10; },
    unlocked: () => game.totalForms >= 200000,
    stage: 'office'
  },
  // Stamp-based upgrades
  {
    id: 'stamp_collection',
    name: 'Stamp Collection',
    desc: 'Your stamps impress visitors. +1 stamp/sec.',
    cost: 10,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 1; },
    unlocked: () => game.stamps >= 5,
    stage: 'office'
  },
  {
    id: 'golden_stamp',
    name: 'Golden Stamp',
    desc: 'A symbol of authority. +100% click power.',
    cost: 50,
    costCurrency: 'stamps',
    effect: () => { game.clickMultiplier *= 2; },
    unlocked: () => game.stamps >= 25,
    stage: 'office'
  },
  {
    id: 'stamp_museum',
    name: 'Stamp Museum',
    desc: 'Tourists pay to see your stamps. +5 stamps/sec.',
    cost: 200,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 5; },
    unlocked: () => game.stamps >= 100,
    stage: 'office'
  },
  {
    id: 'stamp_factory',
    name: 'Stamp Factory',
    desc: 'Mass produce stamps. +20 stamps/sec.',
    cost: 500,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 20; },
    unlocked: () => game.stamps >= 300,
    stage: 'office'
  },

  // === STAGE 2: THE ADMINISTRATION ===
  {
    id: 'bureaucratic_inertia',
    name: 'Bureaucratic Inertia',
    desc: 'Forms process themselves. +100% production.',
    cost: 2e6,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2; },
    unlocked: () => game.totalForms >= 1e6,
    stage: 'administration'
  },
  {
    id: 'rubber_stamp_machine',
    name: 'Rubber Stamp Machine',
    desc: 'Approve everything automatically. +50 forms/click.',
    cost: 5e6,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 50; },
    unlocked: () => game.totalForms >= 2e6,
    stage: 'administration'
  },
  {
    id: 'corruption',
    name: 'Strategic Corruption',
    desc: 'Grease the wheels. +100% production.',
    cost: 20e6,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2; },
    unlocked: () => game.totalForms >= 10e6,
    stage: 'administration'
  },
  {
    id: 'nepotism',
    name: 'Nepotism Department',
    desc: 'Hire family members. Staff costs -30%.',
    cost: 50e6,
    costCurrency: 'forms',
    effect: () => { game.staffCostMultiplier *= 0.7; },
    unlocked: () => getTotalStaff() >= 100,
    stage: 'administration'
  },
  {
    id: 'infinite_carbon_copies',
    name: 'Infinite Carbon Copies',
    desc: 'Each form becomes many. +150% production.',
    cost: 200e6,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2.5; },
    unlocked: () => game.totalForms >= 100e6,
    stage: 'administration'
  },
  {
    id: 'official_seal',
    name: 'Official Government Seal',
    desc: 'Your stamps carry legal weight. +50 stamps/sec.',
    cost: 2000,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 50; },
    unlocked: () => game.stamps >= 1000,
    stage: 'administration'
  },
  {
    id: 'notary_network',
    name: 'Notary Network',
    desc: 'Notaries everywhere. +200 stamps/sec.',
    cost: 5000,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 200; },
    unlocked: () => game.stamps >= 3000,
    stage: 'administration'
  },

  // === STAGE 3: THE MINISTRY ===
  {
    id: 'national_form_day',
    name: 'National Form Day',
    desc: 'A holiday celebrating paperwork. +200% production.',
    cost: 5e9,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 3; },
    unlocked: () => game.totalForms >= 1e9,
    stage: 'ministry'
  },
  {
    id: 'mandatory_forms',
    name: 'Mandatory Form Requirement',
    desc: 'Everything requires a form. +500 forms/click.',
    cost: 20e9,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 500; },
    unlocked: () => game.totalForms >= 5e9,
    stage: 'ministry'
  },
  {
    id: 'form_singularity',
    name: 'Form Singularity',
    desc: 'Forms create forms. +200% production.',
    cost: 100e9,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 3; },
    unlocked: () => game.totalForms >= 50e9,
    stage: 'ministry'
  },
  {
    id: 'ministry_stamps',
    name: 'Ministry-Grade Stamps',
    desc: 'Official ministry stamps. +1000 stamps/sec.',
    cost: 20000,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 1000; },
    unlocked: () => game.stamps >= 10000,
    stage: 'ministry'
  },
  {
    id: 'ai_bureaucrat',
    name: 'AI Bureaucrat',
    desc: 'Artificial intelligence for artificial delays. +300% production.',
    cost: 500e9,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 4; },
    unlocked: () => game.totalForms >= 200e9,
    stage: 'ministry'
  },

  // === STAGE 4: THE GLOBAL COUNCIL ===
  {
    id: 'un_resolution',
    name: 'UN Resolution 4081',
    desc: 'All nations must process forms. +300% production.',
    cost: 5e12,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 4; },
    unlocked: () => game.totalForms >= 1e12,
    stage: 'global'
  },
  {
    id: 'world_stamp',
    name: 'World Stamp Treaty',
    desc: 'Universal stamp recognition. +10000 stamps/sec.',
    cost: 100000,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 10000; },
    unlocked: () => game.stamps >= 50000,
    stage: 'global'
  },
  {
    id: 'global_automation',
    name: 'Global Form Automation',
    desc: 'Every computer processes forms. +400% production.',
    cost: 100e12,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 5; },
    unlocked: () => game.totalForms >= 50e12,
    stage: 'global'
  },
  {
    id: 'click_nuke',
    name: 'Nuclear Stamp',
    desc: 'One click, million forms. +100000 forms/click.',
    cost: 500e12,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 100000; },
    unlocked: () => game.totalForms >= 200e12,
    stage: 'global'
  },

  // === STAGE 5: THE COSMIC BUREAU ===
  {
    id: 'alien_paperwork',
    name: 'Alien Paperwork Treaty',
    desc: 'Extraterrestrials must file forms. +400% production.',
    cost: 5e15,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 5; },
    unlocked: () => game.totalForms >= 1e15,
    stage: 'cosmic'
  },
  {
    id: 'quantum_forms',
    name: 'Quantum Forms',
    desc: 'Forms exist in superposition. +500% production.',
    cost: 100e15,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 6; },
    unlocked: () => game.totalForms >= 50e15,
    stage: 'cosmic'
  },
  {
    id: 'dyson_stamp',
    name: 'Dyson Stamp Sphere',
    desc: 'Harness a star to power stamps. +1M stamps/sec.',
    cost: 1e6,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 1e6; },
    unlocked: () => game.stamps >= 500000,
    stage: 'cosmic'
  },
  {
    id: 'galaxy_brain',
    name: 'Galaxy Brain Bureaucracy',
    desc: 'Think at galactic scale. +1M forms/click.',
    cost: 500e15,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 1e6; },
    unlocked: () => game.totalForms >= 200e15,
    stage: 'cosmic'
  },

  // === STAGE 6: THE EXISTENTIAL OFFICE ===
  {
    id: 'time_forms',
    name: 'Temporal Form Processing',
    desc: 'Process forms from all timelines. +500% production.',
    cost: 5e18,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 6; },
    unlocked: () => game.totalForms >= 1e18,
    stage: 'existential'
  },
  {
    id: 'reality_stamp',
    name: 'Reality Stamp',
    desc: 'Stamp existence into being. +1B stamps/sec.',
    cost: 1e9,
    costCurrency: 'stamps',
    effect: () => { game.stampsPerSec += 1e9; },
    unlocked: () => game.stamps >= 100e6,
    stage: 'existential'
  },
  {
    id: 'entropy_forms',
    name: 'Entropy Reversal Forms',
    desc: 'Bureaucracy defies physics. +700% production.',
    cost: 100e18,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 8; },
    unlocked: () => game.totalForms >= 50e18,
    stage: 'existential'
  },
  {
    id: 'omniscient_click',
    name: 'Omniscient Click',
    desc: 'One click processes all forms ever. +1B forms/click.',
    cost: 500e18,
    costCurrency: 'forms',
    effect: () => { game.formsPerClick += 1e9; },
    unlocked: () => game.totalForms >= 200e18,
    stage: 'existential'
  },
  {
    id: 'the_final_form',
    name: 'The Final Form',
    desc: 'The last form. Or is it? ×10 production.',
    cost: 1e21,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 10; },
    unlocked: () => game.totalForms >= 500e18,
    stage: 'existential'
  }
];

// ============================================
// DEPARTMENTS - All stages
// ============================================
const DEPARTMENTS = [
  // === STAGE 1: THE OFFICE ===
  {
    id: 'hr',
    name: 'Human Resources',
    desc: 'Handles hiring and complaints. Reduces staff costs by 10%.',
    cost: 50000,
    costCurrency: 'forms',
    effect: () => { },
    owned: false,
    unlocked: () => getTotalStaff() >= 15,
    stage: 'office'
  },
  {
    id: 'compliance',
    name: 'Compliance Office',
    desc: 'Ensures everything is by the book. +25% form processing.',
    cost: 100000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 1.25; },
    owned: false,
    unlocked: () => game.totalForms >= 50000,
    stage: 'office'
  },
  {
    id: 'archives',
    name: 'Archives Department',
    desc: 'Stores all the forms. Generates 1 stamp per second.',
    cost: 200000,
    costCurrency: 'forms',
    effect: () => { game.stampsPerSec += 1; },
    owned: false,
    unlocked: () => game.stamps >= 100,
    stage: 'office'
  },
  {
    id: 'it',
    name: 'IT Department',
    desc: '"Have you tried turning it off and on again?" +50% all production.',
    cost: 500000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 1.5; },
    owned: false,
    unlocked: () => getTotalStaff() >= 50,
    stage: 'office'
  },
  {
    id: 'legal',
    name: 'Legal Department',
    desc: 'Sue anyone who questions your forms. +75% production.',
    cost: 750000,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 1.75; },
    owned: false,
    unlocked: () => game.totalForms >= 500000,
    stage: 'office'
  },

  // === STAGE 2: THE ADMINISTRATION ===
  {
    id: 'tax_office',
    name: 'Tax Office',
    desc: 'Tax everything. +100% production.',
    cost: 5e6,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2; },
    owned: false,
    unlocked: () => game.totalForms >= 2e6,
    stage: 'administration'
  },
  {
    id: 'permits_bureau',
    name: 'Permits Bureau',
    desc: 'Require permits for permits. +10 stamps/sec.',
    cost: 10e6,
    costCurrency: 'forms',
    effect: () => { game.stampsPerSec += 10; },
    owned: false,
    unlocked: () => game.stamps >= 500,
    stage: 'administration'
  },
  {
    id: 'appeals_court',
    name: 'Appeals Court',
    desc: 'Deny all appeals. +100% production.',
    cost: 50e6,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2; },
    owned: false,
    unlocked: () => game.totalForms >= 20e6,
    stage: 'administration'
  },
  {
    id: 'propaganda',
    name: 'Propaganda Ministry',
    desc: 'Convince everyone forms are good. +150% production.',
    cost: 200e6,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 2.5; },
    owned: false,
    unlocked: () => game.totalForms >= 100e6,
    stage: 'administration'
  },

  // === STAGE 3: THE MINISTRY ===
  {
    id: 'secret_police',
    name: 'Secret Form Police',
    desc: 'Enforce form compliance. +200% production.',
    cost: 5e9,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 3; },
    owned: false,
    unlocked: () => game.totalForms >= 2e9,
    stage: 'ministry'
  },
  {
    id: 'education',
    name: 'Education Ministry',
    desc: 'Teach children to love forms. +100 stamps/sec.',
    cost: 20e9,
    costCurrency: 'forms',
    effect: () => { game.stampsPerSec += 100; },
    owned: false,
    unlocked: () => game.stamps >= 5000,
    stage: 'ministry'
  },
  {
    id: 'defense',
    name: 'Defense Department',
    desc: 'Defend against form-free zones. +200% production.',
    cost: 100e9,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 3; },
    owned: false,
    unlocked: () => game.totalForms >= 50e9,
    stage: 'ministry'
  },
  {
    id: 'research',
    name: 'Form Research Institute',
    desc: 'Discover new types of forms. +300% production.',
    cost: 500e9,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 4; },
    owned: false,
    unlocked: () => game.totalForms >= 200e9,
    stage: 'ministry'
  },

  // === STAGE 4: THE GLOBAL COUNCIL ===
  {
    id: 'un_bureau',
    name: 'United Nations Bureau',
    desc: 'Global bureaucracy coordination. +300% production.',
    cost: 5e12,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 4; },
    owned: false,
    unlocked: () => game.totalForms >= 2e12,
    stage: 'global'
  },
  {
    id: 'world_bank_forms',
    name: 'World Bank of Forms',
    desc: 'Loan forms to developing nations. +1000 stamps/sec.',
    cost: 50e12,
    costCurrency: 'forms',
    effect: () => { game.stampsPerSec += 1000; },
    owned: false,
    unlocked: () => game.stamps >= 50000,
    stage: 'global'
  },
  {
    id: 'international_court',
    name: 'International Form Court',
    desc: 'Judge all nations by their paperwork. +400% production.',
    cost: 200e12,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 5; },
    owned: false,
    unlocked: () => game.totalForms >= 100e12,
    stage: 'global'
  },

  // === STAGE 5: THE COSMIC BUREAU ===
  {
    id: 'space_station',
    name: 'Orbital Filing Station',
    desc: 'Process forms from orbit. +400% production.',
    cost: 5e15,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 5; },
    owned: false,
    unlocked: () => game.totalForms >= 2e15,
    stage: 'cosmic'
  },
  {
    id: 'alien_embassy',
    name: 'Alien Embassy',
    desc: 'Process extraterrestrial visas. +100000 stamps/sec.',
    cost: 50e15,
    costCurrency: 'forms',
    effect: () => { game.stampsPerSec += 100000; },
    owned: false,
    unlocked: () => game.stamps >= 1e6,
    stage: 'cosmic'
  },
  {
    id: 'galactic_senate',
    name: 'Galactic Senate',
    desc: 'Govern the galaxy through committees. +500% production.',
    cost: 500e15,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 6; },
    owned: false,
    unlocked: () => game.totalForms >= 200e15,
    stage: 'cosmic'
  },

  // === STAGE 6: THE EXISTENTIAL OFFICE ===
  {
    id: 'time_bureau',
    name: 'Temporal Affairs Bureau',
    desc: 'File forms across all timelines. +500% production.',
    cost: 5e18,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 6; },
    owned: false,
    unlocked: () => game.totalForms >= 2e18,
    stage: 'existential'
  },
  {
    id: 'reality_office',
    name: 'Office of Reality',
    desc: 'Determine what exists. +10M stamps/sec.',
    cost: 100e18,
    costCurrency: 'forms',
    effect: () => { game.stampsPerSec += 10e6; },
    owned: false,
    unlocked: () => game.stamps >= 1e9,
    stage: 'existential'
  },
  {
    id: 'void_ministry',
    name: 'Ministry of the Void',
    desc: 'Administer nothingness. +700% production.',
    cost: 500e18,
    costCurrency: 'forms',
    effect: () => { game.globalMultiplier *= 8; },
    owned: false,
    unlocked: () => game.totalForms >= 200e18,
    stage: 'existential'
  }
];

// ============================================
// ACHIEVEMENTS - each unlocked achievement gives +1% production
// ============================================
const ACHIEVEMENTS = [
  // Forms milestones (lifetime, survive reforms)
  { id: 'first_form', cat: 'forms', name: 'First Form', desc: 'Process your first form.', check: () => game.totalFormsAllTime >= 1 },
  { id: 'hundred_forms', cat: 'forms', name: 'Centurion', desc: 'Process 100 forms.', check: () => game.totalFormsAllTime >= 100 },
  { id: 'thousand_forms', cat: 'forms', name: 'Paper Pusher', desc: 'Process 1,000 forms.', check: () => game.totalFormsAllTime >= 1000 },
  { id: 'ten_thousand', cat: 'forms', name: 'Bureaucrat', desc: 'Process 10,000 forms.', check: () => game.totalFormsAllTime >= 10000 },
  { id: 'hundred_thousand', cat: 'forms', name: 'Administrator', desc: 'Process 100,000 forms.', check: () => game.totalFormsAllTime >= 100000 },
  { id: 'million', cat: 'forms', name: 'Director General', desc: 'Process 1,000,000 forms.', check: () => game.totalFormsAllTime >= 1e6 },
  { id: 'billion', cat: 'forms', name: 'Supreme Bureaucrat', desc: 'Process 1,000,000,000 forms.', check: () => game.totalFormsAllTime >= 1e9 },
  { id: 'trillion', cat: 'forms', name: 'World Administrator', desc: 'Process 1 trillion forms.', check: () => game.totalFormsAllTime >= 1e12 },
  { id: 'quadrillion', cat: 'forms', name: 'Cosmic Clerk', desc: 'Process 1 quadrillion forms.', check: () => game.totalFormsAllTime >= 1e15 },
  { id: 'quintillion', cat: 'forms', name: 'Reality Processor', desc: 'Process 1 quintillion forms.', check: () => game.totalFormsAllTime >= 1e18 },
  { id: 'sextillion', cat: 'forms', name: 'The Infinite Form', desc: 'Process 1 sextillion forms.', check: () => game.totalFormsAllTime >= 1e21 },

  // Staff milestones
  { id: 'first_hire', cat: 'staff', name: 'First Hire', desc: 'Hire your first employee.', check: () => getTotalStaff() >= 1 },
  { id: 'small_team', cat: 'staff', name: 'Small Team', desc: 'Have 10 employees.', check: () => getTotalStaff() >= 10 },
  { id: 'department', cat: 'staff', name: 'Department Head', desc: 'Have 50 employees.', check: () => getTotalStaff() >= 50 },
  { id: 'corporation', cat: 'staff', name: 'Corporation', desc: 'Have 100 employees.', check: () => getTotalStaff() >= 100 },
  { id: 'megacorp', cat: 'staff', name: 'Megacorporation', desc: 'Have 500 employees.', check: () => getTotalStaff() >= 500 },
  { id: 'nation', cat: 'staff', name: 'Nation State', desc: 'Have 1000 employees.', check: () => getTotalStaff() >= 1000 },
  { id: 'galactic_empire', cat: 'staff', name: 'Galactic Empire', desc: 'Have 5000 employees.', check: () => getTotalStaff() >= 5000 },

  // Clicks
  { id: 'clicker', cat: 'other', name: 'Carpal Tunnel', desc: 'Click 1,000 times.', check: () => game.totalClicks >= 1000 },
  { id: 'dedicated_clicker', cat: 'other', name: 'Dedicated Clicker', desc: 'Click 10,000 times.', check: () => game.totalClicks >= 10000 },
  { id: 'obsessive_clicker', cat: 'other', name: 'Obsessive Clicker', desc: 'Click 100,000 times.', check: () => game.totalClicks >= 100000 },

  // Stamps (lifetime earnings, so spending doesn't lock you out)
  { id: 'stamp_collector', cat: 'other', name: 'Stamp Collector', desc: 'Earn 100 stamps (lifetime).', check: () => game.totalStampsEarned >= 100 },
  { id: 'stamp_hoarder', cat: 'other', name: 'Stamp Hoarder', desc: 'Earn 10,000 stamps (lifetime).', check: () => game.totalStampsEarned >= 10000 },
  { id: 'stamp_emperor', cat: 'other', name: 'Stamp Emperor', desc: 'Earn 1,000,000 stamps (lifetime).', check: () => game.totalStampsEarned >= 1e6 },
  { id: 'stamp_god', cat: 'other', name: 'Stamp God', desc: 'Earn 1 billion stamps (lifetime).', check: () => game.totalStampsEarned >= 1e9 },

  // Departments
  { id: 'first_department', cat: 'other', name: 'Expansion', desc: 'Create your first department.', check: () => DEPARTMENTS.some(d => d.owned) },
  { id: 'five_departments', cat: 'other', name: 'Diversification', desc: 'Create 5 departments.', check: () => DEPARTMENTS.filter(d => d.owned).length >= 5 },
  { id: 'ten_departments', cat: 'other', name: 'Conglomerate', desc: 'Create 10 departments.', check: () => DEPARTMENTS.filter(d => d.owned).length >= 10 },
  { id: 'all_departments', cat: 'other', name: 'Total Control', desc: 'Own all departments.', check: () => DEPARTMENTS.every(d => d.owned) },

  // Stage achievements (boss-gated now)
  { id: 'stage_administration', cat: 'progress', name: 'Welcome to the Administration', desc: 'Reach the Administration stage.', check: () => game.stageIndex >= 1 },
  { id: 'stage_ministry', cat: 'progress', name: 'Ministry Material', desc: 'Reach the Ministry stage.', check: () => game.stageIndex >= 2 },
  { id: 'stage_global', cat: 'progress', name: 'Global Domination', desc: 'Reach the Global Council stage.', check: () => game.stageIndex >= 3 },
  { id: 'stage_cosmic', cat: 'progress', name: 'Cosmic Bureaucrat', desc: 'Reach the Cosmic Bureau stage.', check: () => game.stageIndex >= 4 },
  { id: 'stage_existential', cat: 'progress', name: 'Existence is Paperwork', desc: 'Reach the Existential Office stage.', check: () => game.stageIndex >= 5 },

  // Bosses
  { id: 'first_boss', cat: 'endgame', name: 'Compliance Enforcer', desc: 'Defeat your first Inspector General.', check: () => game.bossesDefeated >= 1 },
  { id: 'all_bosses', cat: 'endgame', name: 'Nothing Left to Inspect', desc: 'Defeat all 5 Inspectors General.', check: () => game.bossesDefeated >= 5 },

  // Expeditions & relics
  { id: 'first_expedition', cat: 'endgame', name: 'Into the Deep Archives', desc: 'Win your first expedition.', check: () => game.expeditionsWon >= 1 },
  { id: 'monster_hunter', cat: 'endgame', name: 'Archive Exorcist', desc: 'Defeat every monster in the Deep Archives.', check: () => MONSTERS.every(m => (game.monsterKills[m.id] || 0) > 0) },
  { id: 'relic_collector', cat: 'endgame', name: 'Curator of the Absurd', desc: 'Collect all relics.', check: () => game.relics.size >= RELICS.length },

  // Reforms
  { id: 'first_reform', cat: 'endgame', name: 'Starting Over', desc: 'Complete your first Administrative Reform.', check: () => game.reformCount >= 1 },
  { id: 'serial_reformer', cat: 'endgame', name: 'Serial Reformer', desc: 'Complete 5 Administrative Reforms.', check: () => game.reformCount >= 5 },
  { id: 'absurd_hundred', cat: 'endgame', name: 'Theatre of the Absurd', desc: 'Reach 100 Absurdity.', check: () => game.absurdity >= 100 },

  // Special
  { id: 'speedrun', cat: 'other', name: 'Speed Runner', desc: 'Reach 1M forms in under 10 minutes.', check: () => game.totalForms >= 1e6 && (Date.now() - game.runStartTime) < 600000 },
  { id: 'no_click', cat: 'other', name: 'Hands Off', desc: 'Have 1M forms with under 100 clicks.', check: () => game.totalForms >= 1e6 && game.totalClicks < 100 },
  { id: 'click_only', cat: 'other', name: 'Manual Labor', desc: 'Have 100K clicks before hiring anyone.', check: () => game.totalClicks >= 100000 && getTotalStaff() === 0 }
];

// ============================================
// EVENTS - All stages
// ============================================
// Negative events use eventLoss(), which applies negativeEventMultiplier
// (Mandatory Overtime policy) and the Red Stapler relic.
// Bonuses are based on production rate, never on totalForms, so they can't
// snowball a run into the next stage on their own.
const EVENTS = [
  // === STAGE 1: THE OFFICE ===
  {
    id: 'coffee_spill',
    name: 'Coffee Spill!',
    desc: 'Someone spilled coffee on the forms.',
    type: 'danger',
    chance: 0.3,
    minForms: 1000,
    stage: 'office',
    effect: () => {
      const lost = eventLoss(0.05);
      return `Lost ${formatNumber(lost)} forms!`;
    }
  },
  {
    id: 'efficient_day',
    name: 'Efficient Day',
    desc: 'Everyone is working hard today!',
    type: 'success',
    chance: 0.4,
    minForms: 500,
    stage: 'office',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 30);
      game.forms += bonus;
      return `Gained ${formatNumber(bonus)} bonus forms!`;
    }
  },
  {
    id: 'audit',
    name: 'Surprise Audit!',
    desc: 'Auditors found some irregularities...',
    type: 'warning',
    chance: 0.2,
    minForms: 10000,
    stage: 'office',
    effect: () => {
      const lost = eventLoss(0.1);
      // income-based, never a % of the balance — % gains compound out of control
      const gained = Math.floor(game.stampsPerSec * 60) + 10;
      gainStamps(gained);
      return `Lost ${formatNumber(lost)} forms but gained ${formatNumber(gained)} stamps for compliance!`;
    }
  },
  {
    id: 'intern_discovery',
    name: 'Intern Discovery',
    desc: 'An intern found a box of old stamps!',
    type: 'success',
    chance: 0.2,
    minForms: 2000,
    stage: 'office',
    effect: () => {
      const bonus = Math.floor(Math.random() * 5) + 1;
      gainStamps(bonus);
      return `Found ${bonus} stamps!`;
    }
  },
  {
    id: 'paperwork_avalanche',
    name: 'Paperwork Avalanche',
    desc: 'A filing cabinet collapsed!',
    type: 'special',
    chance: 0.1,
    minForms: 50000,
    stage: 'office',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 120);
      game.forms += bonus;
      return `Found ${formatNumber(bonus)} ancient processed forms!`;
    }
  },
  {
    id: 'printer_jam',
    name: 'Printer Jam',
    desc: 'The printer is jammed again.',
    type: 'danger',
    chance: 0.3,
    minForms: 5000,
    stage: 'office',
    effect: () => {
      const fraction = game.forms > 0 ? Math.min(0.1, (game.formsPerSec * 60) / game.forms) : 0;
      const lost = eventLoss(fraction);
      return `Production halted! Lost ${formatNumber(lost)} forms.`;
    }
  },
  {
    id: 'promotion',
    name: 'Surprise Promotion',
    desc: 'Your efficiency was noticed!',
    type: 'success',
    chance: 0.15,
    minForms: 100000,
    stage: 'office',
    effect: () => {
      const bonus = Math.floor(Math.random() * 20) + 10;
      gainStamps(bonus);
      return `Received ${bonus} stamps as a bonus!`;
    }
  },

  // === STAGE 2: THE ADMINISTRATION ===
  {
    id: 'government_shutdown',
    name: 'Government Shutdown',
    desc: 'The government is shutting down temporarily.',
    type: 'danger',
    chance: 0.2,
    minForms: 2e6,
    stage: 'administration',
    effect: () => {
      const lost = eventLoss(0.15);
      return `Lost ${formatNumber(lost)} forms during shutdown!`;
    }
  },
  {
    id: 'budget_surplus',
    name: 'Budget Surplus',
    desc: 'We have extra budget this quarter!',
    type: 'success',
    chance: 0.3,
    minForms: 5e6,
    stage: 'administration',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 120);
      game.forms += bonus;
      return `Gained ${formatNumber(bonus)} forms from extra funding!`;
    }
  },
  {
    id: 'bribery_scandal',
    name: 'Bribery Scandal',
    desc: 'A scandal rocks the administration.',
    type: 'warning',
    chance: 0.15,
    minForms: 20e6,
    stage: 'administration',
    effect: () => {
      const lost = eventLoss(0.2);
      const gained = Math.floor(game.stampsPerSec * 120) + 25;
      gainStamps(gained);
      return `Lost ${formatNumber(lost)} forms but gained ${formatNumber(gained)} hush stamps!`;
    }
  },
  {
    id: 'election_year',
    name: 'Election Year',
    desc: 'Politicians promise more forms!',
    type: 'success',
    chance: 0.25,
    minForms: 50e6,
    stage: 'administration',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 180);
      game.forms += bonus;
      return `Election promises delivered ${formatNumber(bonus)} forms!`;
    }
  },

  // === STAGE 3: THE MINISTRY ===
  {
    id: 'ministerial_decree',
    name: 'Ministerial Decree',
    desc: 'A new decree mandates more forms.',
    type: 'success',
    chance: 0.3,
    minForms: 5e9,
    stage: 'ministry',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 300);
      game.forms += bonus;
      return `Decree generated ${formatNumber(bonus)} mandatory forms!`;
    }
  },
  {
    id: 'coup_attempt',
    name: 'Bureaucratic Coup',
    desc: 'Someone tried to simplify the forms!',
    type: 'danger',
    chance: 0.15,
    minForms: 20e9,
    stage: 'ministry',
    effect: () => {
      const lost = eventLoss(0.25);
      return `Simplification attempt destroyed ${formatNumber(lost)} forms!`;
    }
  },
  {
    id: 'national_holiday',
    name: 'National Form Day',
    desc: 'The nation celebrates bureaucracy!',
    type: 'special',
    chance: 0.2,
    minForms: 100e9,
    stage: 'ministry',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 300);
      const stampBonus = Math.floor(game.stampsPerSec * 180) + 50;
      game.forms += bonus;
      gainStamps(stampBonus);
      return `Celebrations added ${formatNumber(bonus)} forms and ${formatNumber(stampBonus)} stamps!`;
    }
  },

  // === STAGE 4: THE GLOBAL COUNCIL ===
  {
    id: 'world_war_forms',
    name: 'World War on Paper Waste',
    desc: 'Environmentalists attack!',
    type: 'danger',
    chance: 0.2,
    minForms: 5e12,
    stage: 'global',
    effect: () => {
      const lost = eventLoss(0.3);
      return `Eco-terrorists destroyed ${formatNumber(lost)} forms!`;
    }
  },
  {
    id: 'un_mandate',
    name: 'UN Mandate',
    desc: 'The UN requires universal forms.',
    type: 'success',
    chance: 0.25,
    minForms: 20e12,
    stage: 'global',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 600);
      game.forms += bonus;
      return `UN mandate generated ${formatNumber(bonus)} international forms!`;
    }
  },
  {
    id: 'trade_agreement',
    name: 'Global Trade Agreement',
    desc: 'More trade = more customs forms!',
    type: 'success',
    chance: 0.3,
    minForms: 100e12,
    stage: 'global',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 400);
      game.forms += bonus;
      return `Trade agreements generated ${formatNumber(bonus)} customs forms!`;
    }
  },

  // === STAGE 5: THE COSMIC BUREAU ===
  {
    id: 'first_contact',
    name: 'First Contact',
    desc: 'Aliens request landing permits!',
    type: 'special',
    chance: 0.2,
    minForms: 5e15,
    stage: 'cosmic',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 1000);
      const stamps = Math.floor(Math.random() * 10000) + 1000;
      game.forms += bonus;
      gainStamps(stamps);
      return `Aliens submitted ${formatNumber(bonus)} visa forms and ${formatNumber(stamps)} intergalactic stamps!`;
    }
  },
  {
    id: 'supernova',
    name: 'Supernova Paperwork',
    desc: 'A star exploded. Forms required.',
    type: 'success',
    chance: 0.15,
    minForms: 50e15,
    stage: 'cosmic',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 600);
      game.forms += bonus;
      return `Supernova insurance claims: ${formatNumber(bonus)} forms!`;
    }
  },
  {
    id: 'black_hole',
    name: 'Black Hole Incident',
    desc: 'A black hole swallowed some forms.',
    type: 'danger',
    chance: 0.1,
    minForms: 200e15,
    stage: 'cosmic',
    effect: () => {
      const lost = eventLoss(0.4);
      return `Black hole consumed ${formatNumber(lost)} forms forever!`;
    }
  },

  // === STAGE 6: THE EXISTENTIAL OFFICE ===
  {
    id: 'time_paradox',
    name: 'Time Paradox',
    desc: 'Forms from the future arrived!',
    type: 'special',
    chance: 0.2,
    minForms: 5e18,
    stage: 'existential',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 900);
      game.forms += bonus;
      return `Time paradox duplicated ${formatNumber(bonus)} forms!`;
    }
  },
  {
    id: 'reality_glitch',
    name: 'Reality Glitch',
    desc: 'Reality skipped a few forms.',
    type: 'danger',
    chance: 0.15,
    minForms: 50e18,
    stage: 'existential',
    effect: () => {
      const lost = eventLoss(0.5);
      return `Reality glitch erased ${formatNumber(lost)} forms from existence!`;
    }
  },
  {
    id: 'multiverse_merge',
    name: 'Multiverse Merger',
    desc: 'Another universe merged with ours!',
    type: 'special',
    chance: 0.1,
    minForms: 200e18,
    stage: 'existential',
    effect: () => {
      const bonus = game.forms;
      game.forms += bonus;
      return `Multiverse merger DOUBLED your on-hand forms to ${formatNumber(game.forms)}!`;
    }
  },
  {
    id: 'entropy_reversal',
    name: 'Entropy Reversal',
    desc: 'Time flows backwards briefly.',
    type: 'success',
    chance: 0.05,
    minForms: 500e18,
    stage: 'existential',
    effect: () => {
      const bonus = Math.floor(game.formsPerSec * 1200);
      const stampBonus = Math.floor(game.stampsPerSec * 300) + 100;
      game.forms += bonus;
      gainStamps(stampBonus);
      return `Entropy reversal recovered ${formatNumber(bonus)} forms and ${formatNumber(stampBonus)} bonus stamps!`;
    }
  }
];

// ============================================
// POLICIES (New mechanic for later stages)
// ============================================
const POLICIES = [
  {
    id: 'mandatory_overtime',
    name: 'Mandatory Overtime',
    desc: 'All staff work double shifts. +100% production, but negative events hit 50% harder.',
    cost: 1e6,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 500000,
    stage: 'administration',
    effect: () => {
      game.globalMultiplier *= 2;
      game.negativeEventMultiplier *= 1.5;
    }
  },
  {
    id: 'paperless_initiative',
    name: 'Paperless Initiative (Fake)',
    desc: 'Pretend to go paperless. Actually doubles forms.',
    cost: 10e6,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 5e6,
    stage: 'administration',
    effect: () => { game.globalMultiplier *= 2; }
  },
  {
    id: 'form_tax',
    name: 'Form Processing Tax',
    desc: 'Tax every form. +50 stamps per second.',
    cost: 50e6,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.stamps >= 1000,
    stage: 'administration',
    effect: () => { game.stampsPerSec += 50; }
  },
  {
    id: 'triple_redundancy',
    name: 'Triple Redundancy',
    desc: 'Every form needs two copies. +100% production.',
    cost: 1e9,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 500e6,
    stage: 'ministry',
    effect: () => { game.globalMultiplier *= 2; }
  },
  {
    id: 'eternal_archives',
    name: 'Eternal Archives',
    desc: 'Forms are never deleted. +150% production.',
    cost: 100e9,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 50e9,
    stage: 'ministry',
    effect: () => { game.globalMultiplier *= 2.5; }
  },
  {
    id: 'universal_forms',
    name: 'Universal Form Standard',
    desc: 'One form for all nations. +200% production.',
    cost: 1e12,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 500e9,
    stage: 'global',
    effect: () => { game.globalMultiplier *= 3; }
  },
  {
    id: 'quantum_filing',
    name: 'Quantum Filing System',
    desc: 'Forms exist in all states. +300% production.',
    cost: 1e15,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 500e12,
    stage: 'cosmic',
    effect: () => { game.globalMultiplier *= 4; }
  },
  {
    id: 'reality_mandate',
    name: 'Reality Mandate',
    desc: 'Existence requires permits. +400% production.',
    cost: 1e18,
    costCurrency: 'forms',
    active: false,
    unlocked: () => game.totalForms >= 500e15,
    stage: 'existential',
    effect: () => { game.globalMultiplier *= 5; }
  }
];

// ============================================
// INVESTMENTS (Repeatable stamp purchases)
// ============================================
const INVESTMENTS = [
  {
    id: 'efficiency_training',
    name: 'Efficiency Training',
    desc: '+5% global production per level.',
    baseCost: 10,
    costMultiplier: 1.5,
    level: 0,
    maxLevel: 25,
    unlocked: () => game.stamps >= 5,
    effect: () => { game.globalMultiplier *= 1.05; }
  },
  {
    id: 'stamp_press',
    name: 'Stamp Press Upgrade',
    desc: '+1 stamp/sec per level.',
    baseCost: 25,
    costMultiplier: 1.4,
    level: 0,
    maxLevel: 50,
    unlocked: () => game.stampsPerSec >= 1,
    effect: () => { game.stampsPerSec += 1; }
  },
  {
    id: 'click_training',
    name: 'Click Training',
    desc: '+2 forms per click per level.',
    baseCost: 15,
    costMultiplier: 1.3,
    level: 0,
    maxLevel: 50,
    unlocked: () => game.totalClicks >= 50,
    effect: () => { game.formsPerClick += 2; }
  },
  {
    id: 'hiring_budget',
    name: 'Hiring Budget',
    desc: '-2% staff cost per level (max -50%).',
    baseCost: 50,
    costMultiplier: 1.6,
    level: 0,
    maxLevel: 25,
    unlocked: () => getTotalStaff() >= 10,
    effect: () => { game.staffCostMultiplier *= 0.98; }
  },
  {
    id: 'inbox_capacity',
    name: 'Bigger Inbox',
    desc: '+10 min of approval inbox capacity per level.',
    // deliberately steep: permanently relaxing the anti-AFK cap should be a
    // long-term sink (~1M stamps for all 12 levels), not an early splurge
    baseCost: 100,
    costMultiplier: 2.2,
    level: 0,
    maxLevel: 12,
    unlocked: () => game.formsPerSec > 0,
    effect: () => { game.inboxCapacityBonus += 600; }
  },
  {
    id: 'automation_fund',
    name: 'Automation Fund',
    desc: '+10% global production per level.',
    baseCost: 100,
    costMultiplier: 1.8,
    level: 0,
    maxLevel: 25,
    unlocked: () => game.totalForms >= 100000,
    effect: () => { game.globalMultiplier *= 1.1; }
  },
  {
    id: 'stamp_empire',
    name: 'Stamp Empire',
    desc: '+5 stamps/sec per level.',
    baseCost: 500,
    costMultiplier: 2,
    level: 0,
    maxLevel: 30,
    unlocked: () => game.stamps >= 200,
    effect: () => { game.stampsPerSec += 5; }
  },
  {
    id: 'bureaucratic_mastery',
    name: 'Bureaucratic Mastery',
    desc: '+25% global production per level.',
    baseCost: 1000,
    costMultiplier: 2.2,
    level: 0,
    maxLevel: 10,
    unlocked: () => game.totalForms >= 1e6,
    effect: () => { game.globalMultiplier *= 1.25; }
  },
  {
    id: 'infinite_ink',
    name: 'Infinite Ink Supply',
    desc: '+50% global production per level.',
    baseCost: 5000,
    costMultiplier: 2.5,
    level: 0,
    maxLevel: 5,
    unlocked: () => game.totalForms >= 1e9,
    effect: () => { game.globalMultiplier *= 1.5; }
  }
];

// ============================================
// MONSTERS OF THE DEEP ARCHIVES (Expeditions)
// ============================================
// power is compared to raw staff fps (no multipliers) of the squad you send,
// and grows x2.5 with each kill of that monster (the bureaucracy adapts) —
// farming self-limits while the reward stays flat.
// Each monster guarantees its relic on first kill; every kill grants Absurdity.
const MONSTERS = [
  {
    id: 'unstable_pile',
    name: 'The Unstable Pile',
    desc: 'A tower of unfiled paperwork. It sways. It hungers.',
    power: 8e3,
    duration: 10 * 60 * 1000,
    absurdity: 1,
    relic: 'ancient_stamp'
  },
  {
    id: 'duplicate_hydra',
    name: 'The Duplicate Hydra',
    desc: 'Destroy one form, two copies grow back. In triplicate.',
    power: 250e3,
    duration: 30 * 60 * 1000,
    absurdity: 3,
    relic: 'red_stapler'
  },
  {
    id: 'eternal_paperclip',
    name: 'The Eternal Paperclip',
    desc: '"It looks like you\'re trying to escape. Would you like help?"',
    power: 6e6,
    duration: 60 * 60 * 1000,
    absurdity: 8,
    relic: 'coffee_pot'
  },
  {
    id: 'possessed_printer',
    name: 'The Possessed Printer of Sub-Level 3',
    desc: 'PC LOAD LETTER. Forever. For everyone.',
    power: 150e6,
    duration: 2 * 3600 * 1000,
    absurdity: 20,
    relic: 'org_chart'
  },
  {
    id: 'ghost_file',
    name: 'The Ghost of the Lost File (1974)',
    desc: 'Nobody ever found it. Nobody ever will. It found YOU.',
    power: 5e9,
    duration: 4 * 3600 * 1000,
    absurdity: 50,
    relic: 'self_inking_seal'
  },
  {
    id: 'emeritus_director',
    name: 'The Emeritus Director',
    desc: 'Retired 12 years ago. Still signs decrees. Still attends meetings.',
    power: 200e9,
    duration: 6 * 3600 * 1000,
    absurdity: 120,
    relic: 'golden_paperclip'
  },
  {
    id: 'form_a0',
    name: 'FORM A-0',
    desc: 'The form you must fill to be allowed to fill forms. The final boss of paperwork.',
    power: 20e12,
    duration: 8 * 3600 * 1000,
    absurdity: 300,
    relic: 'form_a0_trophy'
  }
];

// ============================================
// RELICS (permanent expedition rewards, survive reforms)
// ============================================
const RELICS = [
  {
    id: 'ancient_stamp',
    name: 'Stamp of the Ancien Régime',
    desc: '+25% click power.',
    effect: () => { game.clickMultiplier *= 1.25; }
  },
  {
    id: 'red_stapler',
    name: 'The Red Stapler',
    desc: 'Negative events are 30% weaker.',
    effect: () => { } // applied in negFactor()
  },
  {
    id: 'coffee_pot',
    name: 'Emergency Coffee Pot',
    desc: '+10% global production.',
    effect: () => { game.globalMultiplier *= 1.1; }
  },
  {
    id: 'org_chart',
    name: 'Laminated Org Chart',
    desc: 'Staff costs -10%.',
    effect: () => { game.staffCostMultiplier *= 0.9; }
  },
  {
    id: 'self_inking_seal',
    name: 'Self-Inking Seal',
    desc: '+50% stamp production.',
    effect: () => { game.stampsMultiplier *= 1.5; }
  },
  {
    id: 'golden_paperclip',
    name: 'The Golden Paperclip',
    desc: 'Priority forms appear 30% more often.',
    effect: () => { game.goldenFrequencyMultiplier *= 0.7; }
  },
  {
    id: 'form_a0_trophy',
    name: 'FORM A-0 (framed)',
    desc: '+50% global production. You defeated paperwork itself.',
    effect: () => { game.globalMultiplier *= 1.5; }
  }
];
