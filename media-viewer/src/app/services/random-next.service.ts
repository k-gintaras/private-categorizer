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
  private shuffledFiles: FileInfo[] = []; // Store the shuffled file list
  private currentIndex = 0; // Track the current position in the shuffled list

  constructor(
    private selectedFileService: SelectedFileService,
    private fileService: FileCacheService
  ) {
    this.fetchFiles();
  }

  /**
   * Fetch all files from the server and filter for supported video formats, then shuffle the list.
   */
  fetchFiles(): void {
    this.fileService.fetchFiles().subscribe((data) => {
      this.files = data.filter((file) => this.isSupportedVideo(file.path)); // Filter supported videos
      this.shuffleFiles(); // Shuffle files after fetching
    });
  }

  /**
   * Shuffle the file list for random unique playback.
   */
  private shuffleFiles(): void {
    this.shuffledFiles = [...this.files];
    for (let i = this.shuffledFiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledFiles[i], this.shuffledFiles[j]] = [
        this.shuffledFiles[j],
        this.shuffledFiles[i],
      ];
    }
    this.currentIndex = 0; // Reset the index
  }

  /**
   * Select the next random file, cycling through the shuffled list.
   */
  playNextRandom(): void {
    if (this.shuffledFiles.length === 0) {
      console.warn('No files available for playback.');
      return;
    }

    // Select the next file in the shuffled list
    const nextFile = this.shuffledFiles[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.shuffledFiles.length; // Increment index cyclically

    this.lastPlayedFileId = nextFile.id; // Update last played file ID
    this.selectedFileService.selectFile(nextFile.id); // Notify the selected file service
  }

  /**
   * Check if a file is a supported video format.
   * @param path File path
   * @returns true if the file is supported
   */
  isSupportedVideo(path: string): boolean {
    return path.endsWith('.mp4');
  }
}
