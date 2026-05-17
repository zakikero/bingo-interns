# Bingo App - Backend API Documentation

## Overview

Complete REST API for a Bingo challenge application with image submissions, 25-box boards, and leaderboards.

**Base URL**: `http://localhost:8000`  
**API Docs**: `http://localhost:8000/docs`

---

## 🔐 User Management

### Register

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "username": "user123",
  "password": "password123"
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "username": "user123",
  "password": "password123"
}
```

### Get User by ID

```http
GET /api/users/{user_id}
```

---

## 🎯 Activities Management

### Create Activity

```http
POST /api/activities
```

**Request Body:**

```json
{
  "title": "Take a selfie with a tree",
  "description": "Find a tree and take a creative selfie"
}
```

### Get All Activities

```http
GET /api/activities
```

### Get Single Activity

```http
GET /api/activities/{activity_id}
```

### Update Activity

```http
PUT /api/activities/{activity_id}
```

**Request Body:**

```json
{
  "title": "Updated title"
}
```

### Delete Activity

```http
DELETE /api/activities/{activity_id}
```

---

## 📸 Submissions (Image Proof)

### Submit Activity Completion

```http
POST /api/submissions
```

**Request Body:**

```json
{
  "user_id": "uuid-here",
  "activity_id": "uuid-here",
  "image_url": "https://storage.example.com/image.jpg",
  "status": "pending"
}
```

### Get User's Submissions

```http
GET /api/submissions/user/{user_id}
```

### Get Activity's Submissions

```http
GET /api/submissions/activity/{activity_id}
```

### Approve/Reject Submission

```http
PATCH /api/submissions/{submission_id}/status
```

**Request Body:**

```json
{
  "status": "approved" // or "rejected" or "pending"
}
```

---

---

## 🏆 Leaderboard & Statistics

### Get Top 5 Winners

```http
GET /api/leaderboard/top?limit=5
```

**Response:**

```json
[
  {
    "user_id": "uuid",
    "username": "user123",
    "completed_activities": 32,
    "rank": 1
  },
  ...
]
```

### Get Board-Specific Leaderboard

```http
GET /api/leaderboard/board/{board_id}?limit=5
```

### Get User Statistics

```http
GET /api/stats/user/{user_id}
```

**Response:**

```json
{
  "user_id": "uuid",
  "username": "user123",
  "completed_activities": 18,
  "approved_submissions": 18,
  "pending_submissions": 3,
  "rejected_submissions": 2
}
```

### Get Global Statistics

```http
GET /api/stats/global
```

**Response:**

```json
{
  "total_users": 156,
  "total_activities": 50,
  "total_boards": 3,
  "active_boards": 2,
  "total_submissions": 523,
  "approved_submissions": 412,
  "pending_submissions": 111
}
```

---

## 🔄 Typical Workflow

### 1. User Sign-up via Supabase

```
Supabase Auth sign-up/sign-in
→ POST /api/users/sync
→ Ensure backend profile row exists
```

### 2. Admin Creates Activities

```
POST /api/activities (x25)
→ Create 25 different activities
```

### 3. Admin Creates Bingo Board

```
POST /api/boards
→ Link the 25 activities to a board
```

### 4. User Completes Activity

```
1. User uploads image to storage (Supabase Storage, Cloudinary, etc.)
2. POST /api/submissions (with image_url)
3. Admin reviews: PATCH /api/submissions/{id}/status → "approved"
4. POST /api/boards/{board_id}/complete
   → Links approved submission to board progress
```

### 5. View Leaderboard

```
GET /api/leaderboard/top
→ See top 5 winners
```

---

## 📊 Database Schema Summary

### Existing Tables (Supabase)

- `profiles` - User accounts
- `activities` - Individual challenges
- `submissions` - User proof submissions

### New Tables (Run migration.sql)

- `bingo_boards` - 25-activity boards
- `bingo_board_activities` - Activity positions on boards
- `user_board_progress` - User completion tracking

---

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   Create `.env` file with your Supabase credentials

3. **Run database migration:**
   Execute `database_migration.sql` in Supabase SQL Editor

4. **Start server:**

   ```bash
   python -m uvicorn app.main:app --reload
   ```

5. **Access API docs:**
   Visit `http://localhost:8000/docs`

---

## 🎨 Frontend Integration Tips

- All IDs are UUIDs, not integers
- Timestamp fields use ISO 8601 format
- Image URLs should be stored after uploading to cloud storage
- Use completed_positions array to highlight completed squares on bingo board
- Status values: "pending", "approved", "rejected"

---

## ⚠️ Important Notes

- Bingo boards require exactly 25 activities
- Users can only complete each activity once per board
- Submissions must be approved before counting toward board progress
- Default leaderboard shows top 5, but customizable with `?limit=` parameter
