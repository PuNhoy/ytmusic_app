import React from 'react';
import VideoCard from './VideoCard';

export default function VideoGrid({ songs = [], queueList = null }) {
  if (!songs || songs.length === 0) return null;

  const currentQueue = queueList || songs;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {songs.map((song, index) => (
        <VideoCard
          key={`${song.videoId}-${index}`}
          song={song}
          queueList={currentQueue}
          index={index}
        />
      ))}
    </div>
  );
}
