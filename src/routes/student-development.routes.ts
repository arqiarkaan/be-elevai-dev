import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { featureAccessMiddleware } from '../middleware/feature-access.js';
import { llmService } from '../services/llm.service.js';
import { TokenManager } from '../utils/token-manager.js';
import { getPrompt, fillPrompt } from '../config/prompts.js';
import { generateSessionId } from '../utils/helpers.js';
import type { Variables } from '../types/hono.js';
import type { AuthUser, FeatureConfig } from '../types/index.js';

const studentDev = new Hono<{ Variables: Variables }>();

// All routes require authentication
studentDev.use('*', authMiddleware);

// ============================================
// IKIGAI SELF DISCOVERY
// ============================================

const ikigaiStage1Schema = z.object({
  nama: z.string().min(1),
  jurusan: z.string().min(1),
  semester: z.number().int().positive(),
  universitas: z.string().min(1),
  karirSesuaiJurusan: z.enum(['ya_sesuai', 'tidak_explore']),
  mbtiType: z.string().length(4),
  viaStrengths: z.array(z.string()).length(3),
  careerRoles: z.array(z.string()).length(3),
});

const ikigaiStage2Schema = z.object({
  stage1Data: ikigaiStage1Schema,
  selectedIkigaiSpot: z.string(),
  selectedSliceOfLife: z.string(),
});

/**
 * POST /api/student-development/ikigai/stage1
 * Generate Ikigai spots and life purposes
 */
studentDev.post(
  '/ikigai/stage1',
  featureAccessMiddleware('ikigai-self-discovery'),
  zValidator('json', ikigaiStage1Schema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const prompt = `
User Profile:
- Nama: ${input.nama}
- Jurusan: ${input.jurusan}
- Semester: ${input.semester}
- Universitas: ${input.universitas}
- Ingin Karir Sesuai Jurusan: ${input.karirSesuaiJurusan === 'ya_sesuai' ? 'Ya' : 'Tidak, ingin explore'}
- MBTI: ${input.mbtiType}
- VIA Strengths: ${input.viaStrengths.join(', ')}
- Career Roles: ${input.careerRoles.join(', ')}

Generate 5 Ikigai Spots and 5 Slice of Life Purposes.
`;

      // Generate spots
      const spots = await llmService.generateArray(
        prompt + '\nGenerate 5 Ikigai career spots with title and description.',
        getPrompt('ikigai.generateSpots'),
        5
      );

      // Generate purposes
      const purposes = await llmService.generateArray(
        prompt + '\nGenerate 5 Slice of Life Purpose statements.',
        getPrompt('ikigai.generatePurposes'),
        5
      );

      // Consume tokens (half cost for stage 1)
      await TokenManager.consumeTokens(
        user.id,
        feature.id,
        feature.category,
        Math.floor(feature.tokenCost / 2)
      );

      return c.json({
        success: true,
        data: {
          ikigai_spots: spots,
          life_purposes: purposes,
        },
      });
    } catch (error) {
      console.error('Ikigai stage 1 error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate',
        },
        500
      );
    }
  }
);

/**
 * POST /api/student-development/ikigai/final
 * Generate final Ikigai analysis
 */
studentDev.post(
  '/ikigai/final',
  featureAccessMiddleware('ikigai-self-discovery'),
  zValidator('json', ikigaiStage2Schema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const { stage1Data, selectedIkigaiSpot, selectedSliceOfLife } = input;

      const prompt = `
Complete Ikigai Analysis for ${stage1Data.nama}

Profile:
- Jurusan: ${stage1Data.jurusan}
- Semester: ${stage1Data.semester}
- Universitas: ${stage1Data.universitas}
- MBTI: ${stage1Data.mbtiType}
- VIA Strengths: ${stage1Data.viaStrengths.join(', ')}
- Career Roles: ${stage1Data.careerRoles.join(', ')}

Selected Ikigai Spot: ${selectedIkigaiSpot}
Selected Life Purpose: ${selectedSliceOfLife}

Provide comprehensive analysis of their sweet spot for career and business.
`;

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('ikigai.finalAnalysis')
      );

      // Consume remaining tokens
      await TokenManager.consumeTokens(
        user.id,
        feature.id,
        feature.category,
        Math.ceil(feature.tokenCost / 2),
        response.tokens_used
      );

      return c.json({
        success: true,
        data: {
          analysis: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Ikigai final error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate analysis',
        },
        500
      );
    }
  }
);

// ============================================
// SWOT SELF-ANALYSIS
// ============================================

const swotSchema = z.object({
  mbtiType: z.string().length(4),
  viaStrengths: z.array(z.string()).length(3),
});

/**
 * POST /api/student-development/swot
 * Generate SWOT analysis
 */
studentDev.post(
  '/swot',
  featureAccessMiddleware('swot-self-analysis'),
  zValidator('json', swotSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const prompt = `
Perform SWOT Analysis:
- MBTI Type: ${input.mbtiType}
- VIA Character Strengths: ${input.viaStrengths.join(', ')}

Provide comprehensive SWOT analysis covering Strengths, Weaknesses, Opportunities, and Threats.
`;

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('swotAnalysis')
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
          analysis: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('SWOT analysis error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate analysis',
        },
        500
      );
    }
  }
);

// ============================================
// ESSAY EXCHANGES
// ============================================

