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

## Current Product Assessment

The project has now crossed the line from prototype UI to a real navigable MVP.

What is now solid:

- authenticated user flow
- ownership enforcement on protected conversation resources
- persisted sessions, messages, and feedback
- per-language user level model
- scenario-driven language, mode, and cultural metadata
- desktop-oriented application shell with first-class sections

What is still weak:

- feedback quality and consistency
- prompt richness and scenario depth
- session continuity and recovery behavior
- profile depth and user preferences
- content scaling beyond the current seed set

This means the next roadmap should focus less on structural refactors and more on product quality and content quality.

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

### Critical (Phase 1)
- [ ] DEV_MODE hardcoded to True (bypasses auth in production)
- [ ] Broad exception catching hides real errors (ai_service.py, feedback_service.py)
- [ ] No logging for errors or OpenAI usage
- [ ] No rate limiting on OpenAI endpoints (cost risk)
- [ ] Supabase token fetched on every API call (performance bottleneck)
- [ ] App.tsx god component (13 state variables, 450+ lines)
- [ ] python-jose dependency unused (should remove)

### High Priority (Phase 1-2)
- [ ] Error messages hardcoded in French (no i18n)
- [ ] No API response caching (countries, scenarios)
- [ ] No request timeouts on OpenAI calls
- [ ] JSON serialization anti-pattern in feedback storage
- [ ] Missing database constraints (enums for mode/role/difficulty)
- [ ] No pagination on conversation history
- [ ] Frontend has zero tests

### Medium Priority (Phase 3)
- [ ] No monitoring/observability (Sentry)
- [ ] No CI/CD pipeline
- [ ] Missing database indexes on frequently queried columns
- [ ] No request validation (max message length, input sanitization)
- [ ] No cascade delete on ConversationSession → Message

## Product Gaps

### Phase 1 (Portfolio Quality)
- [ ] Conversation prompts lack cultural authenticity (generic Spanish vs Chilean)
- [ ] Feedback too generic (needs specific examples, vocabulary suggestions)
- [ ] Only 2 countries (need Spain, Mexico, UK for variety)
- [ ] Loading states missing (conversation start, message send)
- [ ] Error messages not user-friendly
- [ ] Mobile responsive but not polished

### Phase 2 (User Testing)
- [ ] No session recovery (page reload loses context)
- [ ] No conversation editing (typo corrections)
- [ ] Profile lacks depth (no learning goals, preferences)
- [ ] Navigation between screens could be smoother

### Phase 3 (Production)
- [ ] No onboarding flow for new users
- [ ] No user analytics (conversation completion rate, time spent)
- [ ] No progression tracking (skill improvement over time)
- [ ] No content recommendation (next scenario suggestions)

### Future Vision (Post-PMF)
- [ ] Voice interaction
- [ ] Animated avatars
- [ ] Advanced personalization
- [ ] Community features (share conversations, leaderboards)

## Project Goals

TripTalk has **multiple potential paths**:

1. **Portfolio Project** - Showcase full-stack skills, architecture quality, product thinking
2. **Personal Tool** - Solve the founder's real problem (preparing for travel/exchange)
3. **LinkedIn Visibility** - Build in public, share learnings, attract opportunities
4. **Commercial Product** - If traction validates, monetize via freemium model

**Strategy:** Progressive validation through phases. Each phase delivers value independently while keeping options open for the next.

---

## Success Metrics by Phase

### Phase 1 Success
- [ ] App used personally 3-4x/week for 2+ weeks
- [ ] Code quality portfolio-ready (clean, documented, tested)
- [ ] 10 friends test and give positive feedback
- [ ] Demo video gets >100 views on LinkedIn

### Phase 2 Success  
- [ ] >50 people request access after LinkedIn post
- [ ] >30% of testers return for 2nd conversation
- [ ] Qualitative feedback: "I would pay for this" (not just "cool")

### Phase 3 Success
- [ ] 100+ active users within 3 months
- [ ] 10%+ free-to-paid conversion
- [ ] €500+/month revenue
- [ ] <5% churn rate

## Roadmap

