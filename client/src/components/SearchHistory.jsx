import React from 'react';
import { History, Trash2, X } from 'lucide-react';

export default function SearchHistory({
  history = [],
  onSelectSearch,
  onRemoveItem,
  onClearAll,
}) {
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-3">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
        <span className="flex items-center gap-1.5 font-medium">
          <History className="w-3.5 h-3.5 text-brand-400" />
          Recent Searches
        </span>
        <button
          onClick={onClearAll}
          className="hover:text-red-400 transition-colors flex items-center gap-1"
          title="Clear all recent searches"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {history.slice(0, 10).map((term, index) => (
          <div
            key={`${term}-${index}`}
            className="group flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <span
              onClick={() => onSelectSearch(term)}
              className="hover:text-brand-300 transition-colors select-none"
            >
              {term}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveItem(term);
              }}
              className="text-slate-500 hover:text-red-400 p-0.5 rounded-full transition-colors"
              title={`Remove "${term}" from history`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
