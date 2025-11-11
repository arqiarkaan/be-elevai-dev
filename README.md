# ElevAI Backend API

> Your No. 1 Holistic Student Development with Smart AI-Personalized

Backend API untuk platform SaaS berbasis AI yang membantu pengembangan holistik mahasiswa dengan personalisasi AI.

## 🚀 Tech Stack

- **Framework**: Hono.js
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **LLM**: Google Gemini (via Vercel AI SDK)
- **Payment**: Midtrans
- **Authentication**: Supabase Auth

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── env.ts       # Environment variables
│   ├── features.ts  # Feature definitions & pricing
│   └── prompts.ts   # LLM prompts
├── middleware/       # Middleware functions
│   ├── auth.ts      # Authentication middleware
│   ├── feature-access.ts  # Premium & token check
│   ├── cors.ts      # CORS configuration
│   ├── error-handler.ts   # Error handling
│   └── rate-limit.ts      # Rate limiting
├── routes/          # API routes
│   ├── payment.routes.ts
│   ├── user.routes.ts
│   ├── student-development.routes.ts
│   ├── asisten-lomba.routes.ts
│   ├── personal-branding.routes.ts
│   └── daily-tools.routes.ts
├── services/        # Business logic
│   ├── llm.service.ts      # LLM integration
│   └── payment.service.ts  # Payment processing
├── utils/           # Utility functions
│   ├── supabase.ts        # Supabase client & DB ops
│   ├── token-manager.ts   # Token management
│   └── helpers.ts         # Helper functions
├── types/           # TypeScript types
│   ├── index.ts     # Main types
│   └── hono.ts      # Hono context types
└── index.ts         # Application entry point
```

## 🎯 Features

### 1. Student Development (Premium)
- **Ikigai Self Discovery** - Menemukan sweet spot karir & bisnis (15 tokens)
- **SWOT Self-Analysis** - Analisis SWOT berbasis personality (10 tokens)
- **Essay Exchanges** - Generate essay program pertukaran (12 tokens)
- **Interview Simulation** - Simulasi interview dengan AI (20 tokens)

### 2. Asisten Lomba (Free)
- **Essay Idea Generator** - Generate ide essay kompetisi (5 tokens)
- **KTI Idea Generator** - Generate ide karya ilmiah (6 tokens)
- **Business Plan Generator** - Buat business plan lengkap (8 tokens)

### 3. Personal Branding (Premium)
- **Instagram Bio Analyzer** - Analisis & optimasi bio Instagram (8 tokens)
- **LinkedIn Profile Optimizer** - Optimasi headline/summary LinkedIn (10 tokens)

### 4. Daily Tools (Free)
- **Generator Prompt Veo** - Generate prompt untuk Veo video (3 tokens)
- **Prompt Enhancer** - Enhance prompt untuk berbagai kebutuhan (2 tokens each)
  - Mempelajari Topik Baru
  - Menyelesaikan Tugas
  - Membuat Konten
  - Membuat Rencana/Jadwal
  - Brainstorming Ide
  - Bantuan Koding/Teknis

## 💳 Pricing

### Subscription Plans
- **Monthly**: Rp 49.000 (200 tokens + akses semua fitur premium)
- **Yearly**: Rp 490.000 (2.500 tokens + akses semua fitur premium)

### Token Packages
- **50 Tokens**: Rp 15.000
- **150 Tokens**: Rp 40.000
- **350 Tokens**: Rp 85.000
- **1000 Tokens**: Rp 200.000

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) atau npm
- Supabase account
- Google Gemini API key
- Midtrans account

### 1. Clone & Install

```bash
git clone <repository-url>
cd be-elevai-dev
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` dan isi dengan credentials Anda:

```env
# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Midtrans
MIDTRANS_SERVER_KEY="your-server-key"
MIDTRANS_CLIENT_KEY="your-client-key"
MIDTRANS_IS_PRODUCTION="false"

# App Configuration
PORT="3000"
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Payment Webhook
WEBHOOK_SECRET="your-webhook-secret"
```

### 3. Database Setup

Jalankan SQL schema berikut di Supabase:

```sql
-- Sudah ada di GUIDE.md
-- profiles, token_logs, transactions, usage_logs tables
```

### 4. Run Development Server

```bash
pnpm dev
```

Server akan berjalan di `http://localhost:3000`

### 5. Build for Production

