import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Card, AiMoveResponse } from "../types";

export const getAiAction = async (gameState: GameState, apiKey: string): Promise<AiMoveResponse> => {
  if (!apiKey) {
    console.warn("No API Key provided for AI.");
    // Fallback dumb AI logic
    const hand = gameState.players.player2.hand;
    const affordable = hand.filter(c => c.cost <= gameState.players.player2.energy);
    if (affordable.length > 0) {
      return { cardId: affordable[0].id, reasoning: "Fallback random move (No Key)." };
    }
    return { cardId: null, reasoning: "No valid moves (No Key)." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const p2 = gameState.players.player2;
    const p1 = gameState.players.player1;

    const context = {
      self: {
        hp: p2.hp,
        shield: p2.shield,
        energy: p2.energy,
        hand: p2.hand.map(c => ({ id: c.id, name: c.name, cost: c.cost, val: c.value, type: c.type, desc: c.description }))
      },
      opponent: {
        hp: p1.hp,
        shield: p1.shield,
        energy: p1.energy // approximate knowledge
      }
    };

    const prompt = `
      You are playing a card game. You are Player 2.
      Objective: Defeat the opponent (reduce HP to 0) while surviving.
      
      Current State:
      ${JSON.stringify(context, null, 2)}
      
      Select the best card to play from your hand.
      If you have no cards you can afford, or it is strategically better to save energy, return null for cardId.
      Provide a very short, ruthless reasoning for your move (max 10 words).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cardId: { type: Type.STRING, nullable: true },
            reasoning: { type: Type.STRING }
          },
          required: ["reasoning"]
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("Empty AI response");

    // Clean markdown code blocks if present
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    return JSON.parse(text) as AiMoveResponse;

  } catch (error) {
    console.error("AI Error:", error);
    return { cardId: null, reasoning: "System Malfunction. Skipping turn." };
  }
};

export const getMatchCommentary = async (lastAction: string, gameState: GameState, apiKey: string): Promise<string> => {
    if (!apiKey) return "Battle continues...";
    
    try {
        const ai = new GoogleGenAI({ apiKey });
        const p1 = gameState.players.player1;
        const p2 = gameState.players.player2;
        
        const prompt = `
        You are a hype sci-fi arena announcer.
        Action just happened: "${lastAction}".
        State: P1(${p1.hp}HP) vs P2(${p2.hp}HP).
        Generate a very short, 1-sentence intense commentary.
        Example: "The plasma burns through the shield!"
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                maxOutputTokens: 50,
            }
        });
        
        return response.text || "Critical Hit!";
    } catch (e) {
        return "Systems engage!";
    }
}