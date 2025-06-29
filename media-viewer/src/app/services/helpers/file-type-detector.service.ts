// services/file-type-detector.service.ts
import { Injectable } from '@angular/core';
import { getFileExtension, ParsedFile } from 'src/app/models';

/** Media subtypes matching your database */
export type MediaSubtype = 'video' | 'audio' | 'image' | 'text';

/** File type detection result */
export interface FileTypeDetection {
  currentSubtype: MediaSubtype;
  detectedSubtype: MediaSubtype;
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low';
}

@Injectable({
  providedIn: 'root',
})
export class FileTypeDetectorService {
  // Simple extension mappings
  private readonly videoExtensions = new Set([
    'mp4',
    'avi',
    'mkv',
    'mov',
    'wmv',
    'webm',
    'flv',
    'm4v',
    'mpg',
    'mpeg',
  ]);

  private readonly audioExtensions = new Set([
    'mp3',
    'wav',
    'flac',
    'aac',
    'm4a',
    'ogg',
    'wma',
    'opus',
  ]);

  private readonly imageExtensions = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'svg',
    'webp',
    'tiff',
    'ico',
  ]);

  private readonly textExtensions = new Set([
    'txt',
    'md',
    'pdf',
    'doc',
    'docx',
    'rtf',
    'html',
    'json',
    'xml',
  ]);

  /**
   * Detect file type from extension
   */
  detectFromExtension(filePath: string): MediaSubtype {
    const extension = getFileExtension(filePath);

    if (this.videoExtensions.has(extension)) return 'video';
    if (this.audioExtensions.has(extension)) return 'audio';
    if (this.imageExtensions.has(extension)) return 'image';
    if (this.textExtensions.has(extension)) return 'text';

    return 'text'; // Default fallback
  }

  /**
   * Validate a single file's type
   */
  validateFile(file: ParsedFile): FileTypeDetection {
    const detectedType = this.detectFromExtension(file.path);
    const isCorrect = file.subtype === detectedType;

    return {
      currentSubtype: file.subtype as MediaSubtype,
      detectedSubtype: detectedType,
      isCorrect,
      confidence: 'high', // Simple - always high confidence for these common extensions
    };
  }

  /**
   * Get corrected file with proper subtype
   */
  getCorrectedFile(file: ParsedFile): ParsedFile {
    const detected = this.detectFromExtension(file.path);

    if (file.subtype === detected) {
      return file; // Already correct
    }

    return {
      ...file,
      subtype: detected,
    };
  }

  /**
   * Check if file is a video
   */
  isVideo(file: ParsedFile): boolean {
    return this.detectFromExtension(file.path) === 'video';
  }

  /**
   * Check if file is an image
   */
  isImage(file: ParsedFile): boolean {
    return this.detectFromExtension(file.path) === 'image';
  }

  /**
   * Check if file is audio
   */
  isAudio(file: ParsedFile): boolean {
    return this.detectFromExtension(file.path) === 'audio';
  }

  /**
   * Check if file is text/document
   */
  isText(file: ParsedFile): boolean {
    return this.detectFromExtension(file.path) === 'text';
  }

  /**
   * Get files that need type correction
   */
  getFilesNeedingCorrection(files: ParsedFile[]): ParsedFile[] {
    return files.filter((file) => !this.validateFile(file).isCorrect);
  }

  /**
   * Get simple statistics
   */
  getTypeStats(files: ParsedFile[]): Record<MediaSubtype, number> {
    const stats: Record<MediaSubtype, number> = {
      video: 0,
      audio: 0,
      image: 0,
      text: 0,
    };

    files.forEach((file) => {
      const actualType = this.detectFromExtension(file.path);
      stats[actualType]++;
    });

    return stats;
  }
}
