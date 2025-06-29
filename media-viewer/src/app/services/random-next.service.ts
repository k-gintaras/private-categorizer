import { Injectable } from '@angular/core';
import { SelectedFileService } from './selected-file.service';
import { FileCacheService } from './file-cache.service';
import { FullFile } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RandomNextService {
  private files: FullFile[] = [];
  private lastPlayedFileId: number | null = null;
  private shuffledFiles: FullFile[] = [];
  private currentIndex = 0;

  constructor(
    private selectedFileService: SelectedFileService,
    private fileService: FileCacheService
  ) {
    this.fetchFiles();
  }

  fetchFiles(): void {
    this.fileService.fetchFiles().subscribe((data) => {
      this.files = data.filter((file) => this.isSupportedVideo(file.path));
      this.shuffleFiles();
    });
  }

  private shuffleFiles(): void {
    this.shuffledFiles = [...this.files];
    for (let i = this.shuffledFiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledFiles[i], this.shuffledFiles[j]] = [
        this.shuffledFiles[j],
        this.shuffledFiles[i],
      ];
    }
    this.currentIndex = 0;
  }

  playNextRandom(): void {
    if (this.shuffledFiles.length === 0) {
      console.warn('No files available for playback.');
      return;
    }

    const nextFile = this.shuffledFiles[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.shuffledFiles.length;
    this.lastPlayedFileId = nextFile.id;
    this.selectedFileService.selectFile(nextFile.id);
  }

  isSupportedVideo(path: string): boolean {
    return path.toLowerCase().endsWith('.mp4');
  }
}
