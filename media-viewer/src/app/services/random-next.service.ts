import { Injectable } from '@angular/core';
import { SelectedFileService } from './selected-file.service';
import { FileCacheService } from './file-cache.service';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class RandomNextService {
  private files: FileInfo[] = []; // Store file IDs
  private lastPlayedFileId: number | null = null; // Track the last played file ID

  constructor(
    private selectedFileService: SelectedFileService,
    private fileService: FileCacheService
  ) {
    this.fetchFiles();
  }

  /**
   * Fetch all files from the server and filter for supported video formats.
   */
  fetchFiles(): void {
    this.fileService.fetchFiles().subscribe((data) => {
      this.files = data;
    });
  }

  /**
   * Check if a file is a supported video format.
   * @param path File path
   * @returns true if the file is supported
   */
  isSupportedVideo(path: string): boolean {
    return path.endsWith('.mp4');
  }

  /**
   * Select the next random file, avoiding repetition of the last played file.
   */
  playNextRandom(): void {
    if (this.files.length === 0) {
      console.warn('No files available for playback.');
      return;
    }

    let nextFile: FileInfo;

    do {
      nextFile = this.files[Math.floor(Math.random() * this.files.length)];
    } while (this.files.length > 1 && nextFile.id === this.lastPlayedFileId);

    this.lastPlayedFileId = nextFile.id; // Update last played file ID
    this.selectedFileService.selectFile(nextFile.id); // Notify the selected file service
  }
}
