# TripTalk

TripTalk is an AI conversation MVP for travel preparation and cultural immersion.

The product is country-first rather than language-first: a user chooses a place, enters a realistic scenario, and speaks with a culturally situated character.

## What It Includes

- Supabase authentication
- country and scenario explorer
- per-language user levels
- persisted conversation sessions and history
- OpenAI-generated replies
- OpenAI text-to-speech and speech-to-text in conversation mode
- avatar-centric conversation UI
- feedback after a session
- direct URLs for conversation and feedback pages

## Stack

### Frontend

- React
- Vite
- Tailwind CSS v4
- Supabase JS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- OpenAI API

## Project Structure

```text
.
├── src/                  # frontend
├── api/                  # backend
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   └── pyproject.toml
├── docs/
│   └── archive/
├── .env.example
├── api/.env.example
└── ARCHITECTURE_MVP.md
```

## Requirements

- Node.js and npm
- Python 3.11+
- `uv`
- Docker
- Supabase project
- OpenAI API key

## Frontend Setup

```bash
cd /home/saad/projects/perso/TalkTrip
npm install
cp .env.example .env
```

Frontend env:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run:

```bash
cd /home/saad/projects/perso/TalkTrip
npm run dev
```

## Backend Setup

```bash
cd /home/saad/projects/perso/TalkTrip
UV_CACHE_DIR=/tmp/uv-cache uv venv api/.venv
cd api
source .venv/bin/activate
UV_CACHE_DIR=/tmp/uv-cache uv pip install -e .[dev]
cp .env.example .env
```

Backend env:

```env
APP_NAME=TripTalk API
APP_ENV=development
APP_DEBUG=true
API_V1_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000
DEV_MODE=true
DEV_USER_EMAIL=dev@triptalk.local

DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/triptalk

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
```

Run:

```bash
cd /home/saad/projects/perso/TalkTrip/api
source .venv/bin/activate
uvicorn app.main:app --reload
```

Useful backend URLs:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## PostgreSQL

Create the local database:

```bash
docker run --name triptalk-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=triptalk \
  -p 5432:5432 \
  -d postgres:16
```

If it already exists:

```bash
docker start triptalk-postgres
```

Apply migrations and seed data:

```bash
cd /home/saad/projects/perso/TalkTrip/api
source .venv/bin/activate
alembic upgrade head
seed-reference-data
```

## Run Locally

You usually need 3 processes:

### Terminal 1

```bash
docker start triptalk-postgres
```

### Terminal 2

```bash
cd /home/saad/projects/perso/TalkTrip/api
source .venv/bin/activate
uvicorn app.main:app --reload
```

### Terminal 3

```bash
cd /home/saad/projects/perso/TalkTrip
npm run dev
```

Open:

- `http://localhost:3000/explorer`

Main routes:

- `/explorer`
- `/history`
- `/profile`
- `/conversation/:sessionId`
- `/feedback/:sessionId`

## Testing

Frontend build:

```bash
cd /home/saad/projects/perso/TalkTrip
npm run build
```

Backend tests:

```bash
cd /home/saad/projects/perso/TalkTrip
api/.venv/bin/pytest -q api/tests
```

## Notes

- The backend verifies Supabase access tokens using Supabase JWKS.
- Guided conversations can complete automatically and then hand off to feedback.
- Conversation and feedback URLs survive page reload.

## Documentation

- [`README.md`](README.md): setup and local development
- [`ARCHITECTURE_MVP.md`](ARCHITECTURE_MVP.md): technical architecture, implemented work, and roadmap
- `docs/archive/`: older progress notes and temporary planning documents
