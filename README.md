# Study AI

AI-powered study platform that generates flashcards, summaries, and practice exams from uploaded documents.

## Features

- Upload PDFs/PowerPoints for AI-powered study material generation
- Auto-generated summaries, flashcards, and practice exams
- Manual deck creation
- Team collaboration with invite codes
- Public deck sharing

## Tech Stack

- Next.js, React, TypeScript
- SQLite + Drizzle ORM
- NextAuth.js
- OpenAI API
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.7+

### Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

### Environment Variables

Create a `.env.local` file in the root directory:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth secret key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional, for Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional, for Google sign-in) |
| `OPENAI_API_KEY` | OpenAI API key |

### Database Setup

```bash
npm run db:migrate
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Drizzle Studio |
