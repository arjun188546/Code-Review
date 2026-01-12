import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult } from '../types';

export type AIProvider = 'openai' | 'claude' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
}

export class AIService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private gemini?: GoogleGenerativeAI;
  private provider: AIProvider;

  constructor(config: AIConfig) {
    this.provider = config.provider;

    if (config.openaiKey) {
      this.openai = new OpenAI({ apiKey: config.openaiKey });
    }
    if (config.anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicKey });
    }
    if (config.geminiKey) {
      this.gemini = new GoogleGenerativeAI(config.geminiKey);
    }
  }

  async analyzeCode(
    repoName: string,
    prTitle: string,
    diff: string,
    language: string,
    provider?: AIProvider
  ): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(repoName, prTitle, diff, language);
    const selectedProvider = provider || this.provider;

    try {
      // Use selected provider
      switch (selectedProvider) {
        case 'gemini':
          if (!this.gemini) throw new Error('Gemini not configured');
          return await this.analyzeWithGemini(prompt);
        case 'claude':
          if (!this.anthropic) throw new Error('Claude not configured');
          return await this.analyzeWithClaude(prompt);
        case 'openai':
        default:
          if (!this.openai) throw new Error('OpenAI not configured');
          return await this.analyzeWithOpenAI(prompt);
      }
    } catch (error) {
      console.error(`${selectedProvider} failed, attempting fallback`);

      // Try fallback providers
      if (selectedProvider !== 'gemini' && this.gemini) {
        try {
          return await this.analyzeWithGemini(prompt);
        } catch (fallbackError) {
          console.error('Gemini fallback failed');
        }
      }

      if (selectedProvider !== 'claude' && this.anthropic) {
        try {
          return await this.analyzeWithClaude(prompt);
        } catch (fallbackError) {
          console.error('Claude fallback failed');
        }
      }

      if (selectedProvider !== 'openai' && this.openai) {
        try {
          return await this.analyzeWithOpenAI(prompt);
        } catch (fallbackError) {
          console.error('OpenAI fallback failed');
        }
      }

      throw error;
    }
  }

  // Send a raw prompt to AI (for debug, chat, etc.)
  async sendPrompt(
    prompt: string,
    provider?: AIProvider
  ): Promise<string> {
    const selectedProvider = provider || this.provider;

    try {
      let response: string;

      switch (selectedProvider) {
        case 'gemini':
          if (!this.gemini) throw new Error('Gemini not configured');
          const model = this.gemini.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8000,
            },
          });
          const geminiResult = await model.generateContent(prompt);
          response = geminiResult.response.text();
          break;

        case 'claude':
          if (!this.anthropic) throw new Error('Claude not configured');
          const claudeMessage = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 8192,
            temperature: 0.3,
            messages: [{ role: 'user', content: prompt }],
          });
          response = claudeMessage.content[0].type === 'text' ? claudeMessage.content[0].text : '';
          break;

        case 'openai':
        default:
          if (!this.openai) throw new Error('OpenAI not configured');
          const completion = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4096,
          });
          response = completion.choices[0]?.message?.content || '';
          break;
      }

      return response;
    } catch (error) {
      console.error(`${selectedProvider} sendPrompt failed:`, error);
      throw error;
    }
  }

  private buildPrompt(repo: string, title: string, diff: string, language: string): string {
    return `You are a SENIOR SOFTWARE ARCHITECT and CODE CONSULTANT with 15+ years of experience. Perform a COMPREHENSIVE, INTELLIGENT code analysis.

REPOSITORY: ${repo}
ANALYSIS: ${title}
LANGUAGE: ${language}

CODE TO ANALYZE:
${diff}

═══════════════════════════════════════════════════════════════════════════════
ANALYSIS FRAMEWORK - Apply ALL dimensions:
═══════════════════════════════════════════════════════════════════════════════

🔴 SECURITY (Critical): Auth flaws, SQL injection, XSS, CSRF, exposed secrets, insecure dependencies, input validation, crypto weaknesses
🟠 BUGS & LOGIC: Null refs, race conditions, memory leaks, edge cases, algorithm errors, type mismatches
🟡 PERFORMANCE: O(n²) complexity, N+1 queries, missing indexes, blocking I/O, inefficient data structures, caching opportunities
🟢 CODE QUALITY: DRY violations, function complexity, naming, magic numbers, error handling, documentation
🔵 ARCHITECTURE: SOLID principles, separation of concerns, design patterns, modularity, API design, scalability
🟣 BEST PRACTICES: Language idioms, framework patterns, testing, accessibility, SEO, logging, configuration
🟤 MAINTAINABILITY: Readability, debugging ease, onboarding, type safety, development workflow

INTELLIGENT REQUIREMENTS:
✓ Context awareness - understand broader codebase, not isolated lines
✓ Pattern recognition - identify recurring patterns (good/bad)
✓ Root cause analysis - find underlying causes, not symptoms
✓ Prioritization - focus on high-impact issues
✓ Actionable feedback - every suggestion includes HOW with code examples
✓ Learning mode - recognize and acknowledge good patterns
✓ Holistic view - consider code interactions
✓ Future-proofing - prevent future issues

SEVERITY LEVELS:
CRITICAL: Security vulnerabilities, data loss, crashes, production blockers
HIGH: Core functionality bugs, major performance issues, breaking changes
MEDIUM: Code quality, minor bugs, optimization, maintainability
LOW: Style, minor refactoring, documentation, nice-to-haves

RESPOND WITH VALID JSON ONLY (NO MARKDOWN):
{
  "overall_assessment": "2-3 sentence executive summary",
  "complexity_score": 1-10,
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "type": "security|bug|performance|quality|style|architecture",
      "file": "path/to/file.ext",
      "line": 42,
      "description": "Clear issue description and impact",
      "suggestion": "Detailed fix with WHY it's better",
      "code_example": "Complete working code fix"
    }
  ],
  "positive_points": ["Specific good practices found"],
  "recommendation": "APPROVE|REQUEST_CHANGES|COMMENT"
}

ANALYZE WITH SENIOR ARCHITECT MINDSET - BE THOROUGH, PRACTICAL, EDUCATIONAL, AND CONSTRUCTIVE.`;
  }

  private async analyzeWithOpenAI(prompt: string): Promise<AnalysisResult> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content!);
  }

  private async analyzeWithClaude(prompt: string): Promise<AnalysisResult> {
    if (!this.anthropic) throw new Error('Claude not configured');

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from potential markdown code blocks
      const jsonMatch =
        content.text.match(/```json\n([\s\S]*?)\n```/) || content.text.match(/{[\s\S]*}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content.text;
      return JSON.parse(jsonStr);
    }
    throw new Error('Unexpected response format from Claude');
  }

  private async analyzeWithGemini(prompt: string): Promise<AnalysisResult> {
    if (!this.gemini) throw new Error('Gemini not configured');

    const model = this.gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent JSON
        maxOutputTokens: 8000,
        responseMimeType: 'application/json', // Force JSON response
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Try direct parsing first
      return JSON.parse(text);
    } catch (error) {
      // Clean and extract JSON
      let cleanedText = text.trim();

      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Extract JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', text.substring(0, 500));
        throw new Error('Invalid JSON response from Gemini');
      }

      let jsonStr = jsonMatch[0];

      // Fix common JSON issues
      jsonStr = jsonStr
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/\\n/g, '\\\\n') // Escape newlines in strings
        .replace(/\\"/g, '\\\\"'); // Escape quotes

      try {
        return JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse cleaned JSON:', jsonStr.substring(0, 500));
        console.error('Parse error:', parseError);
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }
  }
}
