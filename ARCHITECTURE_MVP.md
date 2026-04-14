# TripTalk Architecture And Roadmap

## Product Vision

TripTalk is not aiming to be a generic language-learning chatbot.

The product direction is an AI tandem for travel and cultural immersion:

- a user arrives and chooses a target language
- the app offers scenario-based practice and eventually a freer conversation mode
- the user talks to an AI partner with a specific cultural identity
- that partner should feel local, not generic: accent, expressions, social norms, and references should reflect a real place

The long-term vision is an animated avatar that users can speak with naturally. The core differentiation is cultural specificity. The value is not only "practice a language", but "experience a place through conversation before or without being there".

A key reference use case is preparing for Chile: not only learning Spanish, but becoming familiar with Chilean ways of speaking, local vocabulary, and the social feeling of everyday interaction before arrival.

## Product Model For The MVP

The product should not be modeled primarily around `target_language`.

For TripTalk, the main entry point is closer to a country or cultural context than to an abstract language choice. A user does not only want to "learn Spanish" or "learn English". They want to enter a specific conversational world: Chile, the US, Mexico, Spain, and eventually more precise local identities and personas inside those places.

For that reason, the MVP product model should be:

- `User`
- `ConversationContext`
- `Scenario`
- `ConversationSession`
- `Message`
- `Feedback`

### 1. User

This is the stable account-level data.

Recommended MVP fields:

- `id`
- `email`
- `display_name`
- `native_language`

Notes:

- `country` should not be modeled as a fixed global user property for now
- `level` should not be treated as a permanent global truth long term
- `target_language` is not the main product concept unless later product direction changes

### 2. ConversationContext

This is the main product differentiator.

It represents the cultural world, local identity, and conversational framing the user is entering.

Recommended MVP fields:

- `id`
- `country_id`
- `title`
- `language_code`
- `persona_name`
- `persona_role`
- `persona_style`
- `accent_label`
- `cultural_notes`
- `core_vocab`
- `is_active`

Examples:

- Chile / local friend / Santiago / casual Chilean Spanish
- USA / barista / New York / friendly American English
- Japan / host family member / Osaka / warm informal Japanese

Important note:

- a country alone may be enough for the first MVP
- but the longer-term product should evolve toward country + persona, not country alone

### 3. Scenario

Scenarios belong to a conversation context.

Recommended MVP fields:

- `id`
- `context_id`
- `slug`
- `title`
- `description`
- `difficulty`
- `system_prompt`
- `mode`
- `is_active`

Suggested `mode` values:

- `guided`
- `free`

This allows both:

- structured practice like airport, taxi, cafe, landlord, immigration
- open-ended conversation with a culturally situated AI partner

### 4. ConversationSession

This is the actual user conversation instance.

Recommended MVP fields:

- `id`
- `user_id`
- `context_id`
- `scenario_id` nullable for free mode
- `status`
- `level_at_start`
- `started_at`
- `ended_at`

Notes:

- `level` makes more sense here than as a permanent user property
- if needed, the user profile can still keep a default level temporarily
- the session should capture the actual level used at the start of the conversation

### 5. Message

Current shape is still broadly correct for the MVP.

Recommended MVP fields:

- `id`
- `session_id`
- `role`
- `content`
- `created_at`

Possible later extensions:

- audio file reference
- transcript segments
- pronunciation metadata
- correction metadata

### 6. Feedback

Feedback stays tied to a completed or ongoing session.

Recommended MVP fields:

- `id`
- `session_id`
- `global_score`
- `vocabulary_score`
- `fluency_score`
- `strengths`
- `improvements`
- `cultural_tip`
- `created_at`

## MVP User Flow

The product flow should evolve toward this:

1. User signs in
2. User optionally completes a lightweight profile
3. User chooses a country or cultural context
4. User chooses a guided scenario or free conversation mode
5. User optionally selects a level for this session
6. User talks with the AI partner
7. User receives feedback
8. User can later revisit conversation history

## Modeling Decisions

These are the working product decisions for now.

- `native_language` belongs to the user profile
- `country` is primarily a session or context choice, not a global user attribute
- `target_language` is not the core product concept for the current vision
- `level` should move toward session-level modeling, even if temporarily stored in the profile during MVP iteration
- the real differentiator is cultural specificity and persona design, not generic language tutoring

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

- [ ] Refine the country-first entry flow into a clearer country or cultural context selection model
- [ ] Proper user profile onboarding
- [ ] Real user-specific history screen
- [ ] Free conversation mode in addition to guided scenarios
- [ ] Better feedback quality and consistency
- [ ] Prompt refinement by level, country/context, scenario, and cultural persona
- [ ] Better UX around loading, retry, and empty states
- [ ] Session recovery if the browser reloads mid-conversation
- [ ] Better conversation controls than the current simple text chat
- [ ] Voice and avatar interaction path for the longer-term product direction

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
- [ ] define profile vs session model around target language, level, and conversation preferences
- [ ] add user conversation history screen
- [ ] improve feedback structure and prompt contracts

### Phase 3: Launch Preparation

- [ ] sharpen product positioning around cultural immersion and travel use cases
- [ ] create GitHub repository
- [ ] define environment variable checklist
- [ ] deploy backend
- [ ] deploy frontend
- [ ] choose production Postgres strategy
- [ ] set production CORS and callback URLs
- [ ] test full auth flow in production

## Recommended Immediate Next Steps

This is the order I recommend now:

1. Define the MVP product model: profile, target language, level, country, scenario, free mode
2. Add a real profile completion flow
3. Add a user history page
4. Improve backend logging and error handling
5. Add backend tests beyond healthcheck

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
