# Bingo App - Frontend & Backend Integration Guide

Cette guide explique comment lancer le projet complet avec la connexion frontend-backend fonctionnelle.

## Architecture

```
Frontend (Next.js/React) ← API Calls → Backend (FastAPI)
                                            ↓
                                     PostgreSQL (Supabase)
```

## Structure des fichiers

### Frontend (`/frontend`)

- `app/page.js` - Page principale avec authentification et board bingo
- `app/layout.js` - Layout root
- `app/globals.css` - Styles globaux pastel
- `lib/api.js` - Client API pour communiquer avec le backend
- `lib/hooks.js` - Hooks React pour l'auth, board, submissions
- `package.json` - Dépendances Next.js

### Backend (`/backend`)

- `app/main.py` - Serveur FastAPI principal
- `app/routes/users.py` - Endpoints auth (register, login, get user)
- `app/routes/activities.py` - Endpoints activités et submissions
- `app/routes/leaderboard.py` - Endpoints classement
- `app/models/` - Modèles SQLModel (User, Activity, UserBoardActivity)
- `app/db/connection.py` - Connexion PostgreSQL
- `requirements.txt` - Dépendances Python

## Lancer le projet

### 1. Backend (FastAPI)

#### Prérequis

- Python 3.10+
- PostgreSQL installé ou compte Supabase

#### Installation et démarrage

```bash
cd backend

# Créer un environnement virtuel (optionnel mais recommandé)
python -m venv .venv
source .venv/bin/activate  # ou `.venv\Scripts\activate` sur Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
# Créer un fichier .env avec:
# DATABASE_URL=postgresql://user:password@localhost/bingo_db
# ou si Supabase:
# DATABASE_URL=postgresql://...@... (copier depuis Supabase)

# Lancer le serveur FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur tourne sur `http://localhost:8000`

- API: `http://localhost:8000/api/`
- Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Frontend (Next.js)

#### Prérequis

- Node.js 18+
- npm, yarn, ou pnpm

#### Installation et démarrage

```bash
cd frontend

# Installer les dépendances
npm install

# Les variables d'environnement sont déjà configurées en .env.local
# (API pointe sur http://localhost:8000)

# Lancer le serveur de développement
npm run dev
```

L'app tourne sur `http://localhost:3000`

## Flux utilisateur intégré

### 1. **Register / Login**

- L'utilisateur entre username/password
- Appel API `POST /api/auth/register`
- Backend crée l'utilisateur en DB
- Frontend stocke `user.id` en localStorage
- Redirection vers le board

### 2. **Voir le Board**

- Frontend récupère le board depuis `/api/users/{user_id}/board`
- Les 25 activités sont affichées avec symbole `Open`

### 3. **Compléter une activité**

- L'utilisateur clique sur une case
- Frontend appelle `POST /api/submissions` avec:
  - `user_id` (depuis localStorage)
  - `activity_id` (de la case)
  - `image_url` (placeholder pour maintenant)
  - `status: "pending"`
- Backend insère une ligne dans `submissions` table
- Frontend rafraîchit et affiche `Done`
- Compteur `/25 complete` se met à jour

### 4. **Persistance en DB**

- Toute action (toggle, submit, register) persiste en PostgreSQL
- Les données restent même après refresh ou logout/login

## Endpoints API disponibles

### Users

- `POST /api/auth/register` - Créer un utilisateur
- `POST /api/auth/login` - Se connecter
- `GET /api/users/{user_id}` - Récupérer un utilisateur
- `GET /api/users` - Lister tous les utilisateurs
- `GET /api/users/{user_id}/board` - Récupérer le board personnalisé

### Activities

- `GET /api/activities` - Lister les activités
- `POST /api/activites` - Créer une activité

### Submissions

- `POST /api/submissions` - Soumettre une preuve pour une activité
- `GET /api/submissions/user/{user_id}` - Récupérer les soumissions d'un user

### Leaderboard

- `GET /api/leaderboard/top` - Top utilisateurs par activités complétées
- `GET /api/users/{user_id}/stats` - Stats de l'utilisateur

## Variables d'environnement

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (`.env`)

```
DATABASE_URL=postgresql://user:password@localhost/bingo_db
# Ou pour Supabase:
# DATABASE_URL=postgresql://(username):(password)@(host)/(database)

# Optionnel: origines CORS separées par des virgules
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

## Dépannage

### "Connection refused" backend

- Vérifier que FastAPI tourne: `http://localhost:8000/health`
- Vérifier DATABASE_URL en `.env` backend

### "CORS error" au login

- S'assurer que le backend a CORS activé (activé par défaut dans main.py)
- Vérifier que le Frontend appelle `http://localhost:8000`

### "Database connection error"

- Vérifier la connexion PostgreSQL/Supabase
- Vérifier que les tables existent (migrations appliquées)

### Tables n'existent pas

- Les tables doivent être créées une fois via Supabase ou PostgreSQL
- Voir `backend/database_migration.sql` pour le schéma

## Prochaines étapes

1. **Upload d'images** - Ajouter un stockage externe si nécessaire
2. **Authentification robuste** - Ajouter JWT tokens
3. **Validation des soumissions** - Créer panel admin pour approuver/rejeter
4. **Classement en direct** - Sync du leaderboard en temps réel
5. **Tests** - Ajouter tests frontend et backend

## Contacts et questions

L'app est prête pour le développement. Commencer par:

1. Lancer `npm run dev` (frontend)
2. Lancer `uvicorn app.main:app --reload` (backend)
3. Naviguer vers `http://localhost:3000`
