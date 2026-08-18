/**
 * AI Mentoring & LLM API Service Layer for EZCAT
 *
 * Provides live coaching assistance, concept explanations, LaTeX equation formatting,
 * and robust offline fallback heuristics with CAT exam context (+3 / -1 marking).
 */

export interface QuestionAIContext {
  section?: 'varc' | 'dilr' | 'qa' | string;
  topic?: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  type?: 'mcq' | 'tita' | string;
  options?: string[];
  correctAnswer?: string;
  existingExplanation?: string;
  hint?: string;
  userLevel?: string;
}

export interface AICoachResponse {
  content: string;
  isOfflineFallback: boolean;
  error?: string;
  source: 'api' | 'offline_fallback';
  timestamp: number;
}

export interface ConceptExplanationResponse {
  concept: string;
  explanation: string;
  keyFormulas: string[];
  examTips: string[];
  trapsToAvoid: string[];
  isOfflineFallback: boolean;
  source: 'api' | 'offline_fallback';
  timestamp: number;
}

export interface AIServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 12000; // 12 seconds timeout for fast mobile responsiveness

/**
 * Heuristic database for offline concept explanations across high-yield CAT topics
 */
const OFFLINE_CAT_CONCEPTS: Record<string, {
  explanation: string;
  keyFormulas: string[];
  examTips: string[];
  trapsToAvoid: string[];
}> = {
  'arithmetic': {
    explanation: 'Arithmetic forms 35-45% of CAT Quantitative Aptitude (Percentages, Profit & Loss, TSD, Time & Work, Averages, Mixtures & Allegations). Focus on ratio-based multipliers and unitary methods rather than lengthy algebraic equations.',
    keyFormulas: [
      '$$Multiplier = 1 \\pm \\frac{r}{100}$$',
      '$$Speed = \\frac{Distance}{Time} \\implies Average\\ Speed = \\frac{Total\\ Distance}{Total\\ Time} = \\frac{2s_1 s_2}{s_1 + s_2}$$ (when distances are equal)',
      '$$\\frac{W_1}{M_1 \\cdot D_1 \\cdot H_1} = \\frac{W_2}{M_2 \\cdot D_2 \\cdot H_2}$$',
      '$$\\frac{Q_c}{Q_d} = \\frac{d - m}{m - c}$$ (Rule of Alligation)',
    ],
    examTips: [
      'Use 100 or 100x as the base value for percentage change calculations.',
      'In TSD relative motion, always identify the time when objects start moving simultaneously.',
      'Check whether the question is MCQ (+3 / -1) or TITA (+3 / 0) before attempting educated guesses.',
    ],
    trapsToAvoid: [
      'Confusing percentage points with percentage increase (e.g. 20% to 25% is a 5 percentage point increase but a 25% relative increase).',
      'Using arithmetic mean of speeds when distances are equal (always use harmonic mean).',
    ],
  },
  'geometry': {
    explanation: 'Geometry and Mensuration in CAT heavily test properties of Triangles (similarity, area ratios, incircles/circumcircles), Circles (tangent secant theorems, cyclic quadrilaterals), and Coordinate Geometry.',
    keyFormulas: [
      '$$\\Delta = r \\cdot s = \\frac{abc}{4R} = \\sqrt{s(s-a)(s-b)(s-c)}$$',
      '$$Appollonius\\ Theorem: AB^2 + AC^2 = 2(AD^2 + BD^2)$$ (where $AD$ is the median)',
      '$$Area\\ Ratio = \\left(\\frac{Side_1}{Side_2}\\right)^2$$ for similar triangles',
      '$$PT^2 = PA \\cdot PB$$ (Tangent-Secant Theorem)',
    ],
    examTips: [
      'Draw a clean, proportional diagram immediately upon reading a geometry question.',
      'Look for cyclic quadrilateral angle sums ($\\angle A + \\angle C = 180^\\circ$) in circle problems.',
      'Use standard 30-60-90 ($1 : \\sqrt{3} : 2$) and 45-45-90 ($1 : 1 : \\sqrt{2}$) triangles to avoid trigonometric computations.',
    ],
    trapsToAvoid: [
      'Assuming figures are drawn to scale or assuming angles are $90^\\circ$ without explicit proof.',
      'Forgetting that the angle subtended by a diameter at any point on the circumference is $90^\\circ$.',
    ],
  },
  'algebra': {
    explanation: 'CAT Algebra tests Polynomials, Quadratic Equations, Logarithms, Modulus Functions, Inequalities, and Maxima/Minima. Emphasis is on graphical interpretation and roots properties.',
    keyFormulas: [
      '$$Sum\\ of\\ roots: \\alpha + \\beta = -\\frac{b}{a}, \\quad Product: \\alpha\\beta = \\frac{c}{a}$$',
      '$$Discriminant\\ D = b^2 - 4ac \\implies D > 0\\ (real/distinct), D = 0\\ (equal), D < 0\\ (complex)$$',
      '$$\\log_b(a) = \\frac{\\log_c(a)}{\\log_c(b)}, \\quad a^{\\log_a(x)} = x$$',
      '$$AM \\ge GM \\ge HM \\implies \\frac{a+b}{2} \\ge \\sqrt{ab}$$ (for $a, b > 0$)',
    ],
    examTips: [
      'Test extreme values (e.g. $x = 0, 1, -1, 2$) to quickly eliminate options in algebraic identities.',
      'Use the wavy curve method for solving polynomial inequalities like $\\frac{(x-1)(x+2)}{x-3} \\ge 0$.',
      'For modulus inequalities $|x - a| \\le b$, interpret as distance on a number line: $a - b \\le x \\le a + b$.',
    ],
    trapsToAvoid: [
      'Forgetting base constraints in logarithms: for $\\log_b(a)$, $a > 0, b > 0, b \\ne 1$.',
      'Dividing or multiplying an inequality by an unknown variable without checking its sign.',
    ],
  },
  'number systems': {
    explanation: 'Number Systems in CAT tests Divisibility Rules, Prime Factorization, Unit/Tens Digits, Remainders (Euler, Fermat, Wilson theorems), LCM/HCF, and Base Systems.',
    keyFormulas: [
      '$$Number\\ of\\ factors\\ of\\ N = p_1^{a} p_2^{b} p_3^{c} \\implies (a+1)(b+1)(c+1)$$',
      '$$Euler\'s\\ Totient\\ \\phi(N) = N\\left(1 - \\frac{1}{p_1}\\right)\\left(1 - \\frac{1}{p_2}\\right)...$$',
      '$$Remainder\\ \\left[\\frac{a^{\\phi(N)}}{N}\\right] = 1$$ (when $\\gcd(a, N) = 1$)',
      '$$LCM(a, b) \\times HCF(a, b) = a \\times b$$',
    ],
    examTips: [
      'Express large numbers in prime factorization format immediately.',
      'For cyclicity of units digits, remember all positive integers have cyclicity dividing 4.',
      'Use binomial expansion for remainders: $(ax + 1)^n / a$ always gives remainder $1^n = 1$.',
    ],
    trapsToAvoid: [
      'Assuming that 1 is a prime number (1 is neither prime nor composite; smallest prime is 2).',
      'Missing the case of negative remainders when simplifying complex remainder products.',
    ],
  },
  'dilr': {
    explanation: 'Data Interpretation and Logical Reasoning in CAT requires building comprehensive constraint tables, matrices, and case trees. Accuracy over speed is vital: solving 2-3 full sets completely guarantees a 99+ percentile.',
    keyFormulas: [
      '$$Set\\ Theory:\\ n(A \\cup B \\cup C) = \\sum n(A) - \\sum n(A \\cap B) + n(A \\cap B \\cap C)$$',
      '$$Exactly\\ one = \\sum n(A) - 2\\sum n(A \\cap B) + 3n(A \\cap B \\cap C)$$',
      '$$Exactly\\ two = \\sum n(A \\cap B) - 3n(A \\cap B \\cap C)$$',
    ],
    examTips: [
      'Spend the first 3-4 minutes scanning all sets in the section to choose the easiest 2-3 sets.',
      'Fill in direct, unambiguous clues first into a structured grid or table.',
      'Branch into sub-cases (Case 1 / Case 2) as soon as you find a binary constraint.',
    ],
    trapsToAvoid: [
      'Spending more than 12-14 minutes on a stuck set without making structural progress.',
      'Making unstated assumptions (e.g. assuming consecutive seating means clockwise without orientation).',
    ],
  },
  'varc': {
    explanation: 'Verbal Ability & Reading Comprehension tests Reading Comprehension (4 passages, 16 questions), Para Jumbles, Para Summary, and Odd Sentence Out. Tone analysis, main idea identification, and elimination of extreme options are key.',
    keyFormulas: [
      '$$Main\\ Idea = Primary\\ Purpose + Author\'s\\ Core\\ Thesis$$',
      '$$Para\\ Jumble\\ Strategy = Opening\\ Sentence \\to Mandatory\\ Pairs \\to Logical\\ Conclusion$$',
    ],
    examTips: [
      'Read the passage with an active mindset, summarizing each paragraph in 5-7 mental words.',
      'Eliminate options with extreme keywords ("always", "never", "only", "must") unless explicitly stated by the author.',
      'In Para Jumbles, search for noun-pronoun antecedents, chronological sequences, and contrast words ("however", "nonetheless").',
    ],
    trapsToAvoid: [
      'Choosing an option that is factually true in real life but not supported by the text of the passage.',
      'Selecting overly narrow or out-of-scope answer choices for main idea questions.',
    ],
  },
};

