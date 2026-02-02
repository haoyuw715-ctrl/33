import { Card } from './types';

export const MAX_HAND_SIZE = 7;
export const INITIAL_HAND_SIZE = 3;
export const CARDS_PER_TURN = 3;
export const INITIAL_HP = 50;
export const INITIAL_ENERGY = 3;
export const ENERGY_REGEN = 3;

export const CARD_TEMPLATES: Omit<Card, 'id'>[] = [
  // --- BASICS ---
  {
    templateId: 'strike',
    name: 'Plasma Strike',
    description: 'Deal 6 damage.',
    cost: 1,
    type: 'ATTACK',
    value: 6,
  },
  {
    templateId: 'shield_wall',
    name: 'Holo-Shield',
    description: 'Gain 5 Block.',
    cost: 1,
    type: 'DEFEND',
    value: 5,
  },
  {
    templateId: 'quick_repair',
    name: 'Nanobot Repair',
    description: 'Heal 4 HP.',
    cost: 1,
    type: 'HEAL',
    value: 4,
  },
  {
    templateId: 'panic_button',
    name: 'Panic Button',
    description: 'Gain 6 Block. 0 Cost.',
    cost: 0,
    type: 'DEFEND',
    value: 6
  },

  // --- INTERMEDIATE ---
  {
    templateId: 'heavy_beam',
    name: 'Heavy Beam',
    description: 'Deal 12 damage.',
    cost: 2,
    type: 'ATTACK',
    value: 12,
  },
  {
    templateId: 'fortress',
    name: 'Fortress Protocol',
    description: 'Gain 12 Block.',
    cost: 2,
    type: 'DEFEND',
    value: 12,
  },
  {
    templateId: 'precision_shot',
    name: 'Precision Shot',
    description: 'Deal 5 damage. Draw 1 card.',
    cost: 1,
    type: 'ATTACK',
    value: 5,
    effect: 'draw_1'
  },
  {
    templateId: 'spike_field',
    name: 'Spike Field',
    description: 'Gain 8 Block. Deal 3 Thorns DMG.',
    cost: 1,
    type: 'DEFEND',
    value: 8,
    effect: 'thorns_3'
  },

  // --- SPECIAL & UTILITY ---
  {
    templateId: 'reactor_overload',
    name: 'Reactor Overload',
    description: 'Gain 2 Energy. Take 5 Damage.',
    cost: 0,
    type: 'SPECIAL',
    value: 0,
    effect: 'energy_2 recoil_5'
  },
  {
    templateId: 'blood_pact',
    name: 'Blood Pact',
    description: 'Draw 3 cards. Take 6 Damage.',
    cost: 0,
    type: 'SPECIAL',
    value: 0,
    effect: 'draw_3 recoil_6'
  },
  {
    templateId: 'time_warp',
    name: 'Time Warp',
    description: 'Heal 5 HP. Draw 2 cards.',
    cost: 2,
    type: 'HEAL',
    value: 5,
    effect: 'draw_2'
  },

  // --- POWER CARDS ---
  {
    templateId: 'piercing_shot',
    name: 'Railgun Shot',
    description: 'Deal 10 DMG. Ignores Shield. Draw 1.',
    cost: 2,
    type: 'ATTACK',
    value: 10,
    effect: 'pierce draw_1'
  },
  {
    templateId: 'vampire_lord',
    name: 'Crimson Drain',
    description: 'Deal 12 DMG. Heal for damage dealt.',
    cost: 3,
    type: 'ATTACK',
    value: 12,
    effect: 'drain'
  },
  {
    templateId: 'kamikaze',
    name: 'Kamikaze Drone',
    description: 'Deal 25 DMG. Take 8 Recoil.',
    cost: 2,
    type: 'ATTACK',
    value: 25,
    effect: 'recoil_8'
  },
  {
    templateId: 'absolute_defense',
    name: 'Aegis Core',
    description: 'Gain 30 Block.',
    cost: 3,
    type: 'DEFEND',
    value: 30
  },
  {
    templateId: 'doomsday',
    name: 'Doomsday',
    description: 'Deal 50 Damage.',
    cost: 5,
    type: 'ATTACK',
    value: 50
  },
  {
    templateId: 'kinetic_barrier',
    name: 'Kinetic Barrier',
    description: 'Gain 10 Block. 8 Thorns DMG.',
    cost: 2,
    type: 'DEFEND',
    value: 10,
    effect: 'thorns_8'
  },
  {
    templateId: 'double_edge',
    name: 'Double Edge',
    description: 'Deal 20 Damage. Take 5 Recoil.',
    cost: 1,
    type: 'ATTACK',
    value: 20,
    effect: 'recoil_5'
  }
];

export const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  // Basic foundation
  const basics = ['strike', 'strike', 'strike', 'shield_wall', 'shield_wall', 'quick_repair', 'panic_button'];
  
  basics.forEach(tid => {
    const template = CARD_TEMPLATES.find(t => t.templateId === tid);
    if (template) {
      deck.push({ ...template, id: Math.random().toString(36).substr(2, 9) });
    }
  });

  // Add 8 random cards from the full pool (increased from 6 for more variety)
  for (let i = 0; i < 8; i++) {
    const randomTemplate = CARD_TEMPLATES[Math.floor(Math.random() * CARD_TEMPLATES.length)];
    deck.push({ ...randomTemplate, id: Math.random().toString(36).substr(2, 9) });
  }

  // Shuffle
  return deck.sort(() => Math.random() - 0.5);
};