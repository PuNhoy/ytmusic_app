# 🎵 BeatStream - Full-Stack YouTube Music Web Application

A full-stack, production-grade music streaming web application built with **React**, **Node.js/Express**, **Tailwind CSS**, and the **YouTube Data API v3** & **YouTube IFrame Player API**.

---

## 🌟 Key Features

1. **Backend-Proxied YouTube Search**: Searches YouTube using backend endpoints (`/api/search?q=...&pageToken=...`) to keep API keys 100% secret from the client.
2. **Music-Only & Embeddable Filters**: Automatically restricts search results to the Music category (`videoCategoryId=10`) and embeddable videos (`videoEmbeddable=true`).
3. **Exact Durations & Formatted Details**: Fetches high-accuracy durations using `videos.list` and parses ISO 8601 strings into clean `mm:ss` or `hh:mm:ss`.
4. **Sticky Interactive Bottom Player Bar**: Complete with play/pause, next, previous, seek slider, volume control with mute, shuffle, and repeat modes.
5. **Autoplay & Queue Management**: Autoplays the next song when a track finishes (`onEnd`), with full Up Next queue flyout drawer and re-ordering.
6. **Automatic Unembeddable Video Skip**: If a video is region-locked or blocked by the copyright owner from embedded playback (error code 101/150), a friendly banner is displayed and it automatically skips to the next track.
7. **Favorites System**: Persisted in `localStorage`, complete with a dedicated Favorites page and "Play All" queueing.
8. **Recent Search History**: Persists the last 10 search queries in `localStorage` with one-click re-search and clearing.
9. **Pagination**: Seamless "Load More" pagination powered by YouTube's `nextPageToken`.
10. **In-Memory Cache & Rate Limiting**: 10-minute in-memory cache to conserve YouTube quota, with `express-rate-limit`, `helmet`, and `cors`.
11. **Responsive Dark UI**: Modern dark theme with Tailwind CSS, skeleton loading animations, and picture-in-picture video popout.

---

## 📁 Project Architecture

```
music-app/
├── package.json             # Root monorepo manager with concurrent runner
├── README.md                # Comprehensive documentation
├── server/                  # Node.js + Express Backend
│   ├── .env.example         # Environment template for server
│   ├── index.js             # Express app setup, security headers, rate limiting
│   ├── package.json         # Server dependencies (express, axios, helmet, etc.)
│   ├── routes/
│   │   └── search.js        # /api/search with input validation & caching
│   └── services/
│       └── youtube.js       # YouTube Data API v3 search & video duration service
└── client/                  # React (Vite) + Tailwind CSS Frontend
    ├── .env.example         # Environment template for client
    ├── index.html           # HTML5 entry with modern Google Fonts
    ├── package.json         # Client dependencies (react, react-youtube, lucide-react)
    ├── postcss.config.js    # PostCSS configuration
    ├── tailwind.config.js   # Tailwind design tokens & dark mode
    ├── vite.config.js       # Vite dev server with /api proxy
    └── src/
        ├── App.jsx          # Root component & page router
        ├── index.css        # Tailwind directives and custom scrubber styles
        ├── main.jsx         # React DOM render entry
        ├── components/
        │   ├── ErrorAlert.jsx     # Friendly error banners (quota, network, keys)
        │   ├── Navbar.jsx         # Sticky glassmorphism header & badges
        │   ├── PlayerBar.jsx      # Sticky bottom player with react-youtube
        │   ├── SearchBar.jsx      # Input bar with validation & clear button
        │   ├── SearchHistory.jsx  # Clickable recent search chips
        │   ├── SkeletonCard.jsx   # Animated shimmer skeleton cards
        │   ├── VideoCard.jsx      # Track card with hover play & equalizer
        │   └── VideoGrid.jsx      # Responsive 4-column song grid
        ├── context/
        │   ├── FavoritesContext.jsx # LocalStorage-backed favorites store
        │   └── PlayerContext.jsx    # Playback, queue, duration, volume state
        ├── hooks/
        │   ├── useDebounce.js       # Input debounce hook
        │   └── useLocalStorage.js   # Safe, synchronized localStorage hook
        ├── pages/
        │   ├── FavoritesPage.jsx    # Dedicated favorites & Play All page
        │   └── HomePage.jsx         # Search, history, suggestions, and grid
        └── utils/
            ├── api.js               # Client fetch client with error handling
            └── formatters.js        # Time & HTML entity unescaping helpers
```

---

## 🔑 How to Get a YouTube Data API v3 Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** (or create a new project named e.g. `Music App`).
3. In the search bar at the top, search for **YouTube Data API v3** and click **Enable**.
4. In the left navigation, go to **APIs & Services** > **Credentials**.
5. Click **+ CREATE CREDENTIALS** > **API key**.
6. Copy your generated API key.
7. *(Recommended)* Click **Edit API Key** under "API restrictions", select **Restrict key**, check **YouTube Data API v3**, and click **Save**.

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Install All Dependencies
From the root directory:
```bash
npm run install:all
```
*(Or install manually inside each folder: `cd server && npm install`, then `cd ../client && npm install`)*

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
YOUTUBE_API_KEY=your_actual_youtube_api_key_here
CLIENT_URL=http://localhost:5173
```

*(Optional)* Inside `client/.env`:
```env
# Leave empty during local development; Vite dev proxy routes /api to http://localhost:5000 automatically.
VITE_API_BASE_URL=
```

### 3. Run the Development Server
From the root directory, start both the backend server and the frontend client simultaneously:
```bash
npm run dev
```

Alternatively, run them in separate terminal tabs:
```bash
# Terminal 1 (Backend - Port 5000)
npm run dev:server

# Terminal 2 (Frontend - Port 5173)
npm run dev:client
```

Open your browser at:
👉 **`http://localhost:5173`**

---

## 🌐 Production Deployment Guide

### Deploying the Backend (Render or Railway)

#### Deploy to Render
1. Push your code to a GitHub repository.
2. Sign in to [Render](https://render.com/) and click **New +** > **Web Service**.
3. Select your repository.
4. Set the following settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. In **Environment Variables**, add:
   - `PORT`: `5000` (or leave default, Render sets `PORT` automatically)
   - `YOUTUBE_API_KEY`: `<your_youtube_api_key>`
   - `CLIENT_URL`: `<your_frontend_domain_on_vercel_or_netlify>`
6. Deploy and copy your backend URL (e.g. `https://beatstream-api.onrender.com`).

---

### Deploying the Frontend (Vercel or Netlify)

#### Deploy to Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New...** > **Project**.
2. Import your GitHub repository.
3. Configure the Project:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, set:
   - `VITE_API_BASE_URL`: `https://beatstream-api.onrender.com` (your deployed backend URL)
5. Click **Deploy**.

---

## 📜 YouTube Terms of Service Compliance
- This application strictly utilizes the official YouTube IFrame Player API (`react-youtube`).
- Audio is never extracted, downloaded, converted, or decoupled from the official YouTube video player stream.
- No ads or YouTube brand features are blocked or bypassed.