/**
 * Get effective API Key from environment or optional override
 */
export function getAIApiKey(overrideKey?: string): string | null {
  if (overrideKey && overrideKey.trim().length > 0) {
    return overrideKey.trim();
  }

  const envKey = process.env.EXPO_PUBLIC_AI_API_KEY;
  if (envKey && envKey.trim().length > 0 && envKey !== 'your_llm_api_key_here') {
    return envKey.trim();
  }

  return null;
}

/**
 * Get configured Base URL from environment or default OpenAI endpoint
 */
export function getAIBaseUrl(overrideUrl?: string): string {
  if (overrideUrl && overrideUrl.trim().length > 0) {
    return overrideUrl.trim().replace(/\/+$/, '');
  }

  const envUrl = process.env.EXPO_PUBLIC_AI_BASE_URL || process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'https://api.openai.com/v1';
}

/**
 * Get configured model name from environment or fallback
 */
export function getAIModel(overrideModel?: string): string {
  if (overrideModel && overrideModel.trim().length > 0) {
    return overrideModel.trim();
  }

  const envModel = process.env.EXPO_PUBLIC_AI_MODEL;
  if (envModel && envModel.trim().length > 0) {
    return envModel.trim();
  }

  return 'gpt-4o-mini';
}

/**
 * Formats question context and system prompt with CAT exam marking and LaTeX conventions
 */
