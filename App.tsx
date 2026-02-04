import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PlayerState, Card, GamePhase } from './types';
import { generateDeck, INITIAL_HP, INITIAL_ENERGY, MAX_HAND_SIZE, ENERGY_REGEN, INITIAL_HAND_SIZE, CARDS_PER_TURN } from './constants';
import { CardComponent } from './components/CardComponent';
import { PlayerHUD } from './components/PlayerHUD';
import { getAiAction, getMatchCommentary } from './services/ai';
import { Play, Users, Bot, RefreshCw, Trophy, Skull, Zap, Key, X } from 'lucide-react';

// Initial state factory
const createInitialState = (vsAi: boolean, player1Name?: string, player2Name?: string): GameState => {
  const p1Deck = generateDeck();
  const p2Deck = generateDeck();
  
  // Draw initial hands
  const p1Hand = p1Deck.splice(0, INITIAL_HAND_SIZE);
  const p2Hand = p2Deck.splice(0, INITIAL_HAND_SIZE);

  return {
    phase: 'MENU',
    winner: null,
    aiThinking: false,
    turn: 1,
    players: {
      player1: {
        id: 'player1',
        name: player1Name?.trim() || 'Player 1',
        hp: INITIAL_HP,
        maxHp: INITIAL_HP,
        energy: INITIAL_ENERGY,
        maxEnergy: 5,
        shield: 0,
        hand: p1Hand,
        deck: p1Deck,
        discard: [],
        isAi: false
      },
      player2: {
        id: 'player2',
        name: player2Name?.trim() || (vsAi ? 'Gemini AI' : 'Player 2'),
        hp: INITIAL_HP,
        maxHp: INITIAL_HP,
        energy: INITIAL_ENERGY,
        maxEnergy: 5,
        shield: 0,
        hand: p2Hand,
        deck: p2Deck,
        discard: [],
        isAi: vsAi
      }
    },
    logs: []
  };
};

// Helper for deep cloning player state arrays to ensure immutability
const clonePlayer = (p: PlayerState): PlayerState => ({
  ...p,
  hand: [...p.hand],
  deck: [...p.deck],
  discard: [...p.discard]
});