const essayExchangesSchema = z.object({
  programName: z.string().min(1),
  negaraUniversitas: z.string().min(1),
  motivasiAkademik: z.string().min(1),
  motivasiPribadi: z.string().min(1),
  skillPengalaman: z.string().min(1),
  rencanKontribusi: z.string().min(1),
});

/**
 * POST /api/student-development/essay-exchanges
 * Generate exchange program essay
 */
studentDev.post(
  '/essay-exchanges',
  featureAccessMiddleware('essay-exchanges'),
  zValidator('json', essayExchangesSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const prompt = `
Create Exchange Program Essay:

Program: ${input.programName}
Destination: ${input.negaraUniversitas}

Motivasi Akademik:
${input.motivasiAkademik}

Motivasi Pribadi & Kultural:
${input.motivasiPribadi}

Skill & Pengalaman:
${input.skillPengalaman}

Rencana Kontribusi:
${input.rencanKontribusi}
`;

      const response = await llmService.generateResponse(
        prompt,
        getPrompt('essayExchanges')
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
          essay: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Essay exchanges error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate essay',
        },
        500
      );
    }
  }
);

// ============================================
// INTERVIEW SIMULATION
// ============================================

// In-memory store for interview sessions (consider Redis for production)
const interviewSessions = new Map<string, any>();

const interviewStartSchema = z.object({
  namaPanggilan: z.string().min(1),
  jenisInterview: z.enum(['beasiswa', 'magang']),
  bahasa: z.enum(['english', 'indonesia']).optional(),
  namaBeasiswa: z.string().optional(),
  posisiMagang: z.string().optional(),
});

const interviewAnswerSchema = z.object({
  sessionId: z.string(),
  questionNumber: z.number().int().min(1).max(5),
  answer: z.string().min(1),
});

/**
 * POST /api/student-development/interview/start
 * Start interview simulation
 */
studentDev.post(
  '/interview/start',
  featureAccessMiddleware('interview-simulation'),
  zValidator('json', interviewStartSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const input = c.req.valid('json');

    try {
      const sessionId = generateSessionId();

      const context = {
        type: input.jenisInterview,
        bahasa: input.bahasa || 'indonesia',
        details:
          input.jenisInterview === 'beasiswa'
            ? input.namaBeasiswa
            : input.posisiMagang,
      };

      const prompt = `
Generate first interview question for:
- Name: ${input.namaPanggilan}
- Type: ${input.jenisInterview}
- Language: ${context.bahasa}
- Details: ${context.details}
`;

      const systemPrompt = fillPrompt(getPrompt('interviewSimulation.generateQuestion'), {
        type: input.jenisInterview,
      });

      const response = await llmService.generateResponse(prompt, systemPrompt);

      // Store session
      interviewSessions.set(sessionId, {
        userId: user.id,
        context,
        qa: [{ question: response.content, answer: null }],
        createdAt: Date.now(),
      });

      return c.json({
        success: true,
        data: {
          session_id: sessionId,
          question: response.content,
          question_number: 1,
          total_questions: 5,
        },
      });
    } catch (error) {
      console.error('Interview start error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start interview',
        },
        500
      );
    }
  }
);

/**
 * POST /api/student-development/interview/answer
 * Submit answer and get next question
 */
studentDev.post(
  '/interview/answer',
  featureAccessMiddleware('interview-simulation'),
  zValidator('json', interviewAnswerSchema),
  async (c) => {
    const user = c.get('user') as AuthUser;
    const feature = c.get('feature') as FeatureConfig;
    const input = c.req.valid('json');

    try {
      const session = interviewSessions.get(input.sessionId);

      if (!session || session.userId !== user.id) {
        return c.json({ success: false, error: 'Invalid session' }, 404);
      }

      // Store answer
      session.qa[input.questionNumber - 1].answer = input.answer;

      // If not the last question, generate next one
      if (input.questionNumber < 5) {
        const qaHistory = session.qa
          .map((qa: any, i: number) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer || 'Not answered yet'}`)
          .join('\n\n');

        const prompt = `
Previous Q&A:
${qaHistory}

Generate question ${input.questionNumber + 1} of 5.
`;

        const systemPrompt = fillPrompt(getPrompt('interviewSimulation.generateQuestion'), {
          type: session.context.type,
        });

        const response = await llmService.generateResponse(prompt, systemPrompt);

        session.qa.push({ question: response.content, answer: null });

        return c.json({
          success: true,
          data: {
            question: response.content,
            question_number: input.questionNumber + 1,
            total_questions: 5,
          },
        });
      }

      // Last question answered - generate evaluation
      const qaHistory = session.qa
        .map((qa: any, i: number) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
        .join('\n\n');

      const evaluationPrompt = `
Complete Interview Transcript:
${qaHistory}

Provide comprehensive evaluation.
`;

      const evaluation = await llmService.generateResponse(
        evaluationPrompt,
        getPrompt('interviewSimulation.generateEvaluation')
      );

      // Consume tokens
      await TokenManager.consumeTokens(
        user.id,
        feature.id,
        feature.category,
        feature.tokenCost,
        evaluation.tokens_used
      );

      // Clean up session
      interviewSessions.delete(input.sessionId);

      return c.json({
        success: true,
        data: {
          completed: true,
          qa_history: session.qa,
          evaluation: evaluation.content,
          tokens_used: evaluation.tokens_used,
        },
      });
    } catch (error) {
      console.error('Interview answer error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process answer',
        },
        500
      );
    }
  }
);

export default studentDev;
