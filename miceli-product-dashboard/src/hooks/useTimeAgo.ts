import { useState, useEffect } from 'react';

const formatTimeAgo = (isoDate: string | null | undefined): string => {
  if (!isoDate) return 'never';

  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return 'just now';
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const useTimeAgo = (isoDate: string): string => {
  const [timeAgo, setTimeAgo] = useState(() => formatTimeAgo(isoDate));

  useEffect(() => {
    // Set the initial value
    setTimeAgo(formatTimeAgo(isoDate));

    // Update the value every 5 seconds
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(isoDate));
    }, 5000); // 5000ms = 5 seconds

    // Cleanup the interval when the component unmounts or the date changes
    return () => clearInterval(interval);
  }, [isoDate]); // Rerun effect if the isoDate prop changes

  return timeAgo;
};