export function buildAICoachPrompts(
  questionText: string,
  userQuery: string,
  context?: QuestionAIContext
): { systemPrompt: string; userPrompt: string } {
  const section = context?.section?.toUpperCase() || 'CAT QUESTION';
  const topic = context?.topic || 'General Aptitude';
  const qType = context?.type === 'tita' ? 'TITA (Non-MCQ, +3 / 0 marking)' : 'MCQ (+3 for correct, -1 for wrong answer)';
  const optionsText = context?.options && context.options.length > 0
    ? context.options.map((opt, i) => `   Option ${String.fromCharCode(65 + i)}: ${opt}`).join('\n')
    : '   [No options / TITA Question]';

  const systemPrompt = `You are EZCAT's Master CAT Exam Mentor & AI Problem Coach. You specialize in training aspirants for 99+ percentiles in IIM CAT (Common Admission Test).

Core Instructions:
1. Provide concise, clear, and pedagogically sound explanations.
2. Structure your response into:
   - 🎯 **Core Concept / Approach**
   - 📐 **Step-by-Step Mathematical / Logical Breakdown**
   - 💡 **CAT Shortcut / Exam Strategy & Trap Alert**
3. MATH & FORMULA FORMATTING RULES:
   - Use block LaTeX $$...$$ for standalone formulas, equations, calculations, or multi-line steps.
   - Use inline LaTeX $...$ for variables, numbers with operations, or simple mathematical terms.
   - Example: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" or "$x > 0$".
4. EXAM CONTEXT:
   - Question Type: ${qType}
   - Pacing: Encourage fast elimination of distractors and time-saving shortcuts.
5. Directly address the student's specific question or confusion. Keep tone motivating, tactical, and direct.`;

  const userPrompt = `### [${section}] ${topic}
**Question Statement:**
${questionText}

**Options:**
${optionsText}

${context?.correctAnswer ? `**Correct Answer:** ${context.correctAnswer}` : ''}
${context?.existingExplanation ? `**Existing Solution Summary:** ${context.existingExplanation}` : ''}

**Student's Question / Clarification Request:**
"${userQuery}"

Provide an intuitive, step-by-step coaching explanation using clean LaTeX equations and CAT exam strategy.`;

  return { systemPrompt, userPrompt };
}

