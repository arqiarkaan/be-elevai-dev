import type { FeatureConfig } from '../types/index.js';

export const FEATURES: Record<string, FeatureConfig> = {
  // Student Development (Premium)
  'ikigai-self-discovery': {
    id: 'ikigai-self-discovery',
    name: 'Ikigai Self Discovery',
    category: 'student-development',
    description: 'Discover your Ikigai sweet spot for career and business',
    isPremium: true,
    tokenCost: 2,
    endpoint: '/api/student-development/ikigai-self-discovery',
  },
  'swot-self-analysis': {
    id: 'swot-self-analysis',
    name: 'SWOT Self-Analysis',
    category: 'student-development',
    description: 'Comprehensive SWOT analysis based on personality traits',
    isPremium: true,
    tokenCost: 2,
    endpoint: '/api/student-development/swot-self-analysis',
  },
  'essay-exchanges': {
    id: 'essay-exchanges',
    name: 'Essay Exchanges',
    category: 'student-development',
    description: 'Generate compelling exchange program essays',
    isPremium: true,
    tokenCost: 2,
    endpoint: '/api/student-development/essay-exchanges',
  },
  'interview-simulation': {
    id: 'interview-simulation',
    name: 'Interview Simulation',
    category: 'student-development',
    description: 'Practice interviews with AI feedback',
    isPremium: true,
    tokenCost: 3,
    endpoint: '/api/student-development/interview-simulation',
  },

  // Asisten Lomba (Free)
  'essay-idea-generator': {
    id: 'essay-idea-generator',
    name: 'Essay Idea Generator',
    category: 'asisten-lomba',
    description: 'Generate creative essay ideas for competitions',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/asisten-lomba/essay-idea-generator',
  },
  'kti-idea-generator': {
    id: 'kti-idea-generator',
    name: 'KTI Idea Generator',
    category: 'asisten-lomba',
    description: 'Generate scientific paper ideas',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/asisten-lomba/kti-idea-generator',
  },
  'business-plan-generator': {
    id: 'business-plan-generator',
    name: 'Business Plan Generator',
    category: 'asisten-lomba',
    description: 'Create comprehensive business plans',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/asisten-lomba/business-plan-generator',
  },

  // Personal Branding (Premium)
  'instagram-bio-analyzer': {
    id: 'instagram-bio-analyzer',
    name: 'Instagram Bio Analyzer',
    category: 'personal-branding',
    description: 'Analyze and optimize your Instagram bio',
    isPremium: true,
    tokenCost: 3,
    endpoint: '/api/personal-branding/instagram-bio-analyzer',
  },
  'linkedin-profile-optimizer': {
    id: 'linkedin-profile-optimizer',
    name: 'LinkedIn Profile Optimizer',
    category: 'personal-branding',
    description: 'Optimize your LinkedIn headline and summary',
    isPremium: true,
    tokenCost: 3,
    endpoint: '/api/personal-branding/linkedin-profile-optimizer',
  },

  // Daily Tools (Free)
  'generator-prompt-veo': {
    id: 'generator-prompt-veo',
    name: 'Generator Prompt Veo',
    category: 'daily-tools',
    description: 'Generate optimized prompts for Veo video creation',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/generator-prompt-veo',
  },
  'prompt-enhancer-topik-baru': {
    id: 'prompt-enhancer-topik-baru',
    name: 'Prompt Enhancer - Mempelajari Topik Baru',
    category: 'daily-tools',
    description: 'Enhance prompts for learning new topics',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/prompt-enhancer/topik-baru',
  },
  'prompt-enhancer-tugas': {
    id: 'prompt-enhancer-tugas',
    name: 'Prompt Enhancer - Menyelesaikan Tugas',
    category: 'daily-tools',
    description: 'Enhance prompts for completing assignments',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/prompt-enhancer/tugas',
  },
  'prompt-enhancer-konten': {
    id: 'prompt-enhancer-konten',
    name: 'Prompt Enhancer - Membuat Konten',
    category: 'daily-tools',
    description: 'Enhance prompts for content creation',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/prompt-enhancer/konten',
  },
  'prompt-enhancer-rencana': {
    id: 'prompt-enhancer-rencana',
    name: 'Prompt Enhancer - Membuat Rencana/Jadwal',
    category: 'daily-tools',
    description: 'Enhance prompts for planning and scheduling',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/prompt-enhancer/rencana',
  },
  'prompt-enhancer-brainstorming': {
    id: 'prompt-enhancer-brainstorming',
    name: 'Prompt Enhancer - Brainstorming Ide',
    category: 'daily-tools',
    description: 'Enhance prompts for brainstorming ideas',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/prompt-enhancer/brainstorming',
  },
  'prompt-enhancer-koding': {
    id: 'prompt-enhancer-koding',
    name: 'Prompt Enhancer - Bantuan Koding/Teknis',
    category: 'daily-tools',
    description: 'Enhance prompts for coding and technical help',
    isPremium: false,
    tokenCost: 1,
    endpoint: '/api/daily-tools/prompt-enhancer/koding',
  },
};

export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Premium Monthly',
    duration: 'monthly',
    price: 39000,
    tokens: 30,
    description: 'Access all premium features + 30 tokens',
  },
  yearly: {
    name: 'Premium Yearly',
    duration: 'yearly',
    price: 390000,
    tokens: 150,
    description: 'Access all premium features + 150 tokens (Save 17%)',
  },
};

export const TOKEN_PACKAGES = {
  small: {
    name: '5 Tokens',
    amount: 5,
    price: 7495,
  },
  medium: {
    name: '10 Tokens',
    amount: 10,
    price: 9999,
  },
  large: {
    name: '50 Tokens',
    amount: 50,
    price: 44950,
  },
  xlarge: {
    name: '100 Tokens',
    amount: 100,
    price: 79900,
  },
};

export function getFeatureById(featureId: string): FeatureConfig | undefined {
  return FEATURES[featureId];
}

export function getFeaturesByCategory(category: string): FeatureConfig[] {
  return Object.values(FEATURES).filter((f) => f.category === category);
}

export function getAllFeatures(): FeatureConfig[] {
  return Object.values(FEATURES);
}
