import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FileInfo } from '../models/file.model';
import { FileCacheService } from './file-cache.service';
import { AnalyticsService } from './video-analytics.service';

@Injectable({
  providedIn: 'root',
})
export class SelectedFileService implements OnDestroy {
  private selectedFileSubject = new BehaviorSubject<FileInfo | null>(null);
  selectedFile$ = this.selectedFileSubject.asObservable();

  constructor(
    private analyticsService: AnalyticsService,
    private fileCacheService: FileCacheService
  ) {}

  /**
   * Select a new file by loading its full data and syncing analytics of the previous file.
   * @param fileId The ID of the new file to select.
   */
  selectFile(fileId: number): void {
    // Fetch full file data and set it as the selected file
    this.fileCacheService.fetchFullFileData(fileId).subscribe({
      next: (file) => {
        this.selectedFileSubject.next(file);
        // this.analyticsService.incrementViewCount(file.id, file.subtype);
      },
      error: (err) => {
        console.error(`Failed to fetch full data for file ID ${fileId}:`, err);
      },
    });
  }

  /**
   * Get the currently selected file synchronously.
   * @returns The selected file or null if no file is selected.
   */
  getSelectedFile(): FileInfo | null {
    return this.selectedFileSubject.value;
  }

  /**
   * Cleanup and save analytics for the current file when the service is destroyed.
   */
  ngOnDestroy(): void {
    const currentFile = this.getSelectedFile();
    if (currentFile) {
      this.analyticsService.saveAnalytics();
    }
  }
}
