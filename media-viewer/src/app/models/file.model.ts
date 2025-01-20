import { Like, BaseAnalytics, Tag, Dislike, Favorite } from './analytics.model';

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
  dislikes?: Dislike[]; // Associated likes
  favorite?: Favorite | null;
  analytics?: BaseAnalytics; // Associated analytics data
  isFull?: boolean; // Optional: Flag indicating if detailed info is fetched
}
