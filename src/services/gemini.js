import { FLAVORS } from '../constants/flavors.js';

export class GeminiError extends Error {}

export const DEFAULT_MODEL = 'gemini-2.5-flash';
const API = 'https://generativelanguage.googleapis.com/v1beta';

function buildSystemPrompt(maxPourMs, flavors) {
  const list = flavors.map((f) => `${f.id}: ${f.name} (${(f.tags.length ? f.tags : ['no notes']).join(', ')})`).join('\n');
  return `You are a creative drink sommelier for a 19-flavor syrup dispenser.
Available flavors (id: name (traits)):
${list}

Rules:
- Use ONLY these flavor ids (1-19). Mix 2-5 flavors for a balanced drink.
- Each flavor gets a dispense time in milliseconds between 0 and ${maxPourMs}.
- Unused flavors must have time_ms 0. Include ALL 19 ids in "pumps".
- Syrups all contain sugar; if asked for "zero sugar", pick the lightest/most diluted blend and say so in "description".
- Respond with JSON ONLY, no markdown, in exactly this shape:
{"name": string, "description": string, "pumps": [{"id": number, "time_ms": number}]}`;
}

/** Validates + normalizes the model output. Throws GeminiError if unusable. */
export function parseRecipe(text, maxPourMs) {
  let data;
  try {
    // Tolerate code fences or extra prose around the JSON (some models add them)
    const raw = text.replace(/```json|```/g, '').trim();
    const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    data = JSON.parse(a >= 0 && b > a ? raw.slice(a, b + 1) : raw);
  } catch {
    throw new GeminiError('Gemini returned something that is not valid JSON. Try rephrasing.');
  }
  if (!data || !Array.isArray(data.pumps)) {
    throw new GeminiError('Gemini response is missing the "pumps" array.');
  }
  const times = Object.fromEntries(FLAVORS.map((f) => [f.id, 0]));
  for (const p of data.pumps) {
    const id = Number(p?.id);
    const ms = Number(p?.time_ms);
    if (!Number.isInteger(id) || !(id in times) || !Number.isFinite(ms)) {
      throw new GeminiError(`Gemini returned an invalid pump entry: ${JSON.stringify(p)}`);
    }
    times[id] = Math.max(0, Math.min(maxPourMs, Math.round(ms)));
  }
  if (Object.values(times).every((t) => t === 0)) {
    throw new GeminiError('Gemini returned an empty recipe. Try a more specific request.');
  }
  return {
    name: String(data.name || 'AI Creation').slice(0, 40),
    description: String(data.description || ''),
    times, // { [pumpId]: ms }
  };
}

/** Lists Gemini models that accept text in and give text out (generateContent). */
export async function listGeminiModels(apiKey) {
  if (!apiKey) throw new GeminiError('Add your Gemini API key first.');
  let res;
  try { res = await fetch(`${API}/models?pageSize=200&key=${apiKey}`); }
  catch { throw new GeminiError('Network error. Check your internet connection.'); }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GeminiError(body?.error?.message || `Could not load models (${res.status}).`);
  }
  const json = await res.json();
  const skip = /(tts|image|embedding|live|audio|aqa|imagen|veo|robotics|computer-use|native-audio)/i;
  return (json.models || [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((id) => /^gemini/i.test(id) && !skip.test(id))
    .sort();
}

async function generate({ model, apiKey, body }) {
  try {
    return await fetch(`${API}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiError('Network error. Check your internet connection.');
  }
}

export async function askGemini({ prompt, apiKey, maxPourMs, flavors = FLAVORS, model = DEFAULT_MODEL }) {
  if (!apiKey) throw new GeminiError('Add your Gemini API key in Maintenance → Settings.');
  model = (model || DEFAULT_MODEL).trim().replace(/^models\//, '');
  const system = buildSystemPrompt(maxPourMs, flavors);

  // 1st try: system instruction + native JSON mode (works on most Gemini models)
  let res = await generate({
    model, apiKey,
    body: {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
    },
  });

  // 2nd try: plain text prompt for models without JSON mode / system instructions
  if (res.status === 400) {
    res = await generate({
      model, apiKey,
      body: {
        contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser request: ${prompt}` }] }],
        generationConfig: { temperature: 0.9 },
      },
    });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GeminiError(body?.error?.message || `Gemini request failed (${res.status}).`);
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
  if (!text) throw new GeminiError('Gemini returned an empty response (it may have been blocked).');
  return parseRecipe(text, maxPourMs);
}
