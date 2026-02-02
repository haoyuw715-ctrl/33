export type CardType = 'ATTACK' | 'DEFEND' | 'SPECIAL' | 'HEAL';

export interface Card {
  id: string;
  templateId: string;
  name: string;
  description: string;
  cost: number;
  type: CardType;
  value: number; // Damage or Shield amount
  effect?: string; // Special effect identifier
}

export interface PlayerState {
  id: 'player1' | 'player2';
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  hand: Card[];
  deck: Card[];
  discard: Card[];
  isAi: boolean;
}

export interface GameLog {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'ai';
  timestamp: number;
}

export type GamePhase = 'MENU' | 'PLAYER1_TURN' | 'PLAYER2_TURN' | 'GAME_OVER';

export interface GameState {
  phase: GamePhase;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  logs: GameLog[];
  winner: string | null;
  aiThinking: boolean;
  turn: number;
}

export interface AiMoveResponse {
  cardId: string | null; // null if skipping turn
  reasoning: string;
}