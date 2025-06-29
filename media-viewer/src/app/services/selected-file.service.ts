import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FullFile } from '../models';
import { FileCacheService } from './file-cache.service';
import { AnalyticsService } from './video-analytics.service';

@Injectable({
  providedIn: 'root',
})
export class SelectedFileService implements OnDestroy {
  private selectedFileSubject = new BehaviorSubject<FullFile | null>(null);
  selectedFile$ = this.selectedFileSubject.asObservable();

  constructor(
    private analyticsService: AnalyticsService,
    private fileCacheService: FileCacheService
  ) {}

  /**
   * Select a new file by loading its full data.
   * @param fileId The ID of the file to select.
   */
  selectFile(fileId: number): void {
    this.fileCacheService.fetchFullFileData(fileId).subscribe({
      next: (file) => {
        this.selectedFileSubject.next(file);
        // Optionally increment view count or other analytics here
        // this.analyticsService.incrementViewCount(file.id, file.subtype);
      },
      error: (err) => {
        console.error(`Failed to fetch full data for file ID ${fileId}:`, err);
      },
    });
  }

  /**
   * Get the currently selected file synchronously.
   */
  getSelectedFile(): FullFile | null {
    return this.selectedFileSubject.value;
  }

  ngOnDestroy(): void {
    const currentFile = this.getSelectedFile();
    if (currentFile) {
      this.analyticsService.saveAnalytics();
    }
  }
}
