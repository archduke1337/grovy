# Appwrite Migration Plan

## Scope

Migrate Grovy from browser-only persistence (localStorage + IndexedDB) to Appwrite for:

- Authentication and session management
- Synced user data storage
- Device-to-device continuity for user library and preferences

## Appwrite Services

- Auth: Email/Password, OAuth2, Anonymous sessions
- Databases: 1 database, 6 tables
- Preferences: Appwrite Account preferences for compact user settings

## Database Design

Database ID: `grovy_main`

### 1) Table: playlists

Purpose: user-created playlists metadata.

Columns:
- `userId` (varchar, required)
- `name` (varchar, required)
- `cover` (url, optional)
- `description` (text, optional)
- `songCount` (integer, default 0)
- `isPinned` (boolean, default false)
- `updatedAt` (datetime, required)

Indexes:
- key index: `userId`, `updatedAt`
- key index: `userId`, `name`

Permissions:
- Row security ON
- Row-level read/write for owner user only

### 2) Table: playlist_tracks

Purpose: songs belonging to playlists with stable order.

Columns:
- `userId` (varchar, required)
- `playlistId` (varchar, required)
- `songId` (varchar, required)
- `title` (varchar, required)
- `artist` (varchar, required)
- `url` (url, required)
- `cover` (url, optional)
- `genre` (varchar, optional)
- `duration` (integer, optional)
- `source` (varchar, required)
- `position` (integer, required)
- `addedAt` (datetime, required)

Indexes:
- key index: `playlistId`, `position`
- unique index: `playlistId`, `songId`
- key index: `userId`, `playlistId`

Permissions:
- Row security ON
- Row-level read/write for owner user only

### 3) Table: favorites

Purpose: liked songs by user.

Columns:
- `userId` (varchar, required)
- `songId` (varchar, required)
- `title` (varchar, required)
- `artist` (varchar, required)
- `url` (url, required)
- `cover` (url, optional)
- `genre` (varchar, optional)
- `duration` (integer, optional)
- `source` (varchar, required)
- `addedAt` (datetime, required)

Indexes:
- unique index: `userId`, `songId`
- key index: `userId`, `addedAt`

Permissions:
- Row security ON
- Row-level read/write for owner user only

### 4) Table: play_history

Purpose: recently played timeline.

Columns:
- `userId` (varchar, required)
- `songId` (varchar, required)
- `title` (varchar, required)
- `artist` (varchar, required)
- `url` (url, required)
- `cover` (url, optional)
- `genre` (varchar, optional)
- `duration` (integer, optional)
- `source` (varchar, required)
- `playedAt` (datetime, required)
- `contextType` (enum: `search`, `radio`, `playlist`, `related`, `manual`, required)
- `contextRef` (varchar, optional)

Indexes:
- key index: `userId`, `playedAt`
- key index: `userId`, `songId`

Permissions:
- Row security ON
- Row-level read/write for owner user only

### 5) Table: queue_snapshots

Purpose: persist active queue and current index.

Columns:
- `userId` (varchar, required)
- `queueJson` (longtext, required)
- `currentSongIndex` (integer, required)
- `playbackState` (enum: `playing`, `paused`, required)
- `updatedAt` (datetime, required)

Indexes:
- unique index: `userId`

Permissions:
- Row security ON
- Row-level read/write for owner user only

### 6) Table: search_cache

Purpose: replace local search metadata cache per user.

Columns:
- `userId` (varchar, required)
- `cacheKey` (varchar, required)
- `query` (varchar, required)
- `source` (varchar, optional)
- `resultsJson` (longtext, required)
- `expiresAt` (datetime, required)
- `updatedAt` (datetime, required)

Indexes:
- unique index: `userId`, `cacheKey`
- key index: `userId`, `expiresAt`

Permissions:
- Row security ON
- Row-level read/write for owner user only

## Auth Flows

Enabled methods:
- Email/password sign-up and sign-in
- OAuth2 sign-in (Google, GitHub)
- Anonymous guest sessions

Session strategy:
- Cookie name format: `a_session_<PROJECT_ID>`
- Cookie flags: `httpOnly`, `secure` in production, `sameSite=strict`, `path=/`
- Server routes handle session creation and cookie rotation

## Auth Pages

- `/auth/sign-in`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify-email`
- `/auth/oauth/callback`
- `/account`

## Environment Variables

Required:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `APPWRITE_API_KEY`

## Migration Order

1. Add Appwrite SDKs and auth API routes
2. Add auth pages and account page
3. Add Appwrite repository layer for playlists/favorites/history/queue/search cache
4. Migrate PlayerContext persistence calls from local storage wrappers to Appwrite repositories
5. Move compact settings to Appwrite Account preferences
6. Add one-time import from existing local browser data on first authenticated session
7. Remove legacy local storage + IndexedDB code paths
8. Update tests to cover Appwrite-backed persistence and auth session behavior
