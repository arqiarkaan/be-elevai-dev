import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { env } from '../config/env.js';
import type { LLMResponse } from '../types/index.js';

/**
 * LLM Service using Vercel AI SDK with Google Gemini
 */
export class LLMService {
  private model = google('gemini-2.5-flash-lite');

  /**
   * Generate text response from LLM
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.3
  ): Promise<LLMResponse> {
    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const result = await generateText({
        model: this.model,
        messages,
        temperature,
      });

      return {
        content: result.text,
        tokens_used: result.usage?.totalTokens,
      };
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error('Failed to generate response from AI');
    }
  }

  /**
   * Generate streaming response from LLM
   */
  generateStreamingResponse(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.3
  ) {
    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const result = streamText({
        model: this.model,
        messages,
        temperature,
      });

      return result.textStream;
    } catch (error) {
      console.error('LLM streaming error:', error);
      throw new Error('Failed to generate streaming response from AI');
    }
  }

  /**
   * Generate JSON response from LLM
   */
  async generateJSONResponse<T = any>(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.3,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fullPrompt = `${prompt}\n\nCRITICAL: You must respond with ONLY valid JSON. No markdown, no code blocks, no explanatory text, no comments. Just pure, valid JSON that can be parsed directly.`;

        const result = await this.generateResponse(
          fullPrompt,
          systemPrompt,
          temperature
        );

        // Clean the response - remove markdown code blocks if present
        let jsonText = result.content.trim();

        // Remove markdown code blocks
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        // Remove any leading/trailing non-JSON text
        const jsonMatch = jsonText.match(/[\[{].*[\]}]/s);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonText);

        // Validate it's not empty
        if (Array.isArray(parsed) && parsed.length === 0) {
          throw new Error('Received empty array from LLM');
        }
        if (typeof parsed === 'object' && Object.keys(parsed).length === 0) {
          throw new Error('Received empty object from LLM');
        }

        return parsed;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `LLM JSON generation error (attempt ${attempt}/${maxRetries}):`,
          error
        );

        if (attempt < maxRetries) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    throw new Error(
      `Failed to generate valid JSON response from AI after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Generate array of items (for Ikigai spots, life purposes, etc.)
   */
  async generateArray<T = any>(
    prompt: string,
    systemPrompt: string,
    count: number = 5,
    temperature: number = 0.3
  ): Promise<T[]> {
    const fullPrompt = `${prompt}\n\nYou MUST generate EXACTLY ${count} items. Return ONLY a JSON array with ${count} elements. No additional text or explanation.`;

    const result = await this.generateJSONResponse<T[]>(
      fullPrompt,
      systemPrompt,
      temperature,
      3 // max retries
    );

    // Validate result is an array with expected count
    if (!Array.isArray(result)) {
      throw new Error('LLM did not return an array');
    }

    if (result.length !== count) {
      console.warn(`Expected ${count} items but got ${result.length}`);
    }

    return result;
  }
}

export const llmService = new LLMService();
