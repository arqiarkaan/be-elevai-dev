import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { featureAccessMiddleware } from '../middleware/feature-access.js';
import { llmService } from '../services/llm.service.js';
import { ttsService } from '../services/tts.service.js';
import { TokenManager } from '../utils/token-manager.js';
import { getPrompt, fillPrompt } from '../config/prompts.js';
import { generateSessionId } from '../utils/helpers.js';
import { extractPDFFromRequest } from '../utils/pdf-parser.js';
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
Profil User:
- Nama: ${input.nama}
- Jurusan: ${input.jurusan}
- Semester: ${input.semester}
- Universitas: ${input.universitas}
- Ingin Karir Sesuai Jurusan: ${
        input.karirSesuaiJurusan === 'ya_sesuai' ? 'Ya' : 'Tidak, ingin explore'
      }
- MBTI: ${input.mbtiType}
- VIA Strengths: ${input.viaStrengths.join(', ')}
- Career Roles: ${input.careerRoles.join(', ')}

Buatkan 5 Ikigai Spots dan 5 Slice of Life Purposes.
`;

      // Generate spots
      const spots = await llmService.generateArray(
        prompt + '\nBuatkan 5 Ikigai career spots dengan title dan deskripsi.',
        getPrompt('ikigai.generateSpots'),
        5
      );

      // Validate spots structure
      if (!Array.isArray(spots) || spots.length !== 5) {
        throw new Error('Invalid spots response from LLM');
      }

      // Ensure each spot has required fields
      spots.forEach((spot: any, index: number) => {
        if (!spot.title || !spot.description) {
          throw new Error(`Spot ${index + 1} missing required fields`);
        }
      });

      // Generate purposes
      const purposes = await llmService.generateArray(
        prompt + '\nBuatkan 5 Slice of Life Purpose statements.',
        getPrompt('ikigai.generatePurposes'),
        5
      );

      // Validate purposes structure
      if (!Array.isArray(purposes) || purposes.length !== 5) {
        throw new Error('Invalid purposes response from LLM');
      }

      // Ensure each purpose has required field
      purposes.forEach((purpose: any, index: number) => {
        if (!purpose.statement) {
          throw new Error(`Purpose ${index + 1} missing statement field`);
        }
      });

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
Analisis Ikigai Lengkap untuk ${stage1Data.nama}

Profil:
- Jurusan: ${stage1Data.jurusan}
- Semester: ${stage1Data.semester}
- Universitas: ${stage1Data.universitas}
- MBTI: ${stage1Data.mbtiType}
- VIA Strengths: ${stage1Data.viaStrengths.join(', ')}
- Career Roles: ${stage1Data.careerRoles.join(', ')}

Ikigai Spot yang Dipilih: ${selectedIkigaiSpot}
Life Purpose yang Dipilih: ${selectedSliceOfLife}

Berikan analisis komprehensif tentang sweet spot mereka untuk karir dan bisnis.
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
          stage1_data: stage1Data,
          analysis: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('Ikigai final error:', error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate analysis',
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
Lakukan Analisis SWOT:
- Tipe MBTI: ${input.mbtiType}
- VIA Character Strengths: ${input.viaStrengths.join(', ')}

Berikan analisis SWOT komprehensif yang mencakup Strengths, Weaknesses, Opportunities, dan Threats.
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
          user_input: {
            mbtiType: input.mbtiType,
            viaStrengths: input.viaStrengths,
          },
          analysis: response.content,
          tokens_used: response.tokens_used,
        },
      });
    } catch (error) {
      console.error('SWOT analysis error:', error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate analysis',
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
          error:
            error instanceof Error ? error.message : 'Failed to generate essay',
        },
        500
      );
    }
  }
);

// ============================================
// INTERVIEW SIMULATION
// ============================================

/**
 * POST /api/student-development/interview/upload-cv
 * Upload and extract text from CV PDF
 */
studentDev.post('/interview/upload-cv', authMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody();

    // Extract text from PDF
    const cvText = await extractPDFFromRequest(body);

    if (!cvText) {
      return c.json(
        {
          success: false,
          error: 'No CV file provided or invalid PDF',
        },
        400
      );
    }

    return c.json({
      success: true,
      data: {
        cv_text: cvText,
      },
    });
  } catch (error) {
    console.error('CV upload error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process CV',
      },
      500
    );
  }
});

// In-memory store for interview sessions (Redis for production)
const interviewSessions = new Map<string, any>();

const interviewStartSchema = z
  .object({
    namaPanggilan: z.string().min(1),
    cvContent: z.string().optional(), // CV text content (extracted from PDF)
    jenisInterview: z.enum(['beasiswa', 'magang']),
    bahasa: z.enum(['english', 'indonesia']).optional(),
    namaBeasiswa: z.string().optional(),
    posisiMagang: z.string().optional(),
  })
  .refine(
    (data) => {
      // If beasiswa, bahasa and namaBeasiswa are required
      if (data.jenisInterview === 'beasiswa') {
        return data.bahasa && data.namaBeasiswa;
      }
      // If magang, posisiMagang is required
      if (data.jenisInterview === 'magang') {
        return data.posisiMagang;
      }
      return true;
    },
    {
      message:
        'Invalid input: beasiswa requires bahasa and namaBeasiswa, magang requires posisiMagang',
    }
  );

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
        bahasa:
          input.jenisInterview === 'beasiswa' ? input.bahasa : 'indonesia',
        details:
          input.jenisInterview === 'beasiswa'
            ? input.namaBeasiswa
            : input.posisiMagang,
        cvContent: input.cvContent,
      };

      let prompt = `
