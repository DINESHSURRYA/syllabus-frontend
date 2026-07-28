/**
 * Timeline Service — AI-powered topic time allocation
 * 
 * Uses OpenAI (or NVIDIA NIM compatible) API to allocate exact teaching hours
 * per topic within a unit, weighted by conceptual complexity & subtopic depth.
 * 
 * Priority:
 *   1. NEXT_PUBLIC_OPENAI_API_KEY  → Direct OpenAI call
 *   2. NEXT_PUBLIC_NVIDIA_API_KEY  → NVIDIA NIM endpoint (OpenAI-compatible)
 *   3. Backend proxy at /api/timeline/generate-topics
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
const NVIDIA_API_KEY = process.env.NEXT_PUBLIC_NVIDIA_API_KEY || '';

// NVIDIA NIM base URL (OpenAI-compatible)
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export interface TopicAllocationInput {
  id: string;
  title: string;
  description?: string;
  subtopics: Array<{ title: string }>;
  difficulty?: string;
  importance?: string;
}

export interface TopicAllocationResult {
  /** topic id → allocated hours (decimal, e.g. 2.25 = 2 hrs 15 min) */
  allocations: Record<string, number>;
  /** total hours as confirmed by LLM */
  totalAllocated: number;
  /** human-readable rationale from LLM */
  rationale: string;
}

/**
 * Format decimal hours as "X hrs Y mins" display string.
 */
export function formatHours(decimalHours: number): string {
  if (!decimalHours || decimalHours <= 0) return '—';
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs} hr${hrs !== 1 ? 's' : ''}`;
  return `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
}

/**
 * Build the LLM prompt for topic-time allocation.
 */
function buildAllocationPrompt(
  unitTitle: string,
  totalHours: number,
  topics: TopicAllocationInput[]
): string {
  const topicList = topics
    .map((t, i) => {
      const subList =
        t.subtopics.length > 0
          ? t.subtopics.map((s) => `      - ${s.title}`).join('\n')
          : '      (no subtopics)';
      return (
        `  Topic ${i + 1}: "${t.title}"\n` +
        `    Description: ${t.description || 'N/A'}\n` +
        `    Difficulty: ${t.difficulty || 'Intermediate'}\n` +
        `    Importance: ${t.importance || 'High'}\n` +
        `    Subtopics (${t.subtopics.length}):\n${subList}`
      );
    })
    .join('\n\n');

  return `You are an expert academic curriculum designer.

TASK: Allocate teaching hours for the topics in a university course unit.

UNIT: "${unitTitle}"
TOTAL UNIT HOURS AVAILABLE: ${totalHours} hours

TOPICS:
${topicList}

ALLOCATION RULES:
1. DO NOT divide hours equally. Base allocation purely on academic merit.
2. Allocate MORE hours to topics that are:
   - Conceptually deeper or more technically complex
   - Have more subtopics or require practical demonstration
   - Are foundational prerequisites for later topics
3. Allocate FEWER hours to simpler, introductory, or definition-only topics.
4. Hours can be fractional (e.g., 1.5 = 1 hr 30 mins; 0.75 = 45 mins minimum).
5. The SUM of all allocations MUST equal exactly ${totalHours} hours.

RESPONSE FORMAT (JSON only, no markdown, no explanation outside the JSON):
{
  "allocations": {
    "Topic 1": <hours as decimal number>,
    "Topic 2": <hours as decimal number>,
    ... (one entry per topic, keyed by "Topic N" numbering)
  },
  "rationale": "<one-sentence explanation of your weighting approach>",
  "total": ${totalHours}
}`;
}

/**
 * Parse and validate the LLM JSON response.
 * Re-scales allocations if the sum doesn't precisely match totalHours.
 */
