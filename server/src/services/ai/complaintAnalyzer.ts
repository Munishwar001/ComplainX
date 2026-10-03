import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { AIAnalysisSchema, AIAnalysisResult } from './types';

// ── Gemini client ─────────────────────────────────────────────────────────────

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return geminiClient;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function analyzeComplaint(
  subject: string,
  body: string,
  location?: string,
  city?: string,
  state?: string
): Promise<AIAnalysisResult> {
  // Step 1 — keyword matching (English + Hindi + Hinglish)
  console.log('[AI] Step 1 — Keyword matching...');
  const step1 = keywordAnalyze(subject, body, location, city, state);
  console.log(`[AI] Step 1 → category: ${step1.category}, confidence: ${Math.round(step1.confidence * 100)}%`);

  // Step 2 — Gemini enrichment (if key available)
  if (!env.GEMINI_API_KEY) {
    console.log('[AI] Step 2 skipped — no GEMINI_API_KEY');
    return step1;
  }

  console.log('[AI] Step 2 — Gemini enrichment...');
  try {
    const step2 = await geminiEnrich(subject, body, step1);
    console.log(`[AI] Step 2 → category: ${step2.category}, confidence: ${Math.round(step2.confidence * 100)}%`);
    return step2;
  } catch (err: any) {
    console.warn(`[AI] Gemini failed (${err.message}) — using Step 1 result`);
    return step1;
  }
}

export const mockAnalyzeComplaint = (
  subject: string, body: string,
  location?: string, city?: string, state?: string
) => keywordAnalyze(subject, body, location, city, state);

// ── Step 1: Keyword matching (English + Hindi + Hinglish) ─────────────────────

interface KeywordRule {
  patterns: RegExp;
  category: AIAnalysisResult['category'];
  subcategory: string;
  recommendedDepartment: string;
  authorityType: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    // English + Hindi: garbage/kachra/safai
    patterns: /\b(garbage|waste|trash|litter|rubbish|dump|sweeping|kachra|kachara|safai|gandagi|ganda|kooda|kuda)\b/i,
    category: 'waste_management', subcategory: 'garbage_collection',
    recommendedDepartment: 'sanitation', authorityType: 'municipal_corporation',
  },
  {
    // English + Hindi: road/sadak/gaddha/pothole
    patterns: /\b(road|pothole|crater|pavement|broken road|damaged road|street damage|sadak|gaddha|gadda|rasta|sarak|khudra)\b/i,
    category: 'road_damage', subcategory: 'pothole',
    recommendedDepartment: 'roads', authorityType: 'public_works_department',
  },
  {
    // English + Hindi: street light/batti/andhera
    patterns: /\b(street light|streetlight|lamp post|lamp|dark street|no light|batti|light nahi|andhera|andhra|bijli batti)\b/i,
    category: 'street_lighting', subcategory: 'street_light_out',
    recommendedDepartment: 'street_lighting', authorityType: 'municipal_corporation',
  },
  {
    // English + Hindi: water/paani/nalkaa/pipe
    patterns: /\b(water|leak|pipe|no water|water shortage|paani|pani|nalkaa|nalka|pipeline|water supply|paani nahi)\b/i,
    category: 'water_supply', subcategory: 'water_leakage',
    recommendedDepartment: 'water_supply', authorityType: 'state_department',
  },
  {
    // English + Hindi: electricity/bijli/power/current
    patterns: /\b(electricity|electric|power|outage|blackout|no power|current|transformer|bijli|current nahi|bijli nahi|power cut|light gayi)\b/i,
    category: 'electricity', subcategory: 'power_outage',
    recommendedDepartment: 'electricity', authorityType: 'utility_company',
  },
  {
    // English + Hindi: traffic/jam/signal
    patterns: /\b(traffic|signal|jam|congestion|accident|speeding|jaam|chakka jam|signal nahi)\b/i,
    category: 'traffic', subcategory: 'traffic_management',
    recommendedDepartment: 'traffic', authorityType: 'traffic_department',
  },
  {
    // English + Hindi: sewer/drain/naali/pani bhra
    patterns: /\b(sewer|sewage|drain|drainage|overflow|waterlogging|naali|nali|naalaa|nala|baarish|barish|paani bhara|pani jam)\b/i,
    category: 'sewerage', subcategory: 'drain_overflow',
    recommendedDepartment: 'sanitation', authorityType: 'municipal_corporation',
  },
  {
    // English + Hindi: park/public/footpath
    patterns: /\b(park|playground|public|infrastructure|building|construction|footpath|sidewalk|maidan|pathwaya)\b/i,
    category: 'public_infrastructure', subcategory: 'general_infrastructure',
    recommendedDepartment: 'public_works', authorityType: 'municipal_corporation',
  },
];

