# TripTalk Architecture And Roadmap

## Product Vision

TripTalk is not aiming to be a generic language-learning chatbot.

The product direction is an AI tandem for travel and cultural immersion:

- a user arrives and chooses a country
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
- `UserLanguageLevel`
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
- `level` should not be treated as a permanent global truth across all languages
- `target_language` is not the main entry concept unless later product direction changes

### 2. UserLanguageLevel

This stores the user's level per language.

Recommended MVP fields:

- `id`
- `user_id`
- `language_code`
- `level`
- `updated_at`

Examples:

- Spanish: intermediate
- English: advanced
- Japanese: beginner

Notes:

- level belongs more naturally to a language than to the user globally
- when a session starts, the app can preload the stored level for the scenario language
- the user should still be allowed to adjust that level before entering the conversation

### 3. Scenario

Scenarios belong to a country and define the actual language used in the conversation.

Recommended MVP fields:

- `id`
- `country_id`
- `slug`
- `title`
- `description`
- `language_code`
- `difficulty`
- `system_prompt`
- `mode`
- `intro_message`
- `cultural_tip`
- `vocabulary_hints`
- `partner_name`
- `partner_role`
- `is_active`

Suggested `mode` values:

- `guided`
- `free`

This allows both:

- structured practice like airport, taxi, cafe, landlord, immigration
- open-ended conversation with a culturally situated AI partner

Important note:

- the country is the entry point
- the scenario determines the actual language of the session
- this is important for multilingual countries where different scenarios may use different languages

### 4. ConversationSession

This is the actual user conversation instance.

Recommended MVP fields:

- `id`
- `user_id`
- `country_id`
- `scenario_id`
- `language_code`
- `status`
- `level_at_start`
- `started_at`
- `ended_at`

Notes:

- `scenario_id` can still represent a free conversation scenario
- free mode does not need a separate top-level entity if it is modeled as a scenario with `mode=free`
- `level_at_start` captures the actual level used for this session
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
2. User lands on `Explorer`
3. User chooses a country
4. User chooses a scenario for that country
5. The app determines the scenario language
6. The app preloads the user's saved level for that language
7. User can adjust the level for this session
8. User enters a guided or free conversation
9. User receives feedback
10. User can later revisit conversation history

## Desktop UI Direction

The product should now evolve from a linear fullscreen flow into a desktop-oriented application shell with persistent navigation.

The current step-by-step MVP was useful to validate the product loop, but it is no longer the right long-term UI structure for a navigable app.

### App Shell

The desktop MVP should use a shared application shell with:

- a persistent top navigation bar
- a central content area
- visible authenticated user context
- clear entry points to the main product sections

Recommended top bar items:

- `TripTalk`
- `Explorer`
- `Historique`
- `Profil`
- primary action `Nouvelle conversation`
- user email / avatar / sign out

### Main Product Sections

The desktop MVP should organize the app into four main sections:

#### 1. Explorer

This becomes the main landing page after sign-in.

Purpose:

- choose a country
- browse available scenarios for that country
- understand scenario language and mode
- start a new conversation

Expected content:

- country selection area
- scenario list
- badges for `guided` / `free`
- scenario language
- lightweight session preparation before starting

#### 2. Conversation

This becomes the page for an active session.

Recommended layout:

- left panel: partner, role, country, language, scenario, mode
- center panel: conversation thread and composer
- right panel: cultural tip, vocabulary, goal, context

#### 3. Historique

This becomes a first-class section of the app.

Purpose:

- review past sessions
- reopen conversations
- revisit feedback

Expected content:

- list of past sessions
- country
- scenario
- language
- mode
- date
- level used
- last message preview
- feedback availability

#### 4. Profil

This becomes the home for account and learning preferences.

Recommended MVP content:

- email
- display name
- native language
- per-language levels

Optional later additions:

- voice preferences
- avatar preferences
- learning goals

### Session Preparation

The user should prepare the session after scenario selection, not during a generic onboarding step.

Recommended preparation step:

- selected country
- selected scenario
- detected scenario language
- user's saved level for that language
- ability to adjust level before starting
- start conversation CTA

### Onboarding Direction

The existing onboarding should be reduced over time.

Recommended direction:

- keep auth
- keep a lightweight profile completion step if needed
- remove mandatory linear onboarding steps that block normal navigation
- send signed-in users to `Explorer` as the default home

### Implementation Order For The UI Refactor

Recommended order:

1. Create a shared desktop `AppShell`
2. Add top navigation and app-level route/state handling
3. Turn country/scenario/level flow into `Explorer`
4. Add a real `Profil` page
5. Keep `Conversation` and `Historique` inside the shared shell
6. Reduce or remove the older fullscreen onboarding flow

