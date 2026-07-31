# QuickyNotes

AI-powered study platform that transforms lecture materials into flashcards, summaries, and practice exams.

Upload a PDF or PowerPoint, and QuickyNotes extracts the content and generates structured study materials via OpenAI. Decks can be shared publicly, organized into teams, or created manually without a file upload.

## Features

- **AI generation** — upload PDF or PPTX and generate summaries, flashcards, and practice exams
- **Manual decks** — create and edit flashcard decks without uploading a file
- **Team workspaces** — create teams, invite members via code, and share decks across a workspace
- **Public sharing** — generate a shareable link for any deck, no sign-in required to view
- **Auth** — email/password registration and Google OAuth, with password reset via email
- **Rate limiting** — per-endpoint limits on AI generation and uploads (Upstash Redis)
- **File storage** — Cloudflare R2 in production, local filesystem fallback for development
- **Error tracking** — Sentry with structured Pino logging and sensitive data redaction
- **Health check** — `/api/health` endpoint with optional detailed metrics behind a secret

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| Auth | NextAuth.js v5 (beta) + @auth/drizzle-adapter |
| AI | OpenAI API |
| File storage | Cloudflare R2 (S3-compatible) |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Error tracking | Sentry |
| Styling | Tailwind CSS v4 |
| Deployment | Docker + VPS (Nginx reverse proxy, Let's Encrypt SSL) |

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.8+ (for PDF/PPTX extraction)
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### Install Dependencies

```bash
npm install
pip install -r scripts/requirements.txt
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for session signing |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `STORAGE_PROVIDER` | No | `r2` or `local` (default: `local`) |
| `R2_ACCOUNT_ID` | If R2 | Cloudflare account ID |
| `R2_BUCKET_NAME` | If R2 | R2 bucket name |
| `R2_ACCESS_KEY_ID` | If R2 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | If R2 | R2 secret key |
| `RESEND_API_KEY` | No | Resend API key (for password reset emails) |
| `EMAIL_FROM` | No | Sender address for transactional emails |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL (rate limiting; skipped if unset) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `HEALTH_CHECK_SECRET` | No | Secret for detailed `/api/health` metrics |

### Database Setup

```bash
npm run db:migrate
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:run` | Run unit and integration tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:studio` | Open Drizzle Studio |

## Testing

314 tests across three layers:

- **Unit tests** (223) — validation schemas, storage utilities, security headers, rate limit config
- **Integration tests** (64) — API routes for auth, decks, and teams with a real database driver
- **E2E tests** (27) — full user flows via Playwright: auth, dashboard, deck operations, teams, sharing

```bash
npm run test:run      # unit + integration
npm run test:e2e      # end-to-end
```

## Deployment

The app ships as a Docker container behind an Nginx reverse proxy.

```bash
docker compose up -d --build
```

See `.env.example` for the full list of environment variables required in production. The Dockerfile uses a multi-stage build with a non-root user and a Python layer for PDF/PPTX extraction.

## License

MIT
