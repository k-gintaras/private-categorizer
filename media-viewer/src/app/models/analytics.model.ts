// Represents basic analytics data for any file type
export interface BaseAnalytics {
  id: number; // Primary key in the analytics table
  fileId: number; // Foreign key linking to the files table
  fileType: 'video' | 'audio' | 'image' | 'text'; // Type of file
  lastViewed: string | null; // Timestamp (ISO format) of the last view, or null
  totalWatchTime: number; // Total engagement time in seconds
  viewCount: number; // Number of views
  skips?: { time: number; count: number }[]; // Optional: Skip data for video/audio
  scrollUpCount?: number; // Optional: Scroll-ups for image/text
  scrollDownCount?: number; // Optional: Scroll-downs for image/text
  createdAt: string; // Timestamp of analytics creation
  updatedAt: string; // Timestamp of last analytics update
}

// Represents a "like" entry
export interface Like {
  id: number; // Primary key in the likes table
  fileId: number; // Foreign key linking to the files table
  timestamp: number; // Time in seconds where the like occurred (video/audio context)
  createdAt: string; // Timestamp when the like was added
}

export interface Dislike {
  id: number;
  fileId: number;
  timestamp: number;
  createdAt?: string;
}
export interface Favorite {
  id: number;
  fileId: number;
  timestamp: number;
  createdAt?: string;
}

// Represents a color palette entry
export interface ColorPalette {
  id: number; // Primary key in the colors table
  name: string; // Name of the color palette
  colors: string[]; // Array of hex color codes (JSON-encoded in the DB)
  createdAt: string; // Timestamp when the palette was created
}

// Represents a tag entry
export interface Tag {
  id: number; // Primary key in the tags table
  name: string; // Name of the tag
  tagGroup: string; // Group or category the tag belongs to
  createdAt: string; // Timestamp when the tag was created
}

// Represents a file entry
export interface FileInfo {
  id: number; // Primary key in the files table
  parentId?: number; // Optional: Foreign key for hierarchical file structure
  path: string; // Unique file path
  type: string; // General type of the file (e.g., "media", "document")
  subtype: 'video' | 'audio' | 'image' | 'text'; // Specific subtype
  size?: number; // Optional: File size in bytes
  lastModified?: string; // Optional: Timestamp of the last modification
  metadata?: Record<string, any>; // JSON metadata stored in the database
  createdAt: string; // Timestamp of file creation
  tags?: Tag[]; // Associated tags (via file_tags junction table)
  likes?: Like[]; // Associated likes
  analytics?: BaseAnalytics; // Associated analytics data
  isFull?: boolean; // Optional: Flag indicating if detailed info is fetched
}
