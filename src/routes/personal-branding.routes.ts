import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { featureAccessMiddleware } from '../middleware/feature-access.js';
import { llmService } from '../services/llm.service.js';
import { TokenManager } from '../utils/token-manager.js';
import { getPrompt, fillPrompt } from '../config/prompts.js';
import { extractImageFromRequest, extractTextFromImage } from '../utils/image-parser.js';
import type { Variables } from '../types/hono.js';
import type { AuthUser, FeatureConfig } from '../types/index.js';

const personalBranding = new Hono<{ Variables: Variables }>();

// All routes require authentication
personalBranding.use('*', authMiddleware);

// ============================================
// INSTAGRAM BIO ANALYZER
// ============================================

/**
 * POST /api/personal-branding/instagram-bio/upload-image
 * Upload Instagram bio screenshot and extract text
 */
personalBranding.post('/instagram-bio/upload-image', authMiddleware, async (c) => {  try {
    const body = await c.req.parseBody();
    
    // Extract image
    const imageData = await extractImageFromRequest(body);
    
    if (!imageData) {
      return c.json(
        {
          success: false,
          error: 'No image file provided',
        },
        400
      );
    }

    // Extract text from image using Gemini Vision
    const bioText = await extractTextFromImage(imageData.buffer, imageData.mimeType);

    return c.json({
      success: true,
      data: {
        bio_text: bioText,
      },
    });
  } catch (error) {
    console.error('Instagram bio image upload error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process image',
      },
      500
    );
  }
});

const instagramBioStage1Schema = z.object({
  bioContent: z.string().min(1), // Text extracted from image
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
Analisis bio Instagram ini:

${input.bioContent}

(Catatan: Bio ini diekstrak dari screenshot gambar)
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
Buatkan 3 variasi bio Instagram yang optimized:

Bio Original: ${input.bioContent}
Analisis Sebelumnya: ${input.analisisAwal}

Requirements:
- Tujuan Utama: ${input.tujuanUtama}
- Gaya Tulisan: ${input.gayaTulisan}
- Identitas: ${input.siapaKamu}
- Target Audiens: ${input.targetAudiens}
- Pencapaian: ${input.pencapaian.join(', ')}
- CTA: ${input.callToAction}
${input.hashtag ? `- Hashtag: ${input.hashtag}` : ''}

Return sebagai JSON array berisi 3 string bio (masing-masing di bawah 150 karakter).
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
Optimalkan LinkedIn ${input.targetOptimasi}:

Informasi Profil:
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
