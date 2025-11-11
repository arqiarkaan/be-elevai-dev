// Database Types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  tokens: number;
  is_premium: boolean;
  premium_plan: string | null;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenLog {
  id: string;
  user_id: string;
  type: 'purchase' | 'bonus' | 'consume' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  transaction_id?: string;
  usage_log_id?: string;
  description?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  order_id: string;
  type: 'subscription' | 'tokens';
  item: string;
  amount: number;
  tokens_amount?: number;
  status: 'pending' | 'completed' | 'failed';
  snap_token?: string;
  created_at: string;
  completed_at?: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  feature_id: string;
  category: string;
  tokens_consumed: number;
  llm_tokens?: number;
  created_at: string;
}

// Feature Configuration Types
export interface FeatureConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  isPremium: boolean;
  tokenCost: number;
  endpoint: string;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

// Payment Types
export interface CreatePaymentRequest {
  type: 'subscription' | 'tokens';
  item: string;
  amount: number;
  tokens_amount?: number;
}

export interface MidtransNotification {
  transaction_status: string;
  order_id: string;
  gross_amount: string;
  signature_key: string;
  status_code: string;
  transaction_id: string;
  fraud_status?: string;
}

// LLM Types
export interface LLMResponse {
  content: string;
  tokens_used?: number;
}

// Feature Input Types
export interface IkigaiStage1Input {
  nama: string;
  jurusan: string;
  semester: number;
  universitas: string;
  karirSesuaiJurusan: 'ya_sesuai' | 'tidak_explore';
  mbtiType: string;
  viaStrengths: [string, string, string];
  careerRoles: [string, string, string];
}

export interface IkigaiStage2Input {
  stage1Data: IkigaiStage1Input;
  selectedIkigaiSpot: string;
  selectedSliceOfLife: string;
}

export interface SWOTAnalysisInput {
  mbtiType: string;
  viaStrengths: [string, string, string];
}

export interface EssayExchangesInput {
  programName: string;
  negaraUniversitas: string;
  motivasiAkademik: string;
  motivasiPribadi: string;
  skillPengalaman: string;
  rencanKontribusi: string;
}

export interface InterviewSimulationInput {
  namaPanggilan: string;
  cvFile?: Buffer;
  jenisInterview: 'beasiswa' | 'magang';
  bahasa?: 'english' | 'indonesia';
  namaBeasiswa?: string;
  posisiMagang?: string;
}

export interface InterviewAnswerInput {
  sessionId: string;
  questionNumber: number;
  answer: string;
}

export interface EssayIdeaGeneratorInput {
  temaUtama: string;
  subTema: string;
  latarBelakang?: string;
  sertakanPenjelasan?: boolean;
  sertakanMetode?: boolean;
}

export interface KTIIdeaGeneratorInput {
  temaUtama: string;
  subTema: string;
  latarBelakangUrgensi?: boolean;
  penelitianTerdahulu?: boolean;
  keterbaruan?: boolean;
  successRate?: boolean;
  langkahKonkret?: boolean;
  efisiensi?: boolean;
}

export interface BusinessPlanGeneratorInput {
  deskripsiBisnis: string;
  ringkasanEksekutif?: boolean;
  analisisPasar?: boolean;
  strategiPemasaran?: boolean;
  keuangan?: boolean;
  analisisSWOT?: boolean;
}

export interface InstagramBioStage1Input {
  bioContent: string;
  isImage?: boolean;
}

export interface InstagramBioStage2Input {
  stage1Data: InstagramBioStage1Input;
  analisisAwal: string;
  tujuanUtama: string;
  gayaTulisan: string;
  siapaKamu: string;
  targetAudiens: string;
  pencapaian: string[];
  callToAction: string;
  hashtag?: string;
}

export interface LinkedInProfileInput {
  targetOptimasi: 'headline' | 'summary';
  namaLengkap: string;
  jurusan: string;
  semester: number;
  targetKarir: 'sesuai_jurusan' | 'eksplorasi';
  tujuanUtama: 'mencari_karir' | 'personal_branding';
  targetRole: string;
  identitasProfesional: string;
  pencapaian: string[];
  skills: string[];
}

export interface PromptVeoInput {
  subjekUtama: string;
  aksiKegiatan: string;
  ekspresiEmosi: string;
  lokasiTempat: string;
  waktu: string;
  pencahayaan: string;
  gerakanKamera: string;
  gayaVideo: string;
  suasanaVideo: string;
  suaraMusik: string;
  dialog: string;
  detailTambahan: string;
}

export interface PromptEnhancerInput {
  type: 'topik_baru' | 'tugas' | 'konten' | 'rencana' | 'brainstorming' | 'koding';
  prompt: string;
}
