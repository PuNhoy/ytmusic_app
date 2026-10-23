import React from 'react';
import { AlertCircle, RefreshCw, KeyRound, WifiOff } from 'lucide-react';

export default function ErrorAlert({ error, onRetry }) {
  if (!error) return null;

  const isQuota =
    error.status === 403 ||
    error.code === 'QUOTA_EXCEEDED' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('quota'));

  const isApiKey =
    error.code === 'API_KEY_MISSING' ||
    error.code === 'INVALID_API_KEY' ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('api key'));

  const isNetwork =
    typeof error.message === 'string' &&
    (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('port 5000'));

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 shadow-xl backdrop-blur-md animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
          {isApiKey ? (
            <KeyRound className="w-5 h-5" />
          ) : isNetwork ? (
            <WifiOff className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-sm text-red-200">
            {isQuota
              ? 'YouTube API Quota Exceeded'
              : isApiKey
              ? 'YouTube API Key Required'
              : isNetwork
              ? 'Backend Connection Failed'
              : 'Search Request Failed'}
          </h4>

          <p className="text-xs text-red-300/90 mt-1 leading-relaxed">
            {error.message || 'An unexpected error occurred while fetching music.'}
          </p>

          {isApiKey && (
            <div className="mt-2 text-xs bg-black/40 p-2.5 rounded-lg border border-red-500/20 text-slate-300 font-mono">
              Add your API key to <span className="text-amber-400">server/.env</span>:
              <br />
              <span className="text-emerald-400">YOUTUBE_API_KEY=AIzaSy...</span>
            </div>
          )}

          {isQuota && (
            <p className="mt-2 text-[11px] text-red-400">
              Tip: YouTube limits free tier API projects to 10,000 units/day. The server caches search results for 10 minutes to save quota.
            </p>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-medium border border-red-500/30 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
