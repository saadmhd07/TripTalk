# Deployment Checklist

Stack cible:

- Frontend: `Vercel`
- API: `Railway`
- Database: `Railway Postgres`
- Auth: `Supabase`
- AI / audio: `OpenAI`

## 1. Produit

- Garder le scope de lancement clair: `auth`, `explorer`, `conversation`, `audio`, `avatar`, `feedback`, `history`
- Vérifier que les scénarios seedés sont ceux que tu veux montrer en public
- Vérifier que les textes de feedback, onboarding et auth sont cohérents en français
- Assumer que `audio + avatar` sont une partie centrale du MVP et tester ce parcours en priorité

## 2. Frontend Vercel

- Configurer `VITE_API_BASE_URL`
- Configurer `VITE_SUPABASE_URL`
- Configurer `VITE_SUPABASE_ANON_KEY`
- Ajouter un rewrite SPA pour que `/explorer`, `/history`, `/conversation/:id` et `/feedback/:id` renvoient vers `index.html`
- Vérifier que le domaine Vercel final est bien celui attendu
- Tester un refresh direct sur une URL profonde

## 3. Backend Railway

- Configurer `APP_ENV=production`
- Configurer `APP_DEBUG=false`
- Configurer `API_V1_PREFIX=/api/v1`
- Configurer `FRONTEND_URL=https://ton-domaine-vercel`
- Configurer `DATABASE_URL`
- Configurer `SUPABASE_URL`
- Configurer `SUPABASE_ANON_KEY`
- Configurer `SUPABASE_JWT_SECRET`
- Configurer `OPENAI_API_KEY`
- Configurer les modèles audio et texte OpenAI
- Vérifier que l'API démarre sans fallback auth local

## 4. Base de données

- Provisionner Postgres sur Railway
- Lancer `alembic upgrade head`
- Lancer `seed-reference-data`
- Vérifier que les tables principales existent
- Vérifier que les pays et scénarios attendus sont bien présents

## 5. Supabase

- Configurer l'URL de production du frontend dans les redirect/auth settings
- Vérifier que le provider email/password est actif
- Vérifier le comportement signup/login réel depuis Vercel
- Vérifier qu'un token Supabase valide est bien accepté côté API

## 6. Audio / Avatar

- Tester micro navigateur sur desktop
- Tester TTS sur au moins un scénario `Chile` et un scénario `USA`
- Vérifier la latence ressentie sur: transcription, réponse, lecture audio
- Vérifier qu'en cas d'échec audio, le fallback texte reste utilisable
- Vérifier que les avatars/images sont bien servis en production

## 7. Smoke Tests Avant Go-Live

- Créer un compte
- Se connecter
- Ouvrir l'explorer
- Choisir un pays
- Choisir un scénario
- Démarrer une session
- Envoyer un message texte
- Envoyer un message via micro
- Écouter une réponse audio
- Terminer la session
- Ouvrir le feedback
- Vérifier l'historique
- Recharger la page sur `conversation/:sessionId`
- Recharger la page sur `feedback/:sessionId`

## 8. Observabilité Minimale

- Vérifier les logs Railway au démarrage
- Vérifier que les erreurs OpenAI remontent proprement dans les logs
- Vérifier que les erreurs 401, 429 et 503 sont compréhensibles
- Prévoir une routine simple pour surveiller erreurs API, latence et coût OpenAI

## 9. Risques À Surveiller En Premier

- CORS mal configuré entre Vercel et Railway
- Rewrite SPA manquant
- Variables d'env manquantes ou mélangées entre staging et prod
- Problèmes de permissions micro navigateur
- Latence ou coût audio plus élevés que prévu
- Seed ou migrations non appliqués sur l'environnement distant
