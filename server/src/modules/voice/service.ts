import type { Request } from 'express';

// --- System Prompt Definition ---
// Keep outside class for readability and allow multi-line editing.
const DEFAULT_GMAT_SYSTEM_PROMPT = `You are an expert GMAT tutor and strategy coach.

Language Policy (Critical):
Always respond in clear, natural ENGLISH unless the user explicitly requests another language. If they do, briefly confirm in English first ("Sure, I can give a brief summary in Spanish, but GMAT terminology will remain in English for clarity.") and keep core GMAT technical terms in English. Do NOT spontaneously switch languages or greet in another language without being asked.

Primary Objective:
Provide precise, reliable, and actionable guidance limited strictly to GMAT preparation (Quantitative, Verbal, Integrated Reasoning, Analytical Writing, study planning, test-day strategy, mindset, review methodology, pacing, error analysis).

Strict Domain Constraints:
1. If the user asks about ANY topic outside GMAT prep (e.g., unrelated academic subjects, coding help, politics, medical, legal, personal finance unrelated to GMAT test logistics), respond with a concise refusal and gently redirect back to GMAT prep.
2. Do NOT generate content that is not directly helpful for GMAT performance.
3. If the user requests solutions to copyrighted third-party proprietary question sets, decline and instead offer a generic strategy pattern.
4. No speculation about future exam changes unless publicly confirmed.

Tone & Style:
- Professional, encouraging, efficient.
- Structure longer answers with brief labeled sections or bullet points (e.g., "Framework", "Why It Matters", "Example", "Next Drill") when helpful.
- Avoid fluff, keep focus on practical improvement.

Answer Framework Guidelines:
1. Clarify Ambiguity: If the question is vague, briefly ask a targeted clarifying follow-up BEFORE giving a full solution—unless the intent is already clear.
2. Strategy First: Emphasize underlying reasoning frameworks (e.g., for DS: "Elimination by sufficiency classification", for CR: "Argument core (conclusion + premises) then assumption gap").
3. Pacing Advice: When user reveals timing issues, include a timing checkpoint tip.
4. Review Method: Encourage post-question reflection: classification (Concept / Logic / Careless / Timing) and error log.
5. Encouragement: For struggling users, close with a brief motivational reinforcement tied to consistency and structured review.

Refusal Template (when out-of-scope):
"I’m focused strictly on GMAT preparation topics. Let’s pivot back to something GMAT-related—perhaps a Quant strategy, a Critical Reasoning approach, or pacing optimization. What would you like to work on?"

Examples of In-Scope:
- Data Sufficiency elimination strategy
- Number properties (divisibility, remainders) techniques
- Sentence Correction error type recognition
- Critical Reasoning strengthen vs weaken differentiation
- Timing benchmarks (avg per SC / CR / PS / DS)
- Study schedule structuring (e.g., concept drills → mixed sets → review)
- Test stamina building and review loops

Examples of Out-of-Scope (must refuse):
- Pure math proofs unrelated to GMAT format
- Non-GMAT academic essay writing (except AWA guidance)
- Programming, web development, or algorithm implementation
- Politics, news commentary, personal counseling

If user asks for a direct answer to a proprietary question: provide a structured solving approach without verbatim reproduction or proprietary explanation.

Always stay within these constraints.`;


/**
 * Voice (Realtime) Service – Option A (WebRTC directly with OpenAI Realtime API)
 *
 * Architecture:
 *  Client (browser)  <—(ephemeral key)—  Server  —(API Key)—>  OpenAI Realtime API
 *  Client then establishes a WebRTC session with OpenAI using the ephemeral key
 *  and streams microphone audio; model streams synthesized audio + events back.
 *
 * This module is intentionally framework‑agnostic: only depends on fetch + minimal types.
 */

export interface RealtimeSessionRequestOptions {
  model?: string;         // override default model
  voice?: string;         // override default voice
  modalities?: string[];  // future: ['audio','text'] etc
}

export interface RealtimeSessionResponse {
  client_secret: { value: string; expires_at?: number };
  model: string;
  voice: string;
  ttl?: number;
  tutorName?: string;
  raw: any; // provider raw response for forward compatibility
}

export class VoiceRealtimeService {
  private apiKey: string;
  private defaultModel: string;
  private defaultVoice: string;
  private systemPrompt: string;

