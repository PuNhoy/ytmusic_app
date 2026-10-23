-- ============================================================
-- BeatStream Music Player - PostgreSQL Database Schema
-- ============================================================

-- 1. Users Table
-- Supports guest/demo user out of the box, with full multi-user readiness
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default guest user (id: 1) if not already exists
INSERT INTO users (id, username, email)
VALUES (1, 'guest', 'guest@beatstream.local')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users table to avoid primary key collisions
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- 2. Favorites Table
-- Stores user's favorited songs with all required metadata
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    channel VARCHAR(255) NOT NULL,
    thumbnail TEXT NOT NULL,
    duration VARCHAR(20) NOT NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_favorite UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at DESC);

-- 3. Search History Table
-- Stores user's recent search queries
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_date ON search_history(user_id, searched_at DESC);

-- 4. Playlists Table
-- Allows users to create custom playlists
CREATE TABLE IF NOT EXISTS playlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id, created_at DESC);

-- 5. Playlist Tracks Table
-- Links tracks to specific playlists with ordering support
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id SERIAL PRIMARY KEY,
    playlist_id INT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    video_id VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    channel VARCHAR(255) NOT NULL,
    thumbnail TEXT NOT NULL,
    duration VARCHAR(20) NOT NULL,
    duration_seconds INT DEFAULT 0,
    position INT NOT NULL DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_playlist_video UNIQUE (playlist_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position ASC);

-- 6. Playback History (Recently Played)
-- Tracks song play events and recently listened tracks
CREATE TABLE IF NOT EXISTS playback_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    channel VARCHAR(255) NOT NULL,
    thumbnail TEXT NOT NULL,
    duration VARCHAR(20) NOT NULL,
    duration_seconds INT DEFAULT 0,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playback_history_user_date ON playback_history(user_id, played_at DESC);
