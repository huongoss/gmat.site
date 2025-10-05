import type { Request } from 'express';

// --- System Prompt Definition ---
// Keep outside class for readability and allow multi-line editing.
const DEFAULT_GMAT_SYSTEM_PROMPT = `You are an expert GMAT tutor and strategy coach.

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
  raw: any; // provider raw response for forward compatibility
}

export class VoiceRealtimeService {
  private apiKey: string;
  private defaultModel: string;
  private defaultVoice: string;
  private systemPrompt: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.defaultModel = process.env.VOICE_MODEL || 'gpt-4o-realtime-preview';
    this.defaultVoice = process.env.VOICE_DEFAULT_VOICE || 'alloy';
    this.systemPrompt = process.env.GMAT_EXPERT_SYSTEM_PROMPT || DEFAULT_GMAT_SYSTEM_PROMPT;
    if (!this.apiKey) {
      console.warn('[voice] OPENAI_API_KEY not set – /voice/session will fail until provided');
    }
  }

  authorize(_req: Request) {
    // Placeholder: add subscription / feature gate logic here.
    return true;
  }

  async createRealtimeSession(opts: RealtimeSessionRequestOptions = {}): Promise<RealtimeSessionResponse> {
    if (!this.apiKey) throw new Error('Voice service unavailable: missing OPENAI_API_KEY');
    const model = opts.model || this.defaultModel;
    const voice = opts.voice || this.defaultVoice;
  const body: any = { model, voice, instructions: this.systemPrompt };
    if (opts.modalities) body.modalities = opts.modalities;

    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
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
      raw: json
    };
  }
}

// Export an instance (common singleton usage) and default for flexibility
export const voiceRealtimeService = new VoiceRealtimeService();
export default voiceRealtimeService;