Current status:

- [x] Shared desktop `AppShell`
- [x] Top navigation and app-level route/state handling
- [x] `Explorer` page replacing the older selection wizard
- [x] `Profil` page
- [x] `Conversation` and `Historique` inside the shared shell
- [x] Older fullscreen onboarding flow removed from the active UI

## Modeling Decisions

These are the working product decisions for now.

- `native_language` belongs to the user profile
- `country` is the main entry point of the experience
- `scenario` belongs to a country and defines the actual session language
- `target_language` is not the core entry concept for the current vision
- `level` should be modeled per language, then captured again at session start
- a free conversation should be modeled as a scenario with `mode=free`
- the real differentiator is cultural specificity inside scenarios, not generic language tutoring

## Current Status

TripTalk is now a working MVP foundation.

The product currently supports:

- React/Vite frontend
- FastAPI backend
- PostgreSQL with SQLAlchemy
- Alembic migrations
- Supabase Auth on the frontend
- JWT verification on the backend using Supabase JWKS
- per-language user level persistence
- scenario language and mode metadata
- scenario content fields for intro/cultural context
- OpenAI-backed conversation replies
- persisted sessions, messages, and feedback

The codebase is no longer just a generated UI mock. The main product loop works end to end.

## Implemented

### Product Flow

- [x] Explorer page with country, scenario, and session preparation
- [x] Free conversation scenario support
- [x] Scenario language-aware flow
- [x] Session level selection after scenario choice
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
- [x] Load scenario language and mode from backend
- [x] Load per-language level after scenario selection
- [x] Stop depending on hardcoded `Chile` / `USA` flow assumptions
- [x] Use scenario-driven content in conversation view when available
- [x] Shared desktop shell with top navigation
- [x] Real `Explorer` page
- [x] Real `Profil` page
- [x] History page inside the shell
- [x] Conversation page inside the shell
- [x] Feedback page aligned with the shell
- [x] Remove older fullscreen onboarding and selection components from the active UI

### Backend

- [x] FastAPI project scaffold
- [x] SQLAlchemy models
- [x] Alembic initial migration
- [x] Seed command for reference data
- [x] Repository structure
- [x] Ownership enforcement on conversation resources
- [x] Persistent `/me` profile endpoints
- [x] Per-language user level model and endpoints
- [x] Scenario `language_code` and `mode`
- [x] Scenario content fields for intro/cultural context
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
- [x] Authenticated ownership checks on protected session resources

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
- [x] Add backend tests beyond the healthcheck
- [ ] Add frontend smoke tests later if worth it

## Product Gaps

These are not blockers for local development, but they matter before launch.

- [x] Refine the country-first entry flow into a clearer country and scenario selection model
- [ ] Proper user profile onboarding if still needed after login
- [x] Real user-specific history screen
- [x] Free conversation mode in addition to guided scenarios
- [ ] Better feedback quality and consistency
- [ ] Prompt refinement by level, country, scenario, and language-specific cultural context
- [ ] Better UX around loading, retry, and empty states
- [ ] Session recovery if the browser reloads mid-conversation
- [ ] Better conversation controls than the current simple text chat
- [x] Shared desktop app shell with persistent top navigation
- [x] Real `Explorer` page instead of a linear fullscreen flow
- [x] Real `Profil` page
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
- [x] ensure all session and message ownership is tied to authenticated users
- [x] add `/me` and profile completion flow
- [x] define profile vs session model around native language, per-language level, and conversation preferences
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

1. Build a desktop app shell with top navigation
2. Turn the current selection flow into a real `Explorer` page
3. Add a `Profil` page
4. Improve backend logging and error handling
5. Improve feedback structure and prompt contracts

## Recent Progress

Recent implementation work completed:

- enforced ownership on session, message, and feedback resources
- added persistent `/me` profile endpoints
- introduced `UserLanguageLevel` for per-language proficiency
- added `Scenario.language_code`
- added `Scenario.mode` with guided and free conversations
- added `ConversationSession.level_at_start`
- added scenario content fields such as intro message, cultural tip, vocabulary hints, partner name, and partner role
- updated the frontend flow so level is chosen after scenario selection
- removed frontend assumptions that only `Chile` and `USA` exist
- introduced a desktop shell with persistent top navigation
- replaced the older fullscreen selection wizard with a real `Explorer` page
- added `Profil`, `Historique`, `Conversation`, and `Feedback` as first-class app sections
- removed the old fullscreen onboarding and selection components from the active UI

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
