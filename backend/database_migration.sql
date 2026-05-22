-- Bingo App Database Schema
-- Run this SQL in your Supabase SQL Editor to create the new tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- UPDATE PROFILES TABLE FOR USERNAME AUTH
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Remove email/name fields (no longer used)
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
ALTER TABLE profiles DROP COLUMN IF EXISTS name;

-- Unique index for usernames
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON profiles(username);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_submissions_user_activity ON submissions(user_id, activity_id);

-- ============================================
-- CREATE USER BOARD ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_board_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 0 AND position < 25),
    UNIQUE(user_id, position)
);

-- Allow duplicate activities on a user's board (fallback when unique activities are exhausted)
ALTER TABLE user_board_activities
    DROP CONSTRAINT IF EXISTS uq_user_board_activity;

CREATE INDEX IF NOT EXISTS idx_user_board_activities_user ON user_board_activities(user_id);

-- Performance indexes for activities table
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
-- Single-column index on activity_id for submission lookups by activity
CREATE INDEX IF NOT EXISTS idx_submissions_activity_id ON submissions(activity_id);
-- Unique constraint to prevent duplicate submissions (race condition guard)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_submission_user_activity'
    ) THEN
        ALTER TABLE submissions
            ADD CONSTRAINT uq_submission_user_activity UNIQUE (user_id, activity_id);
    END IF;
END $$;
-- Drop status column if it exists (no longer used)
ALTER TABLE submissions DROP COLUMN IF EXISTS status;

-- Make image_url nullable (not all activities require an image)
ALTER TABLE submissions ALTER COLUMN image_url DROP NOT NULL;

-- Drop image_url column (no longer used)
ALTER TABLE submissions DROP COLUMN IF EXISTS image_url;

-- Add text response support
ALTER TABLE activities ADD COLUMN IF NOT EXISTS "isTextRequired" BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "textResponse" TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