```bash
pnpm build
pnpm start
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

### Authentication
Semua protected endpoints memerlukan Bearer token dari Supabase:

```
Authorization: Bearer <supabase-jwt-token>
```

### Endpoints

#### Health & Info
- `GET /` - Root info
- `GET /health` - Health check
- `GET /features` - List semua fitur

#### Payment
- `GET /api/payment/plans` - Get subscription & token plans
- `POST /api/payment/create` - Create payment transaction
- `POST /api/payment/webhook` - Midtrans webhook (no auth)

#### User
- `GET /api/user/profile` - Get user profile
- `GET /api/user/tokens` - Get token balance & logs
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/usage` - Get feature usage stats
- `GET /api/user/subscription` - Get subscription status

#### Student Development
- `POST /api/student-development/ikigai/stage1` - Generate Ikigai spots
- `POST /api/student-development/ikigai/final` - Final Ikigai analysis
- `POST /api/student-development/swot` - SWOT analysis
- `POST /api/student-development/essay-exchanges` - Generate essay
- `POST /api/student-development/interview/start` - Start interview
- `POST /api/student-development/interview/answer` - Submit answer

#### Asisten Lomba
- `POST /api/asisten-lomba/essay-idea` - Generate essay ideas
- `POST /api/asisten-lomba/kti-idea` - Generate KTI ideas
- `POST /api/asisten-lomba/business-plan` - Generate business plan

#### Personal Branding
- `POST /api/personal-branding/instagram-bio/analyze` - Analyze bio
- `POST /api/personal-branding/instagram-bio/generate` - Generate bios
- `POST /api/personal-branding/linkedin-optimizer` - Optimize LinkedIn

#### Daily Tools
- `POST /api/daily-tools/prompt-veo` - Generate Veo prompt
- `POST /api/daily-tools/prompt-enhancer/topik-baru` - Enhance learning prompt
- `POST /api/daily-tools/prompt-enhancer/tugas` - Enhance task prompt
- `POST /api/daily-tools/prompt-enhancer/konten` - Enhance content prompt
- `POST /api/daily-tools/prompt-enhancer/rencana` - Enhance planning prompt
- `POST /api/daily-tools/prompt-enhancer/brainstorming` - Enhance brainstorming prompt
- `POST /api/daily-tools/prompt-enhancer/koding` - Enhance coding prompt

## 🔒 Security Features

- JWT authentication via Supabase
- Rate limiting on all API endpoints
- CORS protection
- Feature access control (premium/free)
- Token balance verification
- Webhook signature verification

## 🎨 Customization

### Adding New Features

1. Add feature config in `src/config/features.ts`
2. Create prompt in `src/config/prompts.ts`
3. Create route handler in appropriate routes file
4. Test with authentication and token management

### Modifying Prompts

Edit prompts in `src/config/prompts.ts`. Prompts dapat diupdate tanpa restart server (untuk development).

## 📊 Token Management

System menggunakan token-based usage:
1. User memiliki token balance
2. Setiap fitur mengkonsumsi sejumlah token
3. Premium users mendapat akses ke fitur premium + bonus tokens
4. Tokens dapat dibeli terpisah
5. Failed operations akan refund tokens

## 🐛 Error Handling

API menggunakan standard HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Insufficient Tokens
- `403` - Forbidden (Premium Required)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

Response format:
```json
{
  "success": true|false,
  "data": {},
  "error": "error message"
}
```

## 🚀 Deployment

### Recommended Platforms
- Vercel
- Railway
- Render
- Fly.io
- AWS/GCP/Azure

### Environment Variables
Pastikan semua environment variables di `.env.example` sudah di-set di platform deployment.

## 📝 Notes

- **LLM Prompts**: Prompts di `src/config/prompts.ts` adalah placeholder. Customize sesuai kebutuhan spesifik fitur.
- **PDF Parsing**: Feature interview simulation support CV upload (PDF). Pastikan pdf-parse terinstall dengan benar.
- **Session Storage**: Interview sessions menggunakan in-memory storage. Untuk production, gunakan Redis atau database.
- **Rate Limiting**: In-memory rate limiter. Untuk production scaling, gunakan Redis.

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 💬 Support

Untuk pertanyaan atau dukungan, silakan buka issue di repository ini.

---

Built with ❤️ using Hono.js, Supabase, and Google Gemini
