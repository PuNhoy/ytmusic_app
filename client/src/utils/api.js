const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Searches YouTube music via our backend API.
 * In dev, calls '/api/search' proxied by Vite to Express on port 5000.
 * In prod, uses VITE_API_BASE_URL if set.
 *
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
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (netErr) {
    throw new Error(
      'Network error: Unable to reach the backend server. Please verify the server is running on port 5000.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If backend sent a formatted error message
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