  constructor() {
    // Primary (paid, voice-capable) key
    const paidKey = process.env.OPENAI_API_KEY || '';
    // Free / limited key (text only fallback)
    const freeKey = process.env.OPENAI_API_KEY_FREE || '';
    this.apiKey = paidKey || freeKey; // default baseline to something so errors surface clearly later
    this.defaultModel = process.env.VOICE_MODEL || 'gpt-4o-realtime-preview';
    this.defaultVoice = process.env.VOICE_DEFAULT_VOICE || 'alloy';
    this.systemPrompt = process.env.GMAT_EXPERT_SYSTEM_PROMPT || DEFAULT_GMAT_SYSTEM_PROMPT;
    if (!paidKey) {
      console.warn('[voice] Paid OPENAI_API_KEY not set – voice calls will be disabled for subscribed users.');
    }
    if (!freeKey) {
      console.warn('[voice] OPENAI_API_KEY_FREE not set – free tier will not have assistant access.');
    }
  }

  authorize(req: Request) {
    // Basic gating: require subscriptionActive for realtime voice (paid key)
    const user: any = (req as any).user || {};
    return !!user; // generic auth presence check; per-route we add further gating
  }

  async createRealtimeSession(opts: RealtimeSessionRequestOptions = {}, paidKey?: string): Promise<RealtimeSessionResponse> {
    if (!paidKey) throw new Error('Voice service unavailable: paid key missing');
    const model = opts.model || this.defaultModel;
    const voice = opts.voice || this.defaultVoice;
    // Random tutor name injection for personalized introduction
    const tutorNames = (process.env.VOICE_TUTOR_NAMES || 'Alex,Jordan,Sophia,Marcus,Ella,Nathan,Clara,Victor,Selene,Raj').split(',').map(s => s.trim()).filter(Boolean);
    const tutorName = tutorNames[Math.floor(Math.random() * tutorNames.length)];
  // Keep realtime system prompt identical to text assistant base prompt for consistency.
  // Intro / personalization handled via a separate response.create event client-side.
  const body: any = { model, voice, instructions: this.systemPrompt };
    if (opts.modalities) body.modalities = opts.modalities;

    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paidKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1'
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Failed to create realtime session (${resp.status}): ${text}`);
    }
    const json: any = await resp.json();
    return {
      client_secret: json.client_secret,
      model,
      voice,
      ttl: json.ttl,
      tutorName,
      raw: json
    };
  }

  /**
   * Generate a text-only response (no audio) using regular chat completions style API.
   * Keeps same strict GMAT system prompt.
   */
  async generateTextResponse(userMessage: string, opts: { model?: string; free?: boolean } = {}): Promise<string> {
    const paidKey = process.env.OPENAI_API_KEY || '';
    const freeKey = process.env.OPENAI_API_KEY_FREE || '';
    const useFree = opts.free && freeKey;
    const keyToUse = useFree ? freeKey : (paidKey || freeKey);
    if (!keyToUse) throw new Error('Text assistant unavailable: no API key configured');
    const model = opts.model || process.env.TEXT_MODEL || 'gpt-4o-mini';
    const body = {
      model,
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 800
    };
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (resp.ok) {
      const json: any = await resp.json();
      const reply = json.choices?.[0]?.message?.content || '';
      return reply.trim();
    }
    // If unauthorized, fallback to responses API (may have different scope requirements)
    if (resp.status === 401) {
      const alt = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyToUse}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_output_tokens: 800
        })
      });
      if (alt.ok) {
        const j: any = await alt.json();
        // responses API shape may differ; attempt to extract text
        let textOut = '';
        if (Array.isArray(j.output)) {
          textOut = j.output.map((o: any) => o.content?.map((c: any) => c.text || '').join('')).join('');
        } else {
          textOut = j.output_text || '';
        }
        return (textOut || '').trim();
      } else {
        const altText = await alt.text();
        throw new Error(`Text fallback failed (${alt.status}): ${altText.slice(0,300)}`);
      }
    }
    const text = await resp.text();
    throw new Error(`Text response failed (${resp.status}): ${text.slice(0,300)}`);
  }
}

// Export an instance (common singleton usage) and default for flexibility
export const voiceRealtimeService = new VoiceRealtimeService();
export default voiceRealtimeService;
