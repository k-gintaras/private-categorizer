// models/database.models.ts
// Direct mapping to your SQLite database schema

/** Tags table */
export interface Tag {
  id: number;
  name: string;
  tag_group: string; // Exactly as in DB
  created_at: string;
}

/** Colors table */
export interface ColorPalette {
  id: number;
  name: string;
  colors: string[]; // JSON string array in DB
  created_at: string;
}

/** Analytics table */
export interface Analytics {
  id: number;
  file_id: number;
  file_type: string; // 'video', 'audio', 'image', 'text'
  last_viewed: string | null;
  total_watch_time: number;
  view_count: number;
  skips: string | null; // JSON string in DB
  scroll_up_count: number | null;
  scroll_down_count: number | null;
  created_at: string;
  updated_at: string;
}

/** Likes table */
export interface Like {
  id: number;
  file_id: number;
  timestamp: number; // Time in seconds within media
  created_at: string;
}

/** Dislikes table */
export interface Dislike {
  id: number;
  file_id: number;
  timestamp: number; // Time in seconds within media
  created_at: string;
}

/** Favorites table */
export interface Favorite {
  id: number;
  file_id: number; // UNIQUE constraint in DB
  created_at: string;
}

/** Files table */
export interface DbFile {
  id: number;
  parent_id: number | null;
  path: string; // UNIQUE in DB
  type: string;
  subtype: string;
  size: number | null;
  last_modified: string | null;
  metadata: string; // JSON string, defaults to '{}'
  created_at: string;
}

/** File_tags junction table */
export interface FileTag {
  file_id: number;
  tag_id: number;
  // UNIQUE constraint on (file_id, tag_id)
}

// ===================================================================
// models/api.models.ts
// For API responses and frontend use
// ===================================================================

/** Parsed color palette (frontend-friendly) */
export interface ParsedColorPalette {
  id: number;
  name: string;
  colors: string[]; // Parsed from JSON
  created_at: string;
}

/** Parsed analytics (frontend-friendly) */
export interface ParsedAnalytics {
  id: number;
  file_id: number;
  file_type: string; // 'video', 'audio', 'image', 'text'
  last_viewed: string | null;
  total_watch_time: number;
  view_count: number;
  skips: Array<{ time: number; count: number }> | null; // Parsed from JSON
  scroll_up_count: number | null;
  scroll_down_count: number | null;
  created_at: string;
  updated_at: string;
}

/** Parsed file with metadata (frontend-friendly) */
export interface ParsedFile {
  id: number;
  parent_id: number | null;
  path: string;
  type: string;
  subtype: string;
  size: number | null;
  last_modified: string | null;
  metadata: Record<string, any>; // Parsed from JSON
  created_at: string;
}

/** Complete file with all relationships */
export interface FullFile extends ParsedFile {
  tags?: Tag[]; // Array of tag IDs from file_tags junction
  likes?: Like[];
  dislikes?: Dislike[];
  favorite?: Favorite | null;
  analytics?: ParsedAnalytics | null;

  // Computed properties
  likeCount?: number;
  dislikeCount?: number;
  isFavorited?: boolean;
}

// ===================================================================
// models/requests.models.ts
// For API request payloads
// ===================================================================

/** Create/update tag request */
export interface TagRequest {
  name: string;
  tag_group: string;
  color: string;
}

/** Update analytics request */
export interface AnalyticsRequest {
  fileId: number;
  fileType: string; // 'video', 'audio', 'image', 'text'
  totalWatchTime?: number;
  skips?: number[]; // Will be JSON.stringify'd
  scrollUpCount?: number;
  scrollDownCount?: number;
}

/** Add like/dislike request */
export interface LikeRequest {
  fileId: number;
  timestamp: number;
}

/** Add favorite request */
export interface FavoriteRequest {
  fileId: number;
}

/** Associate tag with file request */
export interface FileTagRequest {
  fileId: number;
  tagId: number;
}

// ===================================================================
// models/index.ts - Main export
// ===================================================================

// Utility functions
export function parseColorPalette(dbPalette: ColorPalette): ParsedColorPalette {
  return {
    ...dbPalette,
    colors: dbPalette.colors,
  };
}

export function parseAnalytics(dbAnalytics: Analytics): ParsedAnalytics {
  return {
    ...dbAnalytics,
    file_type: dbAnalytics.file_type as 'video' | 'audio' | 'image' | 'text',
    skips: dbAnalytics.skips ? JSON.parse(dbAnalytics.skips) : null,
  };
}

export function parseFile(dbFile: DbFile): ParsedFile {
  return {
    ...dbFile,
    metadata: JSON.parse(dbFile.metadata || '{}'),
  };
}

// Type guards
export function isVideoFile(file: ParsedFile): boolean {
  return file.subtype === 'video';
}

export function isImageFile(file: ParsedFile): boolean {
  return file.subtype === 'image';
}

export function isAudioFile(file: ParsedFile): boolean {
  return file.subtype === 'audio';
}

export function isTextFile(file: ParsedFile): boolean {
  return file.subtype === 'text';
}

export function supportsTimeline(file: ParsedFile): boolean {
  return file.subtype === 'video' || file.subtype === 'audio';
}

// Utility functions
export function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

export function getFileExtension(path: string): string {
  return path.split('.').pop()?.toLowerCase() || '';
}
