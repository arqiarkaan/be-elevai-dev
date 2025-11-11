import 'dotenv/config';

export const env = {
  // Google Gemini
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Midtrans
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',

  // App
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8000',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
};

// Validate required environment variables
function validateEnv() {
  const required = [
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missing.join(', ')}`
    );
    console.warn('Please check your .env file');
  }
}

validateEnv();
