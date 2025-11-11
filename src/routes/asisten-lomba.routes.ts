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

const asistenLomba = new Hono<{ Variables: Variables }>();

// All routes require authentication
asistenLomba.use('*', authMiddleware);

// ============================================
// ESSAY IDEA GENERATOR
// ============================================

const essayIdeaSchema = z.object({
  temaUtama: z.string().min(1),
  subTema: z.string().min(1),
  latarBelakang: z.string().optional(),
  sertakanPenjelasan: z.boolean().optional(),
  sertakanMetode: z.boolean().optional(),
});

/**
 * POST /api/asisten-lomba/essay-idea
 * Generate essay ideas
 */
asistenLomba.post(
  '/essay-idea',
  featureAccessMiddleware('essay-idea-generator'),
  zValidator('json', essayIdeaSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      let prompt = `
Generate creative essay ideas:

Tema Utama: ${input.temaUtama}
Sub-Tema: ${input.subTema}
`;

      if (input.latarBelakang) {
        prompt += `\nLatar Belakang:\n${input.latarBelakang}`;
      }

      if (input.sertakanPenjelasan) {
        prompt += '\n\nInclude detailed explanations for each title.';
      }

      if (input.sertakanMetode) {
        prompt += '\n\nInclude suggested methods/technologies.';
      }

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('essayIdeaGenerator')
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
          ideas: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Essay idea generator error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate ideas',
        },
        500
      );
    }
  }
);

// ============================================
// KTI IDEA GENERATOR
// ============================================

const ktiIdeaSchema = z.object({
  temaUtama: z.string().min(1),
  subTema: z.string().min(1),
  latarBelakangUrgensi: z.boolean().optional(),
  penelitianTerdahulu: z.boolean().optional(),
  keterbaruan: z.boolean().optional(),
  successRate: z.boolean().optional(),
  langkahKonkret: z.boolean().optional(),
  efisiensi: z.boolean().optional(),
});

/**
 * POST /api/asisten-lomba/kti-idea
 * Generate KTI (scientific paper) ideas
 */
asistenLomba.post(
  '/kti-idea',
  featureAccessMiddleware('kti-idea-generator'),
  zValidator('json', ktiIdeaSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      let prompt = `
Generate innovative scientific paper (KTI) ideas:

Tema Utama: ${input.temaUtama}
Sub-Tema: ${input.subTema}

Include these components:
`;

      const components: string[] = [];
      if (input.latarBelakangUrgensi) components.push('Latar Belakang & Urgensi');
      if (input.penelitianTerdahulu) components.push('Penelitian Terdahulu');
      if (input.keterbaruan) components.push('Keterbaruan (Novelty)');
      if (input.successRate) components.push('Success Rate & Contoh Input/Output');
      if (input.langkahKonkret) components.push('Langkah Konkret');
      if (input.efisiensi) components.push('Efisiensi');

      prompt += components.length > 0 ? components.join(', ') : 'All key components';

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('ktiIdeaGenerator')
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
          ideas: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('KTI idea generator error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate ideas',
        },
        500
      );
    }
  }
);

// ============================================
// BUSINESS PLAN GENERATOR
// ============================================

const businessPlanSchema = z.object({
  deskripsiBisnis: z.string().min(1),
  ringkasanEksekutif: z.boolean().optional(),
  analisisPasar: z.boolean().optional(),
  strategiPemasaran: z.boolean().optional(),
  keuangan: z.boolean().optional(),
  analisisSWOT: z.boolean().optional(),
});

/**
 * POST /api/asisten-lomba/business-plan
 * Generate business plan
 */
asistenLomba.post(
  '/business-plan',
  featureAccessMiddleware('business-plan-generator'),
  zValidator('json', businessPlanSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      let prompt = `
Create a comprehensive business plan:

Deskripsi Bisnis:
${input.deskripsiBisnis}

Include these sections:
`;

      const sections: string[] = [];
      if (input.ringkasanEksekutif) sections.push('Ringkasan Eksekutif');
      if (input.analisisPasar) sections.push('Analisis Pasar');
      if (input.strategiPemasaran) sections.push('Strategi Pemasaran');
      if (input.keuangan) sections.push('Keuangan');
      if (input.analisisSWOT) sections.push('Analisis SWOT');

      prompt += sections.length > 0 ? sections.join(', ') : 'All key sections';

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('businessPlanGenerator')
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
          business_plan: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Business plan generator error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate business plan',
        },
        500
      );
    }
  }
);

export default asistenLomba;