export default function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState(true));
  
  // API Key State
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupModeIsAi, setSetupModeIsAi] = useState(true);
  const [setupPlayer1Name, setSetupPlayer1Name] = useState(localStorage.getItem('neon_duel_last_p1') || 'Player 1');
  const [setupPlayer2Name, setSetupPlayer2Name] = useState(localStorage.getItem('neon_duel_last_p2_ai') || 'Gemini AI');
  const [setupKeyInput, setSetupKeyInput] = useState('');
  const [tempKey, setTempKey] = useState('');
  const [stats, setStats] = useState(() => {
    const stored = localStorage.getItem('neon_duel_stats');
    if (!stored) {
      return { totalMatches: 0, totalWins: 0, aiWins: 0, pvpWins: 0, bestWinStreak: 0, currentWinStreak: 0 };
    }
    try {
      return JSON.parse(stored);
    } catch {
      return { totalMatches: 0, totalWins: 0, aiWins: 0, pvpWins: 0, bestWinStreak: 0, currentWinStreak: 0 };
    }
  });
  const [leaderboard, setLeaderboard] = useState(() => {
    const stored = localStorage.getItem('neon_duel_leaderboard');
    if (!stored) {
      return [] as { name: string; matches: number; wins: number; lastPlayed: number }[];
    }
    try {
      return JSON.parse(stored) as { name: string; matches: number; wins: number; lastPlayed: number }[];
    } catch {
      return [] as { name: string; matches: number; wins: number; lastPlayed: number }[];
    }
  });

  // Used to prevent strict mode double-firing effects
  const processingAiRef = useRef(false); 
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameState.logs]);

  const addLog = useCallback((message: string, type: 'info' | 'combat' | 'ai' = 'info') => {
    setGameState(prev => ({
      ...prev,
      logs: [...prev.logs, { id: Date.now().toString() + Math.random(), message, type, timestamp: Date.now() }]
    }));
  }, []);

  const triggerAiCommentary = useCallback(async (action: string, state: GameState) => {
    if (!apiKey) return;
    const comment = await getMatchCommentary(action, state, apiKey);
    addLog(comment, 'ai');
  }, [addLog, apiKey]);

  const checkGameOver = useCallback((state: GameState): string | null => {
    if (state.players.player1.hp <= 0) return 'player2';
    if (state.players.player2.hp <= 0) return 'player1';
    return null;
  }, []);

  const recordMatchResult = useCallback((winnerId: 'player1' | 'player2' | null, players: GameState['players'], vsAi: boolean) => {
    setStats((prevStats: { totalMatches: number; totalWins: number; aiWins: number; pvpWins: number; bestWinStreak: number; currentWinStreak: number }) => {
      const didWin = winnerId === 'player1';
      const next = {
        totalMatches: prevStats.totalMatches + 1,
        totalWins: prevStats.totalWins + (didWin ? 1 : 0),
        aiWins: prevStats.aiWins + (didWin && vsAi ? 1 : 0),
        pvpWins: prevStats.pvpWins + (didWin && !vsAi ? 1 : 0),
        currentWinStreak: didWin ? prevStats.currentWinStreak + 1 : 0,
        bestWinStreak: prevStats.bestWinStreak,
      };
      next.bestWinStreak = Math.max(next.bestWinStreak, next.currentWinStreak);
      localStorage.setItem('neon_duel_stats', JSON.stringify(next));
      return next;
    });
    setLeaderboard((prev) => {
      const next = [...prev];
      const resolveName = (name: string, fallbackKey: string) => {
        const trimmed = name.trim();
        if (!trimmed) return '';
        const stored = localStorage.getItem(fallbackKey) || '';
        if ((trimmed === 'Player 1' || trimmed === 'Player 2' || trimmed === 'Gemini AI') && stored.trim()) {
          return stored.trim();
        }
        return trimmed;
      };
      const updateEntry = (name: string, didWin: boolean, fallbackKey: string) => {
        const trimmed = resolveName(name, fallbackKey);
        if (!trimmed) return;
        const existingIndex = next.findIndex((entry) => entry.name.toLowerCase() === trimmed.toLowerCase());
        if (existingIndex >= 0) {
          const entry = next[existingIndex];
          next[existingIndex] = {
            ...entry,
            matches: entry.matches + 1,
            wins: entry.wins + (didWin ? 1 : 0),
            lastPlayed: Date.now(),
          };
        } else {
          next.push({ name: trimmed, matches: 1, wins: didWin ? 1 : 0, lastPlayed: Date.now() });
        }
      };
      updateEntry(players.player1.name, winnerId === 'player1', 'neon_duel_last_p1');
      const p2Key = players.player2.isAi ? 'neon_duel_last_p2_ai' : 'neon_duel_last_p2_pvp';
      updateEntry(players.player2.name, winnerId === 'player2', p2Key);
      localStorage.setItem('neon_duel_leaderboard', JSON.stringify(next));
      return next;
    });
  }, []);

  const playCard = useCallback((playerId: 'player1' | 'player2', card: Card) => {
    setGameState(prev => {
      const player = prev.players[playerId];
      const opponentId = playerId === 'player1' ? 'player2' : 'player1';
      const opponent = prev.players[opponentId];
      
      // Validation (double check)
      if (player.energy < card.cost) return prev;

      // Clone objects for mutation
      const newPlayer = clonePlayer(player);
      const newOpponent = clonePlayer(opponent);

      // Cost
      newPlayer.energy -= card.cost;
      newPlayer.hand = newPlayer.hand.filter(c => c.id !== card.id);
      newPlayer.discard.push(card);

      // Parse Effects (support multiple space-separated effects)
      const effects = card.effect ? card.effect.split(' ') : [];
      
      let damageDealt = 0;
      let logMsg = `${newPlayer.name} used ${card.name}.`;

      if (card.type === 'ATTACK') {
        let dmg = card.value;
        if (effects.includes('pierce')) {
           // Direct to HP
           newOpponent.hp -= dmg;
           damageDealt = dmg;
           logMsg += ` Pierced for ${dmg} DMG!`;
        } else {
           // Shield mechanics
           if (newOpponent.shield > 0) {
             const overflow = Math.max(0, dmg - newOpponent.shield);
             newOpponent.shield = Math.max(0, newOpponent.shield - dmg);
             dmg = overflow;
           }
           if (dmg > 0) {
             newOpponent.hp -= dmg;
             damageDealt = dmg;
             logMsg += ` Hit for ${damageDealt} DMG.`;
           } else {
             logMsg += ` Blocked!`;
           }
        }
        
        // Drain Effect
        if (effects.includes('drain') && damageDealt > 0) {
           newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + damageDealt);
           logMsg += ` Drained ${damageDealt} HP!`;
        }

      } else if (card.type === 'DEFEND') {
        newPlayer.shield += card.value;
        logMsg += ` Gained ${card.value} Shield.`;
        
        // Thorns Effect (Damage on Defend)
        const thornsEffect = effects.find(e => e.startsWith('thorns_'));
        if (thornsEffect) {
            const thornsDmg = parseInt(thornsEffect.split('_')[1], 10);
            newOpponent.hp -= thornsDmg;
            logMsg += ` Spikes dealt ${thornsDmg} DMG!`;
        }

      } else if (card.type === 'HEAL') {
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + card.value);
        logMsg += ` Healed ${card.value} HP.`;
      }

      // -- Global/Generic Effects --

      effects.forEach(eff => {
          // Recoil
          if (eff.startsWith('recoil_')) {
              const recoil = parseInt(eff.split('_')[1], 10);
              newPlayer.hp -= recoil;
              logMsg += ` Took ${recoil} recoil damage.`;
          }

          // Draw Cards
          if (eff.startsWith('draw_')) {
              const count = parseInt(eff.split('_')[1], 10);
              let drawnCount = 0;
              for(let i = 0; i < count; i++) {
                  if (newPlayer.hand.length < MAX_HAND_SIZE) {
                      // Reshuffle if needed
                      if (newPlayer.deck.length === 0 && newPlayer.discard.length > 0) {
                          newPlayer.deck = newPlayer.discard.sort(() => Math.random() - 0.5);
                          newPlayer.discard = [];
                      }
                      
                      if (newPlayer.deck.length > 0) {
                          const drawn = newPlayer.deck.shift();
                          if (drawn) {
                              newPlayer.hand.push(drawn);
                              drawnCount++;
                          }
                      }
                  }
              }
              if (drawnCount > 0) logMsg += ` Drew ${drawnCount} card(s).`;
          }

          // Energy Gain
          if (eff.startsWith('energy_')) {
              const energyGain = parseInt(eff.split('_')[1], 10);
              newPlayer.energy = Math.min(newPlayer.maxEnergy, newPlayer.energy + energyGain);
              logMsg += ` Gained ${energyGain} Energy.`;
          }
      });

      const nextState = {
        ...prev,
        players: {
          ...prev.players,
          [playerId]: newPlayer,
          [opponentId]: newOpponent
        },
        logs: [...prev.logs, { id: Date.now().toString(), message: logMsg, type: 'combat', timestamp: Date.now() }]
      };

      // Check win condition immediately
      const winner = checkGameOver(nextState);
      if (winner) {
        nextState.winner = winner;
        nextState.phase = 'GAME_OVER';
        nextState.logs.push({ id: 'win', message: `${winner === 'player1' ? nextState.players.player1.name : nextState.players.player2.name} WINS!`, type: 'info', timestamp: Date.now() });
        recordMatchResult(winner as 'player1' | 'player2', nextState.players, nextState.players.player2.isAi);
      } else {
         // Trigger AI commentary occasionally
         if (Math.random() > 0.5) {
             triggerAiCommentary(logMsg, nextState);
         }
      }

      return nextState;
    });
  }, [checkGameOver, triggerAiCommentary, recordMatchResult]);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      if (prev.phase === 'GAME_OVER') return prev;
      const isP1Turn = prev.phase === 'PLAYER1_TURN';
      const currentPlayerId = isP1Turn ? 'player1' : 'player2';
      const nextPlayerId = isP1Turn ? 'player2' : 'player1';
      const nextPhase = isP1Turn ? 'PLAYER2_TURN' : 'PLAYER1_TURN';
      const currentTurn = prev.turn || 1; // Safety fallback

      const nextPlayer = clonePlayer(prev.players[nextPlayerId]);
      const currentPlayer = clonePlayer(prev.players[currentPlayerId]);
      let newLogs = [...prev.logs];

      // Start of turn effects for Next Player
      nextPlayer.energy = Math.min(nextPlayer.maxEnergy, nextPlayer.energy + ENERGY_REGEN);
      
      // Draw cards per turn (Skip draw on the very first turn transition to P2 so they stay at 3 cards)
      if (currentTurn > 1) {
          for (let i = 0; i < CARDS_PER_TURN; i++) {
              if (nextPlayer.hand.length >= MAX_HAND_SIZE) break;

              if (nextPlayer.deck.length === 0) {
                if (nextPlayer.discard.length > 0) {
                   nextPlayer.deck = nextPlayer.discard.sort(() => Math.random() - 0.5);
                   nextPlayer.discard = [];
                   newLogs.push({ id: Date.now().toString() + Math.random(), message: `${nextPlayer.name} reshuffles deck.`, type: 'info', timestamp: Date.now() });
                } else {
                   break;
                }
              }
              
              if (nextPlayer.deck.length > 0) {
                const card = nextPlayer.deck.shift();
                if (card) nextPlayer.hand.push(card);
              }
          }
      }

      return {
        ...prev,
        phase: nextPhase,
        turn: currentTurn + 1,
        players: {
          ...prev.players,
          [currentPlayerId]: currentPlayer,
          [nextPlayerId]: nextPlayer
        },
        logs: newLogs
      };
    });
  }, []);

  // AI Turn Logic
  useEffect(() => {
    if (gameState.phase === 'PLAYER2_TURN' && gameState.players.player2.isAi && !gameState.winner && !processingAiRef.current) {
        processingAiRef.current = true;
        
        const performAiTurn = async () => {
            setGameState(prev => ({ ...prev, aiThinking: true }));
            
            // Artificial delay for pacing
            await new Promise(r => setTimeout(r, 1000));

            // 1. Decide Move
            const move = await getAiAction(gameState, apiKey);
            
            if (move.cardId) {
                const cardToPlay = gameState.players.player2.hand.find(c => c.id === move.cardId);
                if (cardToPlay) {
                    addLog(`AI: "${move.reasoning}"`, 'ai');
                    playCard('player2', cardToPlay);
                }
            } else {
                addLog(`AI: "${move.reasoning}"`, 'ai');
            }
            
            await new Promise(r => setTimeout(r, 1000));
            setGameState(prev => ({ ...prev, aiThinking: false }));
            if (gameState.phase !== 'GAME_OVER' && !gameState.winner) {
              endTurn();
            }
            processingAiRef.current = false;
        };

        performAiTurn();
    }
  }, [gameState.phase, gameState.players.player2.isAi, gameState.winner, playCard, endTurn, gameState, addLog, apiKey]);


  // --- UI Handlers ---

  const handleStartGameClick = (vsAi: boolean) => {
    setSetupModeIsAi(vsAi);
    const lastP1 = localStorage.getItem('neon_duel_last_p1') || gameState.players.player1.name || 'Player 1';
    const lastP2Ai = localStorage.getItem('neon_duel_last_p2_ai') || 'Gemini AI';
    const lastP2Pvp = localStorage.getItem('neon_duel_last_p2_pvp') || gameState.players.player2.name || 'Player 2';
    setSetupPlayer1Name(lastP1);
    setSetupPlayer2Name(vsAi ? lastP2Ai : lastP2Pvp);
    setSetupKeyInput('');
    setShowSetupModal(true);
  };

  const initializeGame = (vsAi: boolean, player1Name?: string, player2Name?: string) => {
    const newState = createInitialState(vsAi, player1Name, player2Name);
    newState.phase = 'PLAYER1_TURN';
    setGameState(newState);
  };

  const exitToMenu = useCallback(() => {
    setGameState(createInitialState(gameState.players.player2.isAi, gameState.players.player1.name, gameState.players.player2.name));
  }, [gameState.players.player2.isAi, gameState.players.player1.name, gameState.players.player2.name]);

  const handleSetupStart = () => {
    const p1Name = setupPlayer1Name.trim() || 'Player 1';
    const p2Name = setupPlayer2Name.trim() || (setupModeIsAi ? 'Gemini AI' : 'Player 2');
    localStorage.setItem('neon_duel_last_p1', p1Name);
    if (setupModeIsAi) {
      localStorage.setItem('neon_duel_last_p2_ai', p2Name);
    } else {
      localStorage.setItem('neon_duel_last_p2_pvp', p2Name);
    }
    if (setupKeyInput.trim().length > 0) {
      const key = setupKeyInput.trim();
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
    }
    setShowSetupModal(false);
    initializeGame(setupModeIsAi, p1Name, p2Name);
  };

  const handleSaveKey = () => {
    if (tempKey.trim().length > 0) {
      const key = tempKey.trim();
      setApiKey(key);
      localStorage.setItem('gemini_api_key', key);
      setShowKeyModal(false);
    }
  };

  const handleCardClick = (card: Card) => {
    if (gameState.phase === 'PLAYER1_TURN') {
        playCard('player1', card);
    } else if (gameState.phase === 'PLAYER2_TURN' && !gameState.players.player2.isAi) {
        playCard('player2', card);
    }
  };

  // --- Render Helpers ---

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.matches !== a.matches) return b.matches - a.matches;
    return b.lastPlayed - a.lastPlayed;
  });

  const renderCardList = (player: PlayerState, isCurrentTurn: boolean) => {
    return (
      <div className={`flex gap-2 justify-center flex-wrap min-h-[200px] transition-opacity duration-300 ${isCurrentTurn ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        {player.hand.map(card => (
            <CardComponent 
                key={card.id} 
                card={card} 
                disabled={!isCurrentTurn || card.cost > player.energy || gameState.aiThinking}
                playable={isCurrentTurn && card.cost <= player.energy && !gameState.aiThinking}
                onClick={() => handleCardClick(card)}
            />
        ))}
        {player.hand.length === 0 && (
            <div className="flex items-center justify-center w-full h-full text-slate-500 italic">
                No cards in hand
            </div>
        )}
      </div>
    );
  };


  // --- Main Render ---

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-display font-bold text-cyan-400 flex items-center gap-2">
                <Play size={20} /> Match Setup
              </h3>
              <button onClick={() => setShowSetupModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest">Player 1 Name</label>
                <input
                  value={setupPlayer1Name}
                  onChange={(e) => setSetupPlayer1Name(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none mt-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest">Opponent Name</label>
                <input
                  value={setupPlayer2Name}
                  onChange={(e) => setSetupPlayer2Name(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none mt-2"
                />
                {setupModeIsAi && (
                  <p className="text-xs text-slate-500 mt-2">CPU will play as this opponent (Gemini optional).</p>
                )}
              </div>

              {setupModeIsAi && !apiKey && (
                <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/60">
                  <div className="text-sm text-slate-300 mb-2">Optional: add a Gemini key for smarter AI.</div>
                  <input
                    type="password"
                    value={setupKeyInput}
                    onChange={(e) => setSetupKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none font-mono text-sm"
                  />
                </div>
              )}
              {setupModeIsAi && apiKey && (
                <div className="text-xs text-slate-500">Gemini key detected. You can update it later from the menu.</div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetupStart}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all"
              >
                Start Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-display font-bold text-cyan-400 flex items-center gap-2">
                <Key size={20} /> Optional Gemini API Key
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
              <p className="text-sm text-slate-300 mb-4">
                AI works without a key using local CPU logic. Add a Gemini key for smarter moves and commentary. Your key is stored locally in your browser.
              </p>
            <input 
              type="password" 
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none mb-4 font-mono text-sm"
            />
            <div className="flex justify-end gap-3">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:underline mr-auto flex items-center"
              >
                Get a Key
              </a>
              <button 
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveKey}
                disabled={!tempKey}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Screen */}
      {gameState.phase === 'MENU' ? (
          <div className="h-full flex flex-col items-center justify-center bg-[#0f172a] bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2076&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
              
              <div className="relative z-10 text-center space-y-8 p-12 rounded-3xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl shadow-cyan-500/20 max-w-2xl w-full">
                  <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                      NEON DUEL
                  </h1>
                  <p className="text-slate-300 text-lg tracking-wide font-light">
                      Tactical Cyber-Warfare Simulator
                  </p>
                  
                  <div className="flex flex-col gap-4 max-w-md mx-auto">
                      <button 
                        onClick={() => handleStartGameClick(true)}
                        className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3 overflow-hidden"
                      >
                          <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 skew-x-12"></div>
                          <Bot size={24} /> 
                          <span>VS AI PROTOCOL</span>
                      </button>
                      
                      <button 
                        onClick={() => handleStartGameClick(false)}
                        className="group relative px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-3 overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 skew-x-12"></div>
                          <Users size={24} />
                          <span>LOCAL PVP (HOTSEAT)</span>
                      </button>

                      <button 
                         onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
                         className="text-xs text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-1 mt-4 transition-colors"
                      >
                        <Key size={12} /> {apiKey ? 'Update API Key' : 'Set API Key'}
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 font-mono">
                      <div className="glass-panel rounded-lg p-3 border border-slate-700/60">
                          <div className="text-slate-500">Matches</div>
                          <div className="text-lg text-white font-bold">{stats.totalMatches}</div>
                      </div>
                      <div className="glass-panel rounded-lg p-3 border border-slate-700/60">
                          <div className="text-slate-500">Wins</div>
                          <div className="text-lg text-white font-bold">{stats.totalWins}</div>
                      </div>
                      <div className="glass-panel rounded-lg p-3 border border-slate-700/60">
                          <div className="text-slate-500">AI Wins</div>
                          <div className="text-lg text-white font-bold">{stats.aiWins}</div>
                      </div>
                      <div className="glass-panel rounded-lg p-3 border border-slate-700/60">
                          <div className="text-slate-500">Best Streak</div>
                          <div className="text-lg text-white font-bold">{stats.bestWinStreak}</div>
                      </div>
                  </div>

                  <div className="glass-panel rounded-2xl border border-slate-700/60 p-4 text-left">
                      <div className="text-xs text-slate-400 font-display tracking-widest mb-3">LEADERBOARD</div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {sortedLeaderboard.length === 0 && (
                          <div className="text-xs text-slate-500 italic">No matches recorded yet.</div>
                        )}
                        {sortedLeaderboard.map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between text-xs bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                            <div className="text-slate-200 font-semibold truncate max-w-[140px]">{entry.name}</div>
                            <div className="flex items-center gap-3 text-slate-400">
                              <span>W {entry.wins}</span>
                              <span>M {entry.matches}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-6">
                      Powered by Google Gemini 3.0 Flash • React 18 • Tailwind
                  </div>
              </div>
          </div>
      ) : (
        // Game Board
        <> 
            {/* Top Bar */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between px-6 backdrop-blur-md z-20 flex-shrink-0">
                <div className="flex items-center gap-2 text-cyan-400 font-display font-bold text-xl">
                    <Zap className="fill-cyan-400" /> NEON DUEL
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400 font-mono">
                        TURN: <span className="text-white font-bold">{gameState.phase === 'PLAYER1_TURN' ? gameState.players.player1.name : gameState.players.player2.name}</span>
                    </div>
                    <button onClick={() => initializeGame(gameState.players.player2.isAi, gameState.players.player1.name, gameState.players.player2.name)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white" title="Restart match">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={exitToMenu} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition-colors" title="Exit to menu">
                        Exit
                    </button>
                </div>
            </header>

            <main className="flex-1 flex relative min-h-0 overflow-hidden">
                
                {/* Left Side: Game Feed / Logs */}
                <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden lg:flex z-10 h-full min-h-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 font-display text-sm tracking-wider text-slate-400">BATTLE LOG</div>
                    <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                        {gameState.logs.map(log => (
                            <div key={log.id} className={`text-sm p-2 rounded border-l-2 ${
                                log.type === 'ai' ? 'border-purple-500 bg-purple-900/10 text-purple-200 italic' :
                                log.type === 'combat' ? 'border-red-500 bg-slate-800/50' :
                                'border-slate-500 text-slate-400'
                            }`}>
                                {log.type === 'ai' && <Bot size={12} className="inline mr-1" />}
                                {log.message}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center: Arena */}
                <div className="flex-grow flex flex-col relative overflow-hidden min-h-0">
                    
                    {/* Game Over Overlay */}
                    {gameState.phase === 'GAME_OVER' && (
                        <div className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                            <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
                            <h2 className="text-5xl font-display font-bold text-white mb-2">VICTORY</h2>
                            <p className="text-2xl text-cyan-400 mb-8">
                                {gameState.winner === 'player1' ? gameState.players.player1.name : gameState.players.player2.name} wins!
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => initializeGame(gameState.players.player2.isAi, gameState.players.player1.name, gameState.players.player2.name)}
                                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/25 transition-all"
                                >
                                    Play Again
                                </button>
                                <button 
                                    onClick={exitToMenu}
                                    className="px-6 py-3 border border-slate-700 text-slate-200 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Exit to Menu
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Player 2 Area (Top - Opponent) */}
                    <div className={`flex-1 flex flex-col p-6 transition-colors duration-500 ${gameState.phase === 'PLAYER2_TURN' ? 'bg-slate-900/60' : ''} overflow-hidden`}>
                        <div className="flex justify-between items-start mb-4">
                            
                            {/* P2 End Turn Button (Only if NOT AI) */}
                            {!gameState.players.player2.isAi && (
                                    <div className="mr-4 mt-2">
                                        <button
                                            disabled={gameState.phase !== 'PLAYER2_TURN'}
                                            onClick={endTurn}
                                            className={`
                                                w-24 h-24 rounded-full border-4 font-bold text-sm tracking-wider shadow-lg transition-all
                                                ${gameState.phase === 'PLAYER2_TURN' 
                                                    ? 'border-purple-500 bg-purple-900/20 text-purple-100 hover:bg-purple-500 hover:text-white hover:scale-105 hover:shadow-purple-500/50 cursor-pointer' 
                                                    : 'border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed'}
                                            `}
                                        >
                                            END<br/>TURN
                                        </button>
                                    </div>
                            )}

                            {/* P2 Hand (visible if local pvp, hidden if AI) */}
                            <div className="flex-grow flex justify-center">
                                {gameState.players.player2.isAi ? (
                                    // AI Hand Backs
                                    <div className="flex gap-2">
                                        {gameState.players.player2.hand.map((_, i) => (
                                            <div key={i} className="w-20 h-32 bg-slate-800 rounded-lg border border-slate-700 mx-1 shadow-lg bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                        ))}
                                    </div>
                                ) : (
                                    renderCardList(gameState.players.player2, gameState.phase === 'PLAYER2_TURN')
                                )}
                            </div>
                            <PlayerHUD player={gameState.players.player2} isActive={gameState.phase === 'PLAYER2_TURN'} isRightSide={true} />
                        </div>
                        
                        {/* P2 Action Status */}
                        <div className="h-12 flex items-center justify-center text-purple-400 font-bold tracking-widest animate-pulse">
                            {gameState.aiThinking && "OPPONENT ANALYZING..."}
                            {gameState.phase === 'PLAYER2_TURN' && !gameState.aiThinking && !gameState.players.player2.isAi && "OPPONENT'S TURN"}
                        </div>
                    </div>

                    {/* Divider / Turn Indicator */}
                    <div className="h-2 bg-slate-800 relative flex items-center justify-center">
                        <div className={`px-4 py-1 rounded-full text-xs font-bold border ${gameState.phase === 'PLAYER1_TURN' ? 'bg-cyan-900 border-cyan-500 text-cyan-300' : 'bg-purple-900 border-purple-500 text-purple-300'}`}>
                            ROUND {Math.ceil(gameState.turn / 2)}
                        </div>
                    </div>

                    {/* Player 1 Area (Bottom - You) */}
                    <div className={`flex-1 flex flex-col-reverse p-6 transition-colors duration-500 ${gameState.phase === 'PLAYER1_TURN' ? 'bg-slate-900/60' : ''} overflow-hidden`}>
                        <div className="flex justify-between items-end mt-4">
                            <PlayerHUD player={gameState.players.player1} isActive={gameState.phase === 'PLAYER1_TURN'} />
                            <div className="flex-grow">
                                {renderCardList(gameState.players.player1, gameState.phase === 'PLAYER1_TURN')}
                            </div>
                            
                            {/* P1 End Turn Button */}
                            <div className="ml-4">
                                <button
                                    disabled={gameState.phase !== 'PLAYER1_TURN'}
                                    onClick={endTurn}
                                    className={`
                                        w-24 h-24 rounded-full border-4 font-bold text-sm tracking-wider shadow-lg transition-all
                                        ${gameState.phase === 'PLAYER1_TURN' 
                                            ? 'border-red-500 bg-red-900/20 text-red-100 hover:bg-red-500 hover:text-white hover:scale-105 hover:shadow-red-500/50 cursor-pointer' 
                                            : 'border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed'}
                                    `}
                                >
                                    END<br/>TURN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
      )}
    </div>
  );
}
