import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { featureAccessMiddleware } from '../middleware/feature-access.js';
import { llmService } from '../services/llm.service.js';
import { TokenManager } from '../utils/token-manager.js';
import { getPrompt, fillPrompt } from '../config/prompts.js';
import type { Variables } from '../types/hono.js';
import type { AuthUser, FeatureConfig } from '../types/index.js';

const personalBranding = new Hono<{ Variables: Variables }>();

// All routes require authentication
personalBranding.use('*', authMiddleware);

// ============================================
// INSTAGRAM BIO ANALYZER
// ============================================

const instagramBioStage1Schema = z.object({
  bioContent: z.string().min(1),
  isImage: z.boolean().optional(),
});

const instagramBioStage2Schema = z.object({
  bioContent: z.string().min(1),
  analisisAwal: z.string().min(1),
  tujuanUtama: z.string().min(1),
  gayaTulisan: z.string().min(1),
  siapaKamu: z.string().min(1).max(50),
  targetAudiens: z.string().min(1),
  pencapaian: z.array(z.string()).min(1).max(3),
  callToAction: z.string().min(1),
  hashtag: z.string().optional(),
});

/**
 * POST /api/personal-branding/instagram-bio/analyze
 * Analyze Instagram bio (Stage 1)
 */
personalBranding.post(
  '/instagram-bio/analyze',
  featureAccessMiddleware('instagram-bio-analyzer'),
  zValidator('json', instagramBioStage1Schema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const input = c.req.valid('json');

    try {
      const prompt = `
Analyze this Instagram bio:

${input.bioContent}

${input.isImage ? '(Note: This bio was extracted from an image)' : ''}
`;

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('instagramBio.analyze')
      );

      return c.json({
        success: true,
        data: {
          analysis: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Instagram bio analyze error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to analyze bio',
        },
        500
      );
    }
  }
);

/**
 * POST /api/personal-branding/instagram-bio/generate
 * Generate optimized Instagram bios (Stage 2)
 */
personalBranding.post(
  '/instagram-bio/generate',
  featureAccessMiddleware('instagram-bio-analyzer'),
  zValidator('json', instagramBioStage2Schema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const prompt = `
Generate 3 optimized Instagram bio variations:

Original Bio: ${input.bioContent}
Previous Analysis: ${input.analisisAwal}

Requirements:
- Tujuan Utama: ${input.tujuanUtama}
- Gaya Tulisan: ${input.gayaTulisan}
- Identitas: ${input.siapaKamu}
- Target Audiens: ${input.targetAudiens}
- Pencapaian: ${input.pencapaian.join(', ')}
- CTA: ${input.callToAction}
${input.hashtag ? `- Hashtag: ${input.hashtag}` : ''}

Return as JSON array of 3 bio strings (each under 150 characters).
`;

      const bios = await llmService.generateJSONResponse<string[]>(
        prompt,
        getPrompt('instagramBio.generate')
      );

      await TokenManager.consumeTokens(
        user.id,
        feature.id,
        feature.category,
        feature.tokenCost
      );

      return c.json({
        success: true,
        data: {
          bios: Array.isArray(bios) ? bios : [bios],
        },
      });
    } catch (error) {
      console.error('Instagram bio generate error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate bios',
        },
        500
      );
    }
  }
);

// ============================================
// LINKEDIN PROFILE OPTIMIZER
// ============================================

const linkedInProfileSchema = z.object({
  targetOptimasi: z.enum(['headline', 'summary']),
  namaLengkap: z.string().min(1),
  jurusan: z.string().min(1),
  semester: z.number().int().positive(),
  targetKarir: z.enum(['sesuai_jurusan', 'eksplorasi']),
  tujuanUtama: z.enum(['mencari_karir', 'personal_branding']),
  targetRole: z.string().min(1),
  identitasProfesional: z.string().min(1).max(100),
  pencapaian: z.array(z.string()).min(1).max(3),
  skills: z.array(z.string()).min(1).max(3),
});

/**
 * POST /api/personal-branding/linkedin-optimizer
 * Optimize LinkedIn profile (headline or summary)
 */
personalBranding.post(
  '/linkedin-optimizer',
  featureAccessMiddleware('linkedin-profile-optimizer'),
  zValidator('json', linkedInProfileSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const prompt = `
Optimize LinkedIn ${input.targetOptimasi}:

Profile Information:
- Nama: ${input.namaLengkap}
- Jurusan: ${input.jurusan}
- Semester: ${input.semester}
- Target Karir: ${input.targetKarir === 'sesuai_jurusan' ? 'Sesuai jurusan' : 'Eksplorasi'}
- Tujuan: ${input.tujuanUtama === 'mencari_karir' ? 'Mencari karir' : 'Personal branding'}
- Target Role: ${input.targetRole}
- Identitas Profesional: ${input.identitasProfesional}
- Pencapaian: ${input.pencapaian.join(', ')}
- Skills: ${input.skills.join(', ')}
`;

      const systemPrompt = fillPrompt(getPrompt('linkedInProfile'), {
        type: input.targetOptimasi,
      });

      const response = await llmService.generateResponse(prompt, systemPrompt);

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
          optimized_content: response.content,
          type: input.targetOptimasi,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('LinkedIn optimizer error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to optimize profile',
        },
        500
      );
    }
  }
);

export default personalBranding;