/**
 * Builds offline fallback explanation for a question query
 */
export function generateOfflineCoachFallback(
  questionText: string,
  userQuery: string,
  context?: QuestionAIContext
): string {
  const queryLower = userQuery.toLowerCase();
  const section = context?.section?.toLowerCase() || '';
  const existingSol = context?.existingExplanation || context?.hint || '';
  const correctAnswer = context?.correctAnswer || '';

  // Query asks for shortcut / formula
  if (queryLower.includes('shortcut') || queryLower.includes('formula') || queryLower.includes('trick') || queryLower.includes('fast')) {
    return `### 💡 CAT Tactical Shortcut & Formula Breakdown

**Key Formula / Principle:**
${context?.section === 'qa' ? '$$\\text{Effective Percentage Multiplier: } M = 1 \\pm \\frac{r}{100}$$' : '$$\\text{Constraint Matrix Mapping Method}$$'}

**Exam Optimization:**
1. **Option Back-Substitution:** When options are integers, plug the middle option into the equation to determine if you need a higher or lower value.
2. **Unitary Heuristic:** Instead of setting up 3 simultaneous variables, assume a convenient base value (e.g. $100$ or $\\text{LCM of coefficients}$).
3. **CAT Marking Tip:** This is an MCQ with $+3 / -1$ negative marking. If you can eliminate 2 out of 4 options, the expected value becomes positive:
$$E = \\left(\\frac{1}{2} \\times +3\\right) + \\left(\\frac{1}{2} \\times -1\\right) = +1.0$$

*Note: Live AI Mentor is currently offline. Connect an API key for dynamic interactive assistance.*`;
  }

  // Query asks for step 1 / starting point
  if (queryLower.includes('step 1') || queryLower.includes('start') || queryLower.includes('first step') || queryLower.includes('how to begin')) {
    return `### 🎯 How to Start This Problem

1. **Identify the Core Variable & Given Conditions:**
   - Extract the unknown variable $x$ and boundary conditions from the question statement.
2. **Translate Statement into Mathematical Relation:**
   $$ \\text{Given Relation: } \\sum_{i=1}^{n} a_i = S $$
3. **Initial Step:**
   ${existingSol ? `From the solution: *"${existingSol.slice(0, 140)}..."*` : 'Set up the initial constraint table or algebraic equation before calculating intermediate steps.'}
4. **Target Time:** Limit initial setup to $\\le 30$ seconds.

*Note: Live AI Mentor is currently offline. Connect an API key for dynamic interactive assistance.*`;
  }

  // Query asks about wrong option / elimination
  if (queryLower.includes('option') || queryLower.includes('why') || queryLower.includes('incorrect') || queryLower.includes('wrong')) {
    return `### 🔍 Option Elimination & Trap Analysis

1. **Why Distractors Fail:**
   - In CAT ${section.toUpperCase() || 'QA/DILR'}, wrong options are engineered around common calculation errors (e.g., forgetting boundary conditions, sign flips, or base errors).
2. **Verification Rule:**
   ${correctAnswer ? `- The correct answer is **${correctAnswer}**.` : '- Test extreme cases or parity (odd/even) to eliminate impossible options.'}
3. **Negative Marking Safeguard:**
   - Under CAT negative marking ($-1$), eliminate at least 2 options with mathematical certainty before guessing.

*Note: Live AI Mentor is currently offline. Connect an API key for dynamic interactive assistance.*`;
  }

  // General step-by-step coaching breakdown
  return `### 🤖 AI Coach Step-by-Step Breakdown

**1. 🎯 Conceptual Approach:**
${existingSol ? existingSol : 'Break the problem down into distinct mathematical/logical constraints and apply first principles.'}

**2. 📐 Mathematical / Logical Resolution:**
$$ \\text{Key Relation: } \\text{Result} = f(\\text{givens}) $$
- Step A: Define variables and verify domain constraints.
- Step B: Apply standard CAT theorems or elimination rules.
${correctAnswer ? `- Step C: Arrive at final validated answer: **${correctAnswer}**.` : '- Step C: Calculate and verify with question constraints.'}

**3. 💡 CAT Exam Strategy:**
- In CAT ${section.toUpperCase() || 'exam'}, aim to solve standard questions in $\\le 90$ seconds.
- Remember: $+3$ for correct, $-1$ for wrong MCQ, $0$ for TITA.

*Note: Running in offline fallback mode. Connect your API key in Coach settings to enable live LLM interactions.*`;
}

