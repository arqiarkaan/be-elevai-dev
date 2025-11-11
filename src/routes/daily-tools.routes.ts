import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { featureAccessMiddleware } from '../middleware/feature-access.js';
import { llmService } from '../services/llm.service.js';
import { TokenManager } from '../utils/token-manager.js';
import { getPrompt } from '../config/prompts.js';
import type { Variables } from '../types/hono.js';
import type { AuthUser, FeatureConfig } from '../types/index.js';

const dailyTools = new Hono<{ Variables: Variables }>();

// All routes require authentication
dailyTools.use('*', authMiddleware);

// ============================================
// GENERATOR PROMPT VEO
// ============================================

const promptVeoSchema = z.object({
  subjekUtama: z.string().min(1),
  aksiKegiatan: z.string().min(1),
  ekspresiEmosi: z.string().min(1),
  lokasiTempat: z.string().min(1),
  waktu: z.string().min(1),
  pencahayaan: z.string().min(1),
  gerakanKamera: z.string().min(1),
  gayaVideo: z.string().min(1),
  suasanaVideo: z.string().min(1),
  suaraMusik: z.string().min(1),
  dialog: z.string().min(1),
  detailTambahan: z.string().min(1),
});

/**
 * POST /api/daily-tools/prompt-veo
 * Generate optimized Veo video prompt
 */
dailyTools.post(
  '/prompt-veo',
  featureAccessMiddleware('generator-prompt-veo'),
  zValidator('json', promptVeoSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const prompt = `
Buatkan prompt video generation yang optimized untuk Google Veo:

Subjek: ${input.subjekUtama}
Aksi/Kegiatan: ${input.aksiKegiatan}
Ekspresi/Emosi: ${input.ekspresiEmosi}
Lokasi: ${input.lokasiTempat}
Waktu: ${input.waktu}
Pencahayaan: ${input.pencahayaan}
Gerakan Kamera: ${input.gerakanKamera}
Gaya Video: ${input.gayaVideo}
Suasana: ${input.suasanaVideo}
Suara/Musik: ${input.suaraMusik}
Dialog: ${input.dialog}
Detail Tambahan: ${input.detailTambahan}
`;

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('promptVeo')
      );

      await TokenManager.consumeTokens(
        user.id,
        feature.id,
        feature.category,
        feature.tokenCost,
        response.tokens_used
      );

      return c.json({
        success: true,
        data: {
          veo_prompt: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Prompt Veo generator error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate prompt',
        },
        500
      );
    }
  }
);

// ============================================
// PROMPT ENHANCER
// ============================================

const promptEnhancerSchema = z.object({
  prompt: z.string().min(1),
});

/**
 * Create prompt enhancer route
 */
function createPromptEnhancerRoute(
  path: string,
  featureId: string,
  promptKey: string
) {
  return dailyTools.post(
    path,
    featureAccessMiddleware(featureId),
    zValidator('json', promptEnhancerSchema),
    async (c) => {
      const user = c.get('user') as AuthUser;
      const feature = c.get('feature') as FeatureConfig;
      const input = c.req.valid('json');

      try {
        const enhancePrompt = `
Prompt Original:
${input.prompt}

Enhance prompt ini agar lebih efektif.
`;

        const response = await llmService.generateResponse(
          enhancePrompt,
          getPrompt(`promptEnhancer.${promptKey}`)
        );

        await TokenManager.consumeTokens(
          user.id,
          feature.id,
          feature.category,
          feature.tokenCost,
          response.tokens_used
        );

        return c.json({
          success: true,
          data: {
            original_prompt: input.prompt,
            enhanced_prompt: response.content,
            tokens_used: response.tokens_used,
          },
        });
      } catch (error) {
        console.error('Prompt enhancer error:', error);
        return c.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to enhance prompt',
          },
          500
        );
      }
    }
  );
}

// Register all prompt enhancer routes
createPromptEnhancerRoute(
  '/prompt-enhancer/topik-baru',
  'prompt-enhancer-topik-baru',
  'topikBaru'
);

createPromptEnhancerRoute(
  '/prompt-enhancer/tugas',
  'prompt-enhancer-tugas',
  'tugas'
);

createPromptEnhancerRoute(
  '/prompt-enhancer/konten',
  'prompt-enhancer-konten',
  'konten'
);

createPromptEnhancerRoute(
  '/prompt-enhancer/rencana',
  'prompt-enhancer-rencana',
  'rencana'
);

createPromptEnhancerRoute(
  '/prompt-enhancer/brainstorming',
  'prompt-enhancer-brainstorming',
  'brainstorming'
);

createPromptEnhancerRoute(
  '/prompt-enhancer/koding',
  'prompt-enhancer-koding',
  'koding'
);

export default dailyTools;