function keywordAnalyze(
  subject: string,
  body: string,
  location?: string,
  city?: string,
  state?: string
): AIAnalysisResult {
  const text = `${subject} ${body}`;

  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.test(text)) {
      return buildResult(rule, text, location, city, state, 0.88);
    }
  }

  // No keyword matched — return 'other' with low confidence → Gemini will fix this
  return {
    category: 'other',
    subcategory: 'general',
    summary: `${subject}. ${body.slice(0, 120)}${body.length > 120 ? '...' : ''}`,
    location: {
      area: location,
      city: city || extractCity(text),
      state: state || extractState(text),
      country: 'India',
    },
    severity: 'medium',
    urgency: 'normal',
    recommendedDepartment: 'general_services',
    authorityType: 'municipal_corporation',
    confidence: 0.50, // low — forces Gemini to properly classify
    needsHumanReview: true,
  };
}

function buildResult(
  rule: KeywordRule,
  text: string,
  location?: string,
  city?: string,
  state?: string,
  confidence = 0.88
): AIAnalysisResult {
  return {
    category: rule.category,
    subcategory: rule.subcategory,
    summary: text.slice(0, 150),
    location: {
      area: location,
      city: city || extractCity(text),
      state: state || extractState(text),
      country: 'India',
    },
    severity: 'medium',
    urgency: 'normal',
    recommendedDepartment: rule.recommendedDepartment,
    authorityType: rule.authorityType,
    confidence,
    needsHumanReview: false,
  };
}

// ── Step 2: Gemini enrichment ─────────────────────────────────────────────────

const GEMINI_PROMPT = `You are an AI complaint classification system for ComplanX, an Indian civic complaint platform.

The complaint may be in English, Hindi, or Hinglish (mixed Hindi-English). Understand the language and classify accordingly.

Analyze this complaint and return ONLY a JSON object with these exact fields:
{
  "category": one of [waste_management, road_damage, street_lighting, water_supply, electricity, traffic, sewerage, public_infrastructure, other],
  "subcategory": string (e.g. "garbage_collection", "pothole", "power_outage", "water_leakage"),
  "summary": string (1-2 sentence summary in English),
  "location": {
    "area": string or null,
    "city": string or null,
    "state": string or null,
    "country": "India"
  },
  "severity": one of [low, medium, high, critical],
  "urgency": one of [low, normal, high, emergency],
  "recommendedDepartment": string (e.g. "sanitation", "roads", "electricity", "water_supply"),
  "authorityType": string (e.g. "municipal_corporation", "state_department", "utility_company"),
  "confidence": number 0.0 to 1.0,
  "needsHumanReview": boolean
}

Examples of Hindi complaints:
- "sadak karab hai / sadak toot gayi / gaddha hai" → road_damage
- "kachra nahi uthaya / gandagi hai" → waste_management  
- "bijli nahi hai / current nahi / power cut" → electricity
- "paani nahi aa raha / pipe toot gayi" → water_supply
- "naali band hai / pani bhar gaya" → sewerage
- "batti nahi hai / andhera hai" → street_lighting

Rules:
- Extract location (city, area) from text if mentioned
- Set confidence >= 0.85 for clear complaints
- Respond ONLY with valid JSON, no markdown fences`;

async function geminiEnrich(
  subject: string,
  body: string,
  step1: AIAnalysisResult
): Promise<AIAnalysisResult> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${GEMINI_PROMPT}

Subject: ${subject}
Body: ${body}

Initial keyword result (use as hint, but override if needed based on actual text meaning):
Category hint: ${step1.category}
Location hint: ${[step1.location.area, step1.location.city, step1.location.state].filter(Boolean).join(', ') || 'not detected'}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip markdown fences if present
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/,'')
    .trim();

  const parsed = JSON.parse(cleaned);
  const validated = AIAnalysisSchema.safeParse(parsed);

  if (!validated.success) {
    console.warn('[AI] Gemini Zod validation failed:', validated.error.errors);
    throw new Error('Invalid Gemini response structure');
  }

  return validated.data;
}

// ── Location helpers ──────────────────────────────────────────────────────────

function extractCity(text: string): string | undefined {
  const cities = [
    'mohali', 'chandigarh', 'panchkula', 'amritsar', 'ludhiana',
    'jalandhar', 'delhi', 'mumbai', 'bangalore', 'hyderabad', 'pune',
    'noida', 'gurgaon', 'gurugram', 'faridabad',
  ];
  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
  }
  return undefined;
}

function extractState(text: string): string | undefined {
  const states: Record<string, string> = {
    punjab: 'Punjab', chandigarh: 'Chandigarh', haryana: 'Haryana',
    delhi: 'Delhi', 'uttar pradesh': 'Uttar Pradesh', maharashtra: 'Maharashtra',
    up: 'Uttar Pradesh',
  };
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(states)) {
    if (lower.includes(key)) return value;
  }
  return undefined;
}
