import axios from 'axios';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Decodes common HTML entities in strings returned by YouTube Data API.
 * (e.g. &amp; -> &, &quot; -> ", &#39; -> ')
 * @param {string} text
 * @returns {string}
 */
export function decodeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code));
}

/**
 * Parses an ISO 8601 duration (e.g. 'PT3M45S', 'PT1H2M30S', 'PT45S') into human-readable mm:ss / hh:mm:ss
 * and total duration in seconds.
 * @param {string} durationStr
 * @returns {{ formatted: string, seconds: number }}
 */
export function parseDuration(durationStr) {
  if (!durationStr) {
    return { formatted: '0:00', seconds: 0 };
  }

  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = durationStr.match(regex);

  if (!match) {
    return { formatted: '0:00', seconds: 0 };
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return { formatted, seconds: totalSeconds };
}

/**
 * Queries YouTube Data API v3 for music videos matching query.
 * Combines search.list (to discover videos) and videos.list (to obtain exact durations and details).
 *
 * @param {object} params
 * @param {string} params.query - Search keywords
 * @param {string} [params.pageToken] - Optional pagination token
 * @returns {Promise<{ items: Array, nextPageToken: string|null, totalResults: number }>}
 */
export async function searchMusic({ query, pageToken }) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || apiKey === 'your_youtube_api_key_here') {
    const error = new Error(
      'YouTube API Key is missing or unconfigured. Please set YOUTUBE_API_KEY in server/.env file.'
    );
    error.status = 500;
    error.code = 'API_KEY_MISSING';
    throw error;
  }

  try {
    // 1. Search for videos restricted to Music (categoryId 10) and embeddable
    const searchResponse = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '10', // Category 10 = Music
        videoEmbeddable: 'true', // Only videos that can be played in embedded players
        maxResults: 16,
        pageToken: pageToken || undefined,
        key: apiKey,
      },
      timeout: 10000,
    });

    const searchData = searchResponse.data;
    let rawItems = searchData.items || [];

    // Fallback: If 0 results found (can happen with Khmer or regional music videos
    // uploaded under categories other than category 10 Music), retry without category restriction.
    if (rawItems.length === 0 && !pageToken) {
      try {
        const fallbackResponse = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            videoEmbeddable: 'true',
            maxResults: 16,
            key: apiKey,
          },
          timeout: 10000,
        });
        rawItems = fallbackResponse.data?.items || [];
      } catch (fallbackErr) {
        console.warn('Fallback search warning:', fallbackErr.message);
      }
    }

    if (rawItems.length === 0) {
      return {
        items: [],
        nextPageToken: searchData.nextPageToken || null,
        totalResults: searchData.pageInfo?.totalResults || 0,
      };
    }

    // Collect video IDs to fetch content details (duration)
    const videoIds = rawItems
      .map((item) => item.id?.videoId)
      .filter((id) => Boolean(id));

    // 2. Fetch video details (contentDetails for duration, plus high-res snippet info)
    let detailsMap = new Map();
    if (videoIds.length > 0) {
      const videosResponse = await axios.get(`${YOUTUBE_BASE_URL}/videos`, {
        params: {
          part: 'contentDetails,snippet',
          id: videoIds.join(','),
          key: apiKey,
        },
        timeout: 10000,
      });

      const videoList = videosResponse.data.items || [];
      for (const v of videoList) {
        detailsMap.set(v.id, v);
      }
    }

    // 3. Format items cleanly into standardized JSON
    const items = rawItems
      .map((item) => {
        const videoId = item.id?.videoId;
        if (!videoId) return null;

        const detail = detailsMap.get(videoId);
        const snippet = detail?.snippet || item.snippet || {};
        const contentDetails = detail?.contentDetails || {};

        const durationInfo = parseDuration(contentDetails.duration);

        // Pick best available thumbnail
        const thumbs = snippet.thumbnails || {};
        const thumbnail =
          thumbs.medium?.url ||
          thumbs.high?.url ||
          thumbs.standard?.url ||
          thumbs.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          videoId,
          title: decodeHtml(snippet.title || 'Untitled Track'),
          channel: decodeHtml(snippet.channelTitle || 'Unknown Artist'),
          thumbnail,
          duration: durationInfo.formatted,
          durationSeconds: durationInfo.seconds,
          publishedAt: snippet.publishedAt || null,
        };
      })
      .filter(Boolean);

    return {
      items,
      nextPageToken: searchData.nextPageToken || null,
      totalResults: searchData.pageInfo?.totalResults || items.length,
    };
  } catch (err) {
    // Inspect YouTube API error response
    if (err.response) {
      const { status, data } = err.response;
      const apiErrors = data?.error?.errors || [];
      const primaryReason = apiErrors[0]?.reason || '';
      const apiMessage = data?.error?.message || err.message;

      const error = new Error();

      if (status === 403 && primaryReason === 'quotaExceeded') {
        error.message =
          'YouTube API daily quota exceeded. Please try again tomorrow or provide a key with available quota.';
        error.status = 403;
        error.code = 'QUOTA_EXCEEDED';
      } else if (status === 400 && (primaryReason === 'keyInvalid' || primaryReason === 'badRequest')) {
        error.message = 'The provided YouTube API key is invalid or unauthorized.';
        error.status = 401;
        error.code = 'INVALID_API_KEY';
      } else if (status === 403 && primaryReason === 'accessNotConfigured') {
        error.message =
          'YouTube Data API v3 is not enabled in your Google Cloud Console project.';
        error.status = 403;
        error.code = 'API_NOT_ENABLED';
      } else {
        error.message = `YouTube API Error: ${apiMessage}`;
        error.status = status;
        error.code = 'YOUTUBE_API_ERROR';
      }
      throw error;
    }

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      const error = new Error('YouTube API request timed out. Please try again.');
      error.status = 504;
      error.code = 'GATEWAY_TIMEOUT';
      throw error;
    }

    // Default error
    err.status = err.status || 500;
    throw err;
  }
}