### Phase 1: Solidify MVP (6 weeks)

**Goal:** Portfolio-ready product with great UX

#### Week 1-2: Critical Tech Fixes ✅ COMPLETE
- [x] Fix DEV_MODE to respect APP_ENV (security critical)
- [x] Add proper logging (errors, API calls, OpenAI usage)
- [x] Fix exception handling (specific catches, no silent failures)
- [x] Add rate limiting on OpenAI endpoints (20/min messages, 10/min feedback)
- [x] Remove unused dependency (python-jose was never added, using PyJWT)

#### Week 3-4: Product Quality ✅ COMPLETE
- [x] Improve conversation prompts (authentic Chilean voice, local vocabulary)
- [x] Improve feedback generation (specific, actionable, cultural)
- [x] Add 3 countries (Spain, Mexico, UK)
- [x] Create quality scenarios for each country (3 per country: airport/food/free talk)
- [x] Culturally authentic prompts with local expressions, personalities, contexts
- [ ] UX/UI polish (loading states, error messages, animations) - MOVED TO WEEK 5-6

#### Week 5-6: Performance & Portfolio
- [x] Fix Supabase token caching (performance bottleneck)
- [x] Complete UI redesign (Notion-inspired, professional design system)
- [ ] Refactor App.tsx state management (extract custom hooks)
- [ ] Perfect mobile responsiveness
- [ ] Code cleanup for portfolio quality
- [ ] Create professional README with screenshots
- [ ] Record demo video (2-3 min)

**Deliverable:** Portfolio-quality web app ready to share

---

### Phase 2: Validate & Share (2 weeks)

**Goal:** Test market interest, get feedback

#### Week 7: Self-Testing
- [ ] Use app personally (3-4 conversations/week)
- [ ] Invite 10 close friends/family to test
- [ ] Collect qualitative feedback
- [ ] Track basic metrics (conversations created, session duration)

#### Week 8: Public Sharing
- [ ] Write LinkedIn post with personal story (Chile, Tandem, solution)
- [ ] Share demo video
- [ ] Observe reactions and engagement
- [ ] Decide next steps based on traction

**Decision Point:** Continue to Phase 3 if strong interest (>50 access requests)

---

### Phase 3: Scale & Monetize (8-10 weeks, optional)

**Only if Phase 2 shows traction**

#### Weeks 9-10: PWA Conversion
- [ ] Add manifest.json (installable on mobile)
- [ ] Add service worker (offline support)
- [ ] Add push notifications
- [ ] Test iOS and Android installation

#### Weeks 11-13: Monetization
- [ ] Design freemium model (10 convos/month free, unlimited premium)
- [ ] Integrate Stripe checkout
- [ ] Add subscription management to profile
- [ ] Add webhook for payment confirmation

#### Weeks 14-16: Production Hardening
- [ ] Database migration (JSONB for feedback, enums for roles/modes)
- [ ] Add request validation (max lengths, input sanitization)
- [ ] Set up monitoring (Sentry or equivalent)
- [ ] CI/CD pipeline
- [ ] Production deployment

**Deliverable:** Revenue-generating product with real users

---

### Not Now

These require validated product-market fit first:

- Native mobile apps (React Native/Flutter)
- Voice interaction
- Animated avatars
- Advanced personalization
- Content recommendation engine

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

## Current Status

**Foundation:** ✅ Solid
- Auth works (Supabase)
- Conversations persist (PostgreSQL)
- AI integration functional (OpenAI)
- Basic user flows complete

**Quality:** ⚠️ Needs Work
- Prompts too generic (not culturally authentic)
- Feedback not actionable enough
- Performance bottlenecks (token caching)
- Error handling hides issues

**Portfolio Readiness:** 60%
- Code architecture good
- Needs cleanup (App.tsx refactor, remove tech debt)
- Needs documentation polish
- Needs demo video

**Production Readiness:** 40%
- Security issues (DEV_MODE)
- No monitoring/logging
- No rate limiting
- Performance not optimized

**Next Priority:** Phase 1 - Week 3-4 (Product Quality - Prompts & Content)
