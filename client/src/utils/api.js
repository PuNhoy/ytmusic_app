const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Searches YouTube music via our backend API.
 * @param {string} query - The search keywords
 * @param {string|null} [pageToken=null] - Next page token for pagination
 * @returns {Promise<{ items: Array, nextPageToken: string|null, totalResults: number }>}
 */
export async function searchSongs(query, pageToken = null) {
  if (!query || !query.trim()) {
    throw new Error('Please enter a search term.');
  }

  const url = new URL(`${API_BASE_URL}/api/search`, window.location.origin);
  url.searchParams.set('q', query.trim());
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
  } catch (netErr) {
    throw new Error(
      'Network error: Unable to reach the backend server. Please verify the server is running on port 5000.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data.message ||
      data.error ||
      `Request failed with status code ${response.status} (${response.statusText})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = data.error;
    throw error;
  }

  return data;
}

/* =========================================================================
   PostgreSQL Database API Endpoints
   ========================================================================= */

// --- Favorites API ---

export async function getDbFavorites() {
  const res = await fetch(`${API_BASE_URL}/api/favorites`);
  if (!res.ok) throw new Error('Failed to fetch favorites from database');
  const data = await res.json();
  return data.items || [];
}

export async function addDbFavorite(song) {
  const res = await fetch(`${API_BASE_URL}/api/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error('Failed to save favorite to database');
  return res.json();
}

export async function removeDbFavorite(videoId) {
  const res = await fetch(`${API_BASE_URL}/api/favorites/${videoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove favorite from database');
  return res.json();
}

export async function clearDbFavorites() {
  const res = await fetch(`${API_BASE_URL}/api/favorites`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear favorites from database');
  return res.json();
}

// --- Search History API ---

export async function getDbHistory() {
  const res = await fetch(`${API_BASE_URL}/api/history`);
  if (!res.ok) throw new Error('Failed to fetch search history from database');
  const data = await res.json();
  return data.history || [];
}

export async function addDbHistory(searchQuery) {
  const res = await fetch(`${API_BASE_URL}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: searchQuery }),
  });
  if (!res.ok) throw new Error('Failed to save search history to database');
  return res.json();
}

export async function removeDbHistoryItem(term) {
  const res = await fetch(`${API_BASE_URL}/api/history/${encodeURIComponent(term)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete search history item');
  return res.json();
}

export async function clearDbHistory() {
  const res = await fetch(`${API_BASE_URL}/api/history`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear search history');
  return res.json();
}

// --- Playlists API ---

export async function getPlaylists() {
  const res = await fetch(`${API_BASE_URL}/api/playlists`);
  if (!res.ok) throw new Error('Failed to fetch playlists');
  const data = await res.json();
  return data.playlists || [];
}

export async function createPlaylist(name, description = '') {
  const res = await fetch(`${API_BASE_URL}/api/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create playlist');
  return res.json();
}

export async function getPlaylistDetails(id) {
  const res = await fetch(`${API_BASE_URL}/api/playlists/${id}`);
  if (!res.ok) throw new Error('Failed to fetch playlist details');
  return res.json();
}

export async function addTrackToPlaylist(id, song) {
  const res = await fetch(`${API_BASE_URL}/api/playlists/${id}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(song),
  });
  if (!res.ok) throw new Error('Failed to add track to playlist');
  return res.json();
}

export async function removeTrackFromPlaylist(id, videoId) {
  const res = await fetch(`${API_BASE_URL}/api/playlists/${id}/tracks/${videoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove track from playlist');
  return res.json();
}
