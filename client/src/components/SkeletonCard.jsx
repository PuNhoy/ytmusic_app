import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-video w-full rounded-xl bg-slate-800 mb-3 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent animate-shimmer" />
      </div>

      {/* Title Skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-slate-800 rounded-md w-11/12" />
        <div className="h-4 bg-slate-800 rounded-md w-3/4" />
      </div>

      {/* Channel Skeleton */}
      <div className="h-3 bg-slate-800/80 rounded-md w-1/2 mb-4" />

      {/* Footer Actions Skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-auto">
        <div className="w-5 h-5 bg-slate-800 rounded" />
        <div className="w-5 h-5 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
