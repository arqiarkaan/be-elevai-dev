import textToSpeech from '@google-cloud/text-to-speech';
import { env } from '../config/env.js';

/**
 * TTS Service using Google Cloud Text-to-Speech
 * Converts text to speech audio (base64 encoded)
 */
export class TTSService {
  private client: textToSpeech.TextToSpeechClient;

  constructor() {
    this.client = new textToSpeech.TextToSpeechClient({
      keyFilename: env.googleCloudCredentials,
    });
  }

  /**
   * Convert text to speech audio
   * @param text - The text to convert to speech
   * @param languageCode - Language code (default: id-ID for Indonesian)
   * @param voiceName - Voice name (default: id-ID-Wavenet-A for Indonesian female voice)
   * @returns Base64 encoded audio string
   */
  async textToSpeech(
    text: string,
    languageCode: string = 'id-ID',
    voiceName: string = 'id-ID-Wavenet-A'
  ): Promise<string> {
    try {
      // Construct the request
      const request: textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest =
        {
          input: { text },
          voice: {
            languageCode,
            name: voiceName,
            ssmlGender:
              textToSpeech.protos.google.cloud.texttospeech.v1.SsmlVoiceGender
                .FEMALE,
          },
          audioConfig: {
            audioEncoding:
              textToSpeech.protos.google.cloud.texttospeech.v1.AudioEncoding
                .MP3,
            speakingRate: 1.15, // Slightly faster for more natural speech
            pitch: 1.1, // Slightly higher pitch for more warmth
          },
        };

      // Perform the text-to-speech request
      const [response] = await this.client.synthesizeSpeech(request);

      // Convert the audio content to base64
      if (response.audioContent) {
        const audioBuffer = Buffer.from(response.audioContent);
        return audioBuffer.toString('base64');
      }

      throw new Error('No audio content received from TTS service');
    } catch (error) {
      console.error('TTS generation error:', error);
      throw new Error(
        `Failed to generate speech: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Convert text to speech with English voice (for scholarship interviews)
   * @param text - The text to convert to speech
   * @returns Base64 encoded audio string
   */
  async textToSpeechEnglish(text: string): Promise<string> {
    return this.textToSpeech(text, 'en-US', 'en-US-Neural2-C'); // Female US English voice
  }

  /**
   * Convert text to speech with Indonesian voice (for internship interviews)
   * @param text - The text to convert to speech
   * @returns Base64 encoded audio string
   */
  async textToSpeechIndonesian(text: string): Promise<string> {
    return this.textToSpeech(text, 'id-ID', 'id-ID-Wavenet-A'); // Female Indonesian voice
  }
}

export const ttsService = new TTSService();
