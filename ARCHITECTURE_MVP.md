# TripTalk Architecture And Roadmap

## Current Status

TripTalk is now a working MVP foundation.

The product currently supports:

- React/Vite frontend
- FastAPI backend
- PostgreSQL with SQLAlchemy
- Alembic migrations
- Supabase Auth on the frontend
- JWT verification on the backend using Supabase JWKS
- OpenAI-backed conversation replies
- persisted sessions, messages, and feedback

The codebase is no longer just a generated UI mock. The main product loop works end to end.

## Implemented

### Product Flow

- [x] Splash and onboarding flow
- [x] Country selection
- [x] Scenario selection
- [x] Conversation session creation
- [x] Message sending from frontend to backend
- [x] AI response generation from backend
- [x] Conversation history reload
- [x] Feedback generation and display

### Frontend

- [x] Cleaned unused generated UI kit
- [x] Connected country list to backend
- [x] Connected scenario list to backend
- [x] Replaced fake microphone flow with text input
- [x] Added API helper layer with auth token injection
- [x] Added Supabase client setup
- [x] Added auth screen for sign in / sign up
- [x] Renamed product branding to `TripTalk`

### Backend

- [x] FastAPI project scaffold
- [x] SQLAlchemy models
- [x] Alembic initial migration
- [x] Seed command for reference data
- [x] Repository structure
- [x] Conversation session persistence
- [x] Message persistence
- [x] Feedback persistence
- [x] OpenAI integration for replies
- [x] OpenAI-backed feedback generation with fallback
- [x] Supabase JWT verification

### Infra / Auth

- [x] Local PostgreSQL via Docker
- [x] Supabase project created
- [x] Supabase frontend authentication flow
- [x] Backend verification of Supabase access tokens
- [x] Working authenticated user flow

## Current Stack

### Frontend

- React
- Vite
- Tailwind CSS v4
- Supabase JS client

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- OpenAI API

### Auth

- Supabase Auth
- JWT verification against Supabase JWKS

## Current Project Structure

### Frontend

- `src/`
- `src/components/`
- `src/lib/api.ts`
- `src/lib/supabase.ts`

### Backend

- `api/app/main.py`
- `api/app/api/`
- `api/app/core/`
- `api/app/models/`
- `api/app/schemas/`
- `api/app/repositories/`
- `api/app/services/`
- `api/alembic/`
- `api/tests/`

## Known Technical Debt

This is the cleanup block we should address next.

- [x] Remove `__pycache__` and generated Python artifacts from the repo
- [x] Add `.gitignore` for Python, Vite, env files, build outputs, egg-info, caches
- [x] Remove leftover generated build artifacts from versioned source control if present
- [x] Centralize frontend types for API payloads and responses
- [x] Centralize repeated frontend constants and country/scenario presentation mapping
- [x] Introduce clearer API service modules instead of scattered fetch logic
- [ ] Improve backend error handling and logging
- [ ] Replace broad exception handling around AI calls with more explicit handling
- [ ] Tighten typing around backend service and repository boundaries
- [x] Decide whether to keep or remove placeholder service files that are still mostly empty
- [ ] Add backend tests beyond the healthcheck
- [ ] Add frontend smoke tests later if worth it

## Product Gaps

These are not blockers for local development, but they matter before launch.

- [ ] Proper user profile onboarding
- [ ] Real user-specific history screen
- [ ] Better feedback quality and consistency
- [ ] Prompt refinement by level, target language, and scenario
- [ ] Better UX around loading, retry, and empty states
- [ ] Session recovery if the browser reloads mid-conversation
- [ ] Better conversation controls than the current simple text chat

## Suggested Roadmap

### Phase 1: Technical Cleanup

- [x] Add `.gitignore`
- [x] remove tracked generated files and caches
- [x] clean backend placeholders
- [x] reorganize frontend API access
- [ ] improve naming consistency and comments
- [x] add a short developer setup guide

### Phase 2: Core Product Hardening

- [ ] remove or restrict `DEV_MODE`
- [ ] ensure all session and message ownership is tied to authenticated users
- [ ] add `/me` and profile completion flow
- [ ] add user conversation history screen
- [ ] improve feedback structure and prompt contracts

### Phase 3: Launch Preparation

- [ ] create GitHub repository
- [ ] define environment variable checklist
- [ ] deploy backend
- [ ] deploy frontend
- [ ] choose production Postgres strategy
- [ ] set production CORS and callback URLs
- [ ] test full auth flow in production

## Recommended Immediate Next Steps

This is the order I recommend now:

1. Refactor backend auth / user flow slightly
2. Add a user history page
3. Improve backend logging and error handling
4. Add backend tests beyond healthcheck
5. Improve naming consistency and comments

## Environment Variables

### Frontend

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend

- `APP_NAME`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET` optional if using legacy shared secret
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Launch Definition

For this MVP, I would consider the app launchable when:

- auth is stable
- conversations are saved per user
- feedback is reliable enough
- history page exists
- repo is clean and reproducible
- production deployment is working

At this point, we are not at launch-ready quality yet, but the technical foundation is now real and solid.
