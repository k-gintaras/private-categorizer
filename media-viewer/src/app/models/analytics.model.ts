export interface BaseAnalytics {
  fileId: number; // Unique ID of the associated file
  fileType: 'video' | 'audio' | 'image' | 'text'; // Type of file the analytics belong to
  lastViewed: string | null; // ISO timestamp of the last view or null if never viewed
  totalWatchTime: number; // Total engagement time in seconds
  viewCount: number; // Total number of views
  skips?: number[]; // Optional: Array of skip timestamps (for video/audio)
  scrollUpCount?: number; // Optional: Count of scroll-ups (for image/text)
  scrollDownCount?: number; // Optional: Count of scroll-downs (for image/text)
}

export interface Like {
  id: number;
  fileId: number; // ID of the associated file
  timestamp: number; // Time in seconds where the like occurred (for video/audio)
  createdAt: string; // ISO string representing when the like was added
}