Buatkan pertanyaan interview PERTAMA untuk:
- Nama Kandidat: ${input.namaPanggilan}
- Tipe Interview: ${input.jenisInterview === 'beasiswa' ? 'Beasiswa' : 'Magang'}
- Bahasa: ${context.bahasa === 'english' ? 'English' : 'Bahasa Indonesia'}
- ${
        input.jenisInterview === 'beasiswa'
          ? `Nama Beasiswa: ${input.namaBeasiswa}`
          : `Posisi Magang: ${input.posisiMagang}`
      }

KHUSUS PERTANYAAN PERTAMA: 
- WAJIB panggil nama "${
        input.namaPanggilan
      }" di dalam pertanyaan untuk ice breaker dan kesan personal
- Gunakan info beasiswa/posisi yang SPESIFIK (${
        context.details
      }) tanpa placeholder
- Pertanyaan harus complete dan siap digunakan
- Buat opening yang warm dan welcoming
`;

      if (input.cvContent) {
        prompt += `\n- CV/Resume Kandidat:\n${input.cvContent}\n`;
      }

      const systemPrompt = fillPrompt(
        getPrompt('interviewSimulation.generateQuestion'),
        {
          type: input.jenisInterview === 'beasiswa' ? 'beasiswa' : 'magang',
        }
      );

      const response = await llmService.generateResponse(prompt, systemPrompt);

      // Generate audio for the question
      let audioBase64: string | undefined;
      try {
        // Use appropriate voice based on language
        if (context.bahasa === 'english') {
          audioBase64 = await ttsService.textToSpeechEnglish(response.content);
        } else {
          audioBase64 = await ttsService.textToSpeechIndonesian(
            response.content
          );
        }
      } catch (audioError) {
        console.error('TTS error (non-blocking):', audioError);
        // Continue without audio if TTS fails
      }

      // Store session
      interviewSessions.set(sessionId, {
        userId: user.id,
        userName: input.namaPanggilan, // Store user's preferred name
        context,
        qa: [{ question: response.content, answer: null }],
        createdAt: Date.now(),
      });

      return c.json({
        success: true,
        data: {
          session_id: sessionId,
          question: response.content,
          question_audio: audioBase64, // Base64 encoded MP3 audio
          question_number: 1,
          total_questions: 5,
        },
      });
    } catch (error) {
      console.error('Interview start error:', error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to start interview',
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
          .map(
            (qa: any, i: number) =>
              `Q${i + 1}: ${qa.question}\nA${i + 1}: ${
                qa.answer || 'Not answered yet'
              }`
          )
          .join('\n\n');

        const prompt = `
Context Interview:
- Tipe Interview: ${session.context.type === 'beasiswa' ? 'Beasiswa' : 'Magang'}
- Detail: ${session.context.details}
- Bahasa: ${
          session.context.bahasa === 'english' ? 'English' : 'Bahasa Indonesia'
        }

Riwayat Q&A Sebelumnya:
${qaHistory}

Buatkan pertanyaan ${input.questionNumber + 1} dari 5.

PENTING: 
- JANGAN panggil nama kandidat (sudah dipanggil di pertanyaan pertama saja)
- JANGAN gunakan placeholder seperti "{bidang studi}", "[your field]", dll
- Gunakan info spesifik yang sudah ada (${session.context.details})
- Pertanyaan harus complete dan siap digunakan
- Pertanyaan langsung to the point, professional
`;

        const systemPrompt = fillPrompt(
          getPrompt('interviewSimulation.generateQuestion'),
          {
            type: session.context.type,
          }
        );

        const response = await llmService.generateResponse(
          prompt,
          systemPrompt
        );

        // Generate audio for the next question
        let audioBase64: string | undefined;
        try {
          // Use appropriate voice based on language
          if (session.context.bahasa === 'english') {
            audioBase64 = await ttsService.textToSpeechEnglish(
              response.content
            );
          } else {
            audioBase64 = await ttsService.textToSpeechIndonesian(
              response.content
            );
          }
        } catch (audioError) {
          console.error('TTS error (non-blocking):', audioError);
          // Continue without audio if TTS fails
        }

        session.qa.push({ question: response.content, answer: null });

        return c.json({
          success: true,
          data: {
            question: response.content,
            question_audio: audioBase64, // Base64 encoded MP3 audio
            question_number: input.questionNumber + 1,
            total_questions: 5,
          },
        });
      }

      // Last question answered - generate evaluation
      const qaHistory = session.qa
        .map(
          (qa: any, i: number) =>
            `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`
        )
        .join('\n\n');

      const evaluationPrompt = `
Transkrip Interview Lengkap:
${qaHistory}

Berikan evaluasi komprehensif.
`;

      const evaluation = await llmService.generateResponse(
        evaluationPrompt,
        getPrompt('interviewSimulation.generateEvaluation')
      );

      // Generate audio for evaluation
      let evaluationAudioBase64: string | undefined;
      try {
        // Use appropriate voice based on language
        if (session.context.bahasa === 'english') {
          evaluationAudioBase64 = await ttsService.textToSpeechEnglish(
            evaluation.content
          );
        } else {
          evaluationAudioBase64 = await ttsService.textToSpeechIndonesian(
            evaluation.content
          );
        }
      } catch (audioError) {
        console.error('TTS error for evaluation (non-blocking):', audioError);
        // Continue without audio if TTS fails
      }

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
          evaluation_audio: evaluationAudioBase64, // Base64 encoded MP3 audio
          tokens_used: evaluation.tokens_used,
        },
      });
    } catch (error) {
      console.error('Interview answer error:', error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to process answer',
        },
        500
      );
    }
  }
);

export default studentDev;