/**
 * Main AI Coaching Service
 */
export const aiService = {
  /**
   * Ask the AI Coach a question regarding a practice problem
   */
  async askAICoach(
    questionText: string,
    userQuery: string,
    context?: QuestionAIContext,
    configOverride?: AIServiceConfig
  ): Promise<AICoachResponse> {
    const apiKey = getAIApiKey(configOverride?.apiKey);
    const baseUrl = getAIBaseUrl(configOverride?.baseUrl);
    const model = getAIModel(configOverride?.model);
    const timeoutMs = configOverride?.timeoutMs || DEFAULT_TIMEOUT_MS;

    // If no valid API key is present, immediately return formatted offline fallback
    if (!apiKey) {
      const fallbackContent = generateOfflineCoachFallback(questionText, userQuery, context);
      return {
        content: fallbackContent,
        isOfflineFallback: true,
        source: 'offline_fallback',
        timestamp: Date.now(),
      };
    }

    const { systemPrompt, userPrompt } = buildAICoachPrompts(questionText, userQuery, context);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      if (baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'https://ezcat.app';
        headers['X-Title'] = 'EZCAT AI Coach';
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[AIService] API error (${response.status}): ${errText.slice(0, 100)}`);
        const fallbackContent = generateOfflineCoachFallback(questionText, userQuery, context);
        return {
          content: fallbackContent,
          isOfflineFallback: true,
          error: `API error (${response.status})`,
          source: 'offline_fallback',
          timestamp: Date.now(),
        };
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || '';

      if (!rawText.trim()) {
        throw new Error('Empty response from LLM');
      }

      return {
        content: rawText.trim(),
        isOfflineFallback: false,
        source: 'api',
        timestamp: Date.now(),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
      console.warn(`[AIService] Request failed (${isTimeout ? 'Timeout' : 'Network'}):`, err?.message);

      const fallbackContent = generateOfflineCoachFallback(questionText, userQuery, context);
      return {
        content: fallbackContent,
        isOfflineFallback: true,
        error: isTimeout ? 'Request timed out' : (err?.message || 'Network error'),
        source: 'offline_fallback',
        timestamp: Date.now(),
      };
    }
  },

  /**
   * Generate structured concept explanation and formula summary
   */
  async generateConceptExplanation(
    concept: string,
    userLevel: string = 'Intermediate',
    configOverride?: AIServiceConfig
  ): Promise<ConceptExplanationResponse> {
    const conceptKey = concept.trim().toLowerCase();
    const apiKey = getAIApiKey(configOverride?.apiKey);
    const baseUrl = getAIBaseUrl(configOverride?.baseUrl);
    const model = getAIModel(configOverride?.model);
    const timeoutMs = configOverride?.timeoutMs || DEFAULT_TIMEOUT_MS;

    // Check offline heuristics dictionary first
    let matchedOffline = OFFLINE_CAT_CONCEPTS[conceptKey];
    if (!matchedOffline) {
      for (const [key, value] of Object.entries(OFFLINE_CAT_CONCEPTS)) {
        if (conceptKey.includes(key) || key.includes(conceptKey)) {
          matchedOffline = value;
          break;
        }
      }
    }

    if (!matchedOffline) {
      matchedOffline = {
        explanation: `${concept} is a fundamental topic in CAT prep. Master the core identities, standard variable substitutions, and elimination techniques for 99+ percentile speed.`,
        keyFormulas: [
          '$$\\text{Standard Relation: } f(x) = ax^2 + bx + c$$',
          '$$\\text{Efficiency Multiplier: } E = \\frac{\\text{Output}}{\\text{Input}}$$',
        ],
        examTips: [
          'Identify whether the problem can be solved in <60 seconds using option elimination.',
          'Verify if the question is MCQ (+3 / -1) or TITA (+3 / 0) before submitting.',
        ],
        trapsToAvoid: [
          'Ignoring edge cases (e.g. $x = 0$ or negative numbers).',
          'Over-calculating intermediate steps without checking options.',
        ],
      };
    }

    // If no API key, return offline concept package immediately
    if (!apiKey) {
      return {
        concept,
        explanation: matchedOffline.explanation,
        keyFormulas: matchedOffline.keyFormulas,
        examTips: matchedOffline.examTips,
        trapsToAvoid: matchedOffline.trapsToAvoid,
        isOfflineFallback: true,
        source: 'offline_fallback',
        timestamp: Date.now(),
      };
    }

    // Try live LLM call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const systemPrompt = `You are EZCAT's Master CAT Mentor. Provide an authoritative concept breakdown for CAT aspirants at ${userLevel} level.
Respond ONLY with valid JSON matching this schema:
{
  "explanation": "2-3 paragraphs explaining the core theory, intuition, and CAT relevance",
  "keyFormulas": ["$$Formula 1$$", "$$Formula 2$$"],
  "examTips": ["Tip 1", "Tip 2", "Tip 3"],
  "trapsToAvoid": ["Trap 1", "Trap 2"]
}`;

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Explain the concept "${concept}" for CAT preparation with LaTeX formulas.` },
          ],
          temperature: 0.5,
          max_tokens: 800,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || '';
      const cleaned = rawText.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        concept,
        explanation: parsed.explanation || matchedOffline.explanation,
        keyFormulas: Array.isArray(parsed.keyFormulas) && parsed.keyFormulas.length > 0 ? parsed.keyFormulas : matchedOffline.keyFormulas,
        examTips: Array.isArray(parsed.examTips) && parsed.examTips.length > 0 ? parsed.examTips : matchedOffline.examTips,
        trapsToAvoid: Array.isArray(parsed.trapsToAvoid) && parsed.trapsToAvoid.length > 0 ? parsed.trapsToAvoid : matchedOffline.trapsToAvoid,
        isOfflineFallback: false,
        source: 'api',
        timestamp: Date.now(),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      return {
        concept,
        explanation: matchedOffline.explanation,
        keyFormulas: matchedOffline.keyFormulas,
        examTips: matchedOffline.examTips,
        trapsToAvoid: matchedOffline.trapsToAvoid,
        isOfflineFallback: true,
        source: 'offline_fallback',
        timestamp: Date.now(),
      };
    }
  },
};
