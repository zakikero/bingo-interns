# Internship Bingo 🎯

![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-000000?logo=next.js)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)

**Internship Bingo** transforms intern onboarding into a gamified challenge: complete activities on a 5×5 board per user (randomized on first login), submit proof, and climb the leaderboard.

## 🚀 Snapshot

- **Goal:** make onboarding engaging, social, and measurable
- **Users do:** sign up → complete challenges → upload proof → track rank
- **Built as:** a full-stack product with real API and data workflows

## 🧩 Key features

- 25-cell interactive bingo board per user (randomized on first login)
- Authentication flow (signup, login)
- Activity submissions
- Leaderboard ranking by completed activities
- Documented backend API (`/docs`) + health check endpoint

## 🏗️ Architecture

```text
Next.js UI  →  FastAPI API  →  PostgreSQL
                 │
                 └── None
```

## 🛠️ Tech stack

| Layer             | Technologies                       |
| ----------------- | ---------------------------------- |
| Frontend          | Next.js 14, React 18, TypeScript   |
| Backend           | FastAPI, Python, SQLModel, Uvicorn |
| Data              | PostgreSQL, psycopg                |
| Platform services | None                               |
| API docs          | OpenAPI / Swagger                  |

## 💼 What this demonstrates

## ⚡ Quick run

```bash
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd ../frontend
npm install
npm run dev
```

Required env files:

- `backend/.env` → `DATABASE_URL=...`
- `frontend/.env.local` → `NEXT_PUBLIC_API_BASE_URL`

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