function parseAndValidateResponse(
  rawText: string,
  topics: TopicAllocationInput[],
  totalHours: number
): TopicAllocationResult {
  // Strip any markdown code fences
  const cleaned = rawText.replace(/```json\n?|```/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt to extract JSON from mixed text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('LLM returned non-JSON response');
    parsed = JSON.parse(jsonMatch[0]);
  }

  const rawAllocations: Record<string, number> = parsed.allocations || {};
  const rationale: string = parsed.rationale || 'Allocated by complexity.';

  // Map "Topic N" keys back to topic IDs
  const allocations: Record<string, number> = {};
  topics.forEach((topic, i) => {
    const key = `Topic ${i + 1}`;
    allocations[topic.id] = parseFloat(String(rawAllocations[key] || 0)) || 0;
  });

  // Validate total & rescale if needed
  const rawTotal = Object.values(allocations).reduce((s, v) => s + v, 0);
  const tolerance = 0.1;

  if (Math.abs(rawTotal - totalHours) > tolerance && rawTotal > 0) {
    // Proportional rescaling
    const scale = totalHours / rawTotal;
    topics.forEach((topic) => {
      allocations[topic.id] = Math.round(allocations[topic.id] * scale * 4) / 4; // round to quarter-hour
    });
    // Fix any rounding drift on last item
    const newTotal = Object.values(allocations).reduce((s, v) => s + v, 0);
    const drift = Math.round((totalHours - newTotal) * 4) / 4;
    if (Math.abs(drift) > 0 && topics.length > 0) {
      allocations[topics[topics.length - 1].id] += drift;
    }
  }

  const totalAllocated = Math.round(
    Object.values(allocations).reduce((s, v) => s + v, 0) * 100
  ) / 100;

  return { allocations, totalAllocated, rationale };
}

/**
 * Call OpenAI Chat Completions API directly.
 */
async function callOpenAI(
  prompt: string,
  apiKey: string
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call NVIDIA NIM API (OpenAI-compatible endpoint).
 */
async function callNvidiaAPI(
  prompt: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are an expert curriculum designer. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`NVIDIA API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call backend proxy at /api/timeline/generate-topics.
 */
async function callBackendProxy(
  unitTitle: string,
  totalHours: number,
  topics: TopicAllocationInput[]
): Promise<TopicAllocationResult> {
  const res = await fetch(`${API_BASE_URL}/api/timeline/generate-topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unitTitle, totalHours, topics }),
  });

  if (!res.ok) {
    throw new Error(`Backend proxy error (${res.status})`);
  }

  const data = await res.json();

  // If backend returns pre-structured result, use it directly
  if (data.allocations && typeof data.allocations === 'object') {
    return data as TopicAllocationResult;
  }

  // If backend returns raw LLM text, parse it ourselves
  if (data.rawText || data.content) {
    return parseAndValidateResponse(data.rawText || data.content, topics, totalHours);
  }

  throw new Error('Unexpected backend response format');
}

/**
 * Main entry point — generates AI-driven topic time allocations for a unit.
 *
 * @param unitTitle   - Title of the unit (e.g. "Unit 3: Neural Networks")
 * @param totalHours  - Total teaching hours available for this unit
 * @param topics      - Array of topics with subtopics to allocate time for
 */
export async function generateTopicTimeline(
  unitTitle: string,
  totalHours: number,
  topics: TopicAllocationInput[]
): Promise<TopicAllocationResult> {
  if (!topics || topics.length === 0) {
    throw new Error('No topics provided for timeline generation.');
  }
  if (!totalHours || totalHours <= 0) {
    throw new Error('Unit total hours must be greater than 0.');
  }

  const prompt = buildAllocationPrompt(unitTitle, totalHours, topics);

  // Strategy 1: OpenAI direct
  if (OPENAI_API_KEY) {
    try {
      const rawText = await callOpenAI(prompt, OPENAI_API_KEY);
      return parseAndValidateResponse(rawText, topics, totalHours);
    } catch (err) {
      console.warn('[Timeline] OpenAI call failed, trying NVIDIA:', err);
    }
  }

  // Strategy 2: NVIDIA NIM direct
  if (NVIDIA_API_KEY) {
    try {
      const rawText = await callNvidiaAPI(prompt, NVIDIA_API_KEY);
      return parseAndValidateResponse(rawText, topics, totalHours);
    } catch (err) {
      console.warn('[Timeline] NVIDIA API call failed, trying backend proxy:', err);
    }
  }

  // Strategy 3: Backend proxy
  return callBackendProxy(unitTitle, totalHours, topics);
}
