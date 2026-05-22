# ✅ Résum des intégrations Frontend-Backend

## Ce qui a été fait

### 🎨 Frontend (Next.js/React)

- ✅ Créé un projet Next.js 14 complet dans `/frontend`
- ✅ Migré l'UI pastel des captures (login + board 5x5)
- ✅ Créé `lib/api.js` - Client API pour communiquer avec FastAPI
- ✅ Créé `lib/hooks.js` - Hooks React:
  - `useAuth()` - Authentification register/login/logout
  - `useUserBoard()` - Récupérer le board personnalisé d'un user
  - `useSubmitActivity()` - Soumettre une activité
  - `useUserSubmissions()` - Récupérer les soumissions d'un user
- ✅ Mis à jour `app/page.js` pour intégrer les hooks
- ✅ Configuré `.env.local` avec `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

### 🔧 Backend (FastAPI)

- ✅ Corrigé le fichier `app/routes/users.py` (conflit merge éliminé)
- ✅ Nettoyé `app/main.py` - imports et middleware CORS correctement configurés
- ✅ Endpoints déjà présents et fonctionnels:
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`
  - Activities: `GET /api/activities`, `POST /api/activities`
  - Submissions: `POST /api/submissions`, `GET /api/submissions/user/{user_id}`
  - Leaderboard: `GET /api/leaderboard/top`

### 📚 Documentation

- ✅ Créé `INTEGRATION_GUIDE.md` - Guide complet de lancement et d'architecture
- ✅ Créé `QUICK_START.md` - This file!

## 🚀 Checklist de lancement

### ✅ Étape 1: Vérifier les prérequis

- [ ] Python 3.10+ installé
- [ ] Node.js 18+ installé
- [ ] PostgreSQL ou Supabase configuré

### ✅ Étape 2: Configurer le Backend

```bash
cd backend

# Créer un venv (optionnel)
python -m venv .venv
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer .env avec:
# DATABASE_URL=postgresql://user:password@host/bingo_db
# (Ou copier depuis Supabase)
```

### ✅ Étape 3: Lancer le Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Vérifier: `http://localhost:8000/health` → `{"status": "healthy"}`
- Docs: `http://localhost:8000/docs`

### ✅ Étape 4: Configurer le Frontend

```bash
cd frontend

# Installer les dépendances
npm install
# (ou yarn install, pnpm install)

# Les variables d'env sont déjà en .env.local
```

### ✅ Étape 5: Lancer le Frontend

```bash
cd frontend
npm run dev
```

- Ouvrir: `http://localhost:3000`

### ✅ Étape 6: Tester le flux

1. **Créer un compte**
   - Username: `testuser`
   - Password: `password123`
   - Clic "Sign up"
     → User créé en DB ✓

2. **Voir le board**
   → 25 activités aléatoires affichées ✓ (persistées par user)

3. **Compléter une activité**
   - Clic sur une case
     → Submission créée en DB ✓
     → Case passe en "Done" ✓
     → Compteur s'incrémente ✓

4. **Rafraîchir la page**
   → Les données persistent (depuis la DB) ✓

## 🎯 Flux de données

```
Frontend (login form)
         ↓
  API POST /api/auth/register
         ↓
Backend (crée Profile en DB)
         ↓
Frontend reçoit user.id + username
         ↓
localStorage.setItem("bingo_user", user)
         ↓
Frontend appelle GET /api/users/{user_id}/board
         ↓
Frontend affiche le board personnalisé
         ↓
Utilisateur clique sur une activité
         ↓
  API POST /api/submissions
         ↓
Backend (crée Submission en DB)
         ↓
Frontend rafraîchit l'état local
         ↓
Case affichée en "Done"
```

## 🔗 Endpoints clés testables

**Au lancement du backend, essayer dans un terminal:**

```bash
# Santé du backend
curl http://localhost:8000/health

# Créer un utilisateur
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'

# Lister les utilisateurs
curl http://localhost:8000/api/users

# Lister les activités
curl http://localhost:8000/api/activities

# Board d'un utilisateur
curl http://localhost:8000/api/users/{user_id}/board
```

## 📝 Variables d'environnement

### Backend (`.env`)

```
DATABASE_URL=postgresql://user:password@localhost/bingo_db

# Optional: comma-separated list of allowed CORS origins
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 🐛 Dépannage

| Problème                               | Solution                                             |
| -------------------------------------- | ---------------------------------------------------- |
| `Connection refused` sur login         | Vérifier que FastAPI tourne sur port 8000            |
| `CORS error`                           | Vérifier main.py a CORS activé                       |
| `TypeError: Cannot read property 'id'` | Vérifier que .env.local a `NEXT_PUBLIC_API_BASE_URL` |
| Database not found                     | Vérifier DATABASE_URL en `.env` backend              |
| Tables don't exist                     | Voir `backend/database_migration.sql`                |

## 🎓 Structure des fichiers modifiés

```
bingo-app-main 2/
├── frontend/
│   ├── app/
│   │   ├── page.js (UI + hooks intégrés)
│   │   ├── layout.js
│   │   └── globals.css
│   ├── lib/
│   │   ├── api.js (endpoints FastAPI)
│   │   └── hooks.js (useAuth, useUserBoard, etc.)
│   ├── package.json (Next.js + React 18)
│   ├── next.config.js
│   ├── .env.local (API URL configurée)
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py (FastAPI + CORS fix)
│   │   ├── routes/
│   │   │   ├── users.py (auth + user board)
│   │   │   ├── activities.py (activities + submissions)
│   │   │   └── leaderboard.py (top users)
│   │   ├── models/
│   │   │   ├── user.py (Profile + auth)
│   │   │   ├── activity.py (Activity + Submission)
│   │   │   └── user_board.py (UserBoardActivity)
│   │   └── db/
│   │       └── connection.py (PostgreSQL/Supabase)
│   ├── requirements.txt (FastAPI 0.109.0, SQLModel, etc.)
│   └── .env (DATABASE_URL)
│
├── INTEGRATION_GUIDE.md (guide complet)
├── QUICK_START.md (ce fichier)
└── start.sh (script helper)
```

## ✨ Prochaines étapes

1. **Tester le flux complet** en suivant la checklist ci-dessus
2. **Upload d'images** - Intégrer Supabase Storage
3. **JWT tokens** - Remplacer localStorage par tokens sécurisés
4. **Panel admin** - Approuver/rejeter les soumissions
5. **Tests** - Unit tests backend + e2e tests frontend

---

**Questions?** Voir `INTEGRATION_GUIDE.md` pour plus de détails.
