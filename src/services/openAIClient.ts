export interface RoadmapItem {
  title: string;
  subtitle: string;
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
}

export interface AIInsightResponse {
  roadmap: RoadmapItem[];
  deepDiagnostic: string;
  examStrategy: string;
}

export interface ClientMetricsContext {
  userName: string;
  targetPercentile: string;
  readinessScore: number;
  sectionalAccuracy: {
    varc: number;
    dilr: number;
    qa: number;
  };
  weakTopics: string[];
  strongTopics: string[];
  totalAttempts: number;
}

export class OpenAIClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private provider: string;

  constructor(baseUrl: string, apiKey: string, model: string, provider: string = 'openai') {
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
    this.apiKey = apiKey.trim();
    this.model = model.trim();
    this.provider = provider;
  }

  /**
   * Fast connection check without consuming prompt tokens via /v1/models GET call.
   */
  async validateKey(): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      return { success: false, message: 'API Key is empty.' };
    }

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      if (this.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ezcat.app';
        headers['X-Title'] = 'EZCAT AI Mentor';
      }

      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        return {
          success: true,
          message: `Connection successful! (${this.model} ready)`,
        };
      }

      if (response.status === 401) {
        return { success: false, message: 'Invalid API Key (401 Unauthorized).' };
      } else if (response.status === 429) {
        return { success: false, message: 'Rate limit or quota exceeded (429 Too Many Requests).' };
      } else {
        const errText = await response.text().catch(() => '');
        return {
          success: false,
          message: `Server error (${response.status}): ${errText.slice(0, 80)}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Network request failed: ${err?.message || 'Check Base URL and connection.'}`,
      };
    }
  }

  /**
   * Generates structured AI Insights based on student metrics.
   */
  async generateInsights(metrics: ClientMetricsContext): Promise<AIInsightResponse> {
    const systemPrompt = `You are EZCAT's Master CAT Exam Mentor. Analyze student data and generate structured, highly actionable study insights for premier Indian B-Schools (IIMs, FMS, XLRI).
Respond ONLY with raw, valid JSON matching this exact schema:
{
  "roadmap": [
    {
      "title": "Action title",
      "subtitle": "Specific study guidance",
      "priority": "High Priority" | "Medium Priority" | "Low Priority"
    }
  ],
  "deepDiagnostic": "Comprehensive 2-3 sentence cognitive analysis of student's accuracy, speed, and weak sub-topics.",
  "examStrategy": "Targeted advice for time management, section skipping strategy, and target percentile milestone."
}`;

    const userPrompt = `Student Performance Profile:
- Aspirant Name: ${metrics.userName}
- Target Percentile: ${metrics.targetPercentile}
- Current Prep Readiness Score: ${metrics.readinessScore}/100
- Section Accuracy: VARC ${metrics.sectionalAccuracy.varc}%, DILR ${metrics.sectionalAccuracy.dilr}%, QA ${metrics.sectionalAccuracy.qa}%
- Weak Sub-Topics: ${metrics.weakTopics.length > 0 ? metrics.weakTopics.join(', ') : 'None (<70% accuracy)'}
- Strong Sub-Topics: ${metrics.strongTopics.length > 0 ? metrics.strongTopics.join(', ') : 'General foundational topics'}
- Total Questions Solved: ${metrics.totalAttempts}

Generate 3 roadmap recommendations prioritizing the weak sub-topics, followed by deep diagnostic analysis and exam strategy.`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (this.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://ezcat.app';
      headers['X-Title'] = 'EZCAT AI Mentor';
    }

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`LLM API Error (${response.status}): ${errText.slice(0, 120)}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || '';

    // Strip markdown code block formatting ```json ... ``` if present
    const cleaned = rawContent.replace(/```json\s*|\s*```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned) as AIInsightResponse;
      if (!parsed.roadmap || !Array.isArray(parsed.roadmap)) {
        throw new Error('Invalid roadmap array in AI response');
      }
      return parsed;
    } catch (err: any) {
      throw new Error(`Failed to parse AI output into JSON: ${err?.message || 'Format error'}`);
    }
  }
}
