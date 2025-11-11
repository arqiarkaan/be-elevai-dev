import { google } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { env } from '../config/env.js';
import type { LLMResponse } from '../types/index.js';

/**
 * LLM Service using Vercel AI SDK with Google Gemini
 */
export class LLMService {
  private model = google('gemini-2.5-flash');

  /**
   * Generate text response from LLM
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7
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
  async generateStreamingResponse(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7
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

      const result = await streamText({
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
    temperature: number = 0.7
  ): Promise<T> {
    try {
      const fullPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.`;

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

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('LLM JSON generation error:', error);
      throw new Error('Failed to generate valid JSON response from AI');
    }
  }

  /**
   * Generate array of items (for Ikigai spots, life purposes, etc.)
   */
  async generateArray<T = any>(
    prompt: string,
    systemPrompt: string,
    count: number = 5,
    temperature: number = 0.8
  ): Promise<T[]> {
    const fullPrompt = `${prompt}\n\nGenerate exactly ${count} items. Return as a JSON array.`;

    return this.generateJSONResponse<T[]>(fullPrompt, systemPrompt, temperature);
  }
}

export const llmService = new LLMService();
