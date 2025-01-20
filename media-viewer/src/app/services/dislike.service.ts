import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FileCacheService } from './file-cache.service';
import { SelectedFileService } from './selected-file.service';
import { ApiConfigService } from './api-config.service';
import { Dislike } from '../models/analytics.model';
import { VideoPlayerService } from './video-player.service';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class DislikeService {
  private lastDislikeTimestamp: number | null = null; // Track the last rounded timestamp for a dislike
  private dislikeInterval = 1000; // Minimum interval between dislikes in milliseconds

  constructor(
    private http: HttpClient,
    private fileCacheService: FileCacheService,
    private selectedFileService: SelectedFileService,
    private apiConfig: ApiConfigService,
    private videoPlayerService: VideoPlayerService
  ) {}

  /**
   * Add a dislike to the selected file.
   * @param file The file to dislike
   */
  addDislike(file: FileInfo): Observable<Dislike> {
    const currentTime = Date.now();

    if (
      this.lastDislikeTimestamp &&
      currentTime - this.lastDislikeTimestamp < this.dislikeInterval
    ) {
      throw new Error('Dislikes are throttled to prevent spam.');
    }

    this.lastDislikeTimestamp = currentTime;

    // Determine timestamp based on file type
    const timestamp =
      file.subtype === 'video' || file.subtype === 'audio'
        ? Math.round(this.videoPlayerService.getCurrentPlayTime())
        : currentTime;

    const dislikePayload: Partial<Dislike> = {
      fileId: file.id,
      timestamp,
    };

    return this.http
      .post<Dislike>(
        `${this.apiConfig.getApiBaseUrl()}/dislikes`,
        dislikePayload
      )
      .pipe(
        tap((savedDislike) => {
          console.log('Dislike added:', savedDislike);
          this.updateDislikeInCache(file.id, savedDislike);
        })
      );
  }

  /**
   * Remove a dislike from the selected file and update the cache.
   * @param dislikeId The ID of the dislike to remove
   */
  removeDislike(dislikeId: number): Observable<void> {
    const selectedFile = this.selectedFileService.getSelectedFile();

    if (!selectedFile) {
      throw new Error('No file selected.');
    }

    return this.http
      .delete<void>(`${this.apiConfig.getApiBaseUrl()}/dislikes/${dislikeId}`)
      .pipe(
        tap(() => {
          this.removeDislikeFromCache(selectedFile.id, dislikeId);
        })
      );
  }

  /**
   * Update the cache with the new dislike data.
   * @param fileId The ID of the file to update
   * @param newDislike The dislike object to add
   */
  private updateDislikeInCache(fileId: number, newDislike: Dislike): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedDislikes = [...(file.dislikes || []), newDislike];
      this.fileCacheService.updateDislikes(fileId, updatedDislikes);
    }
  }

  /**
   * Remove a dislike from the cache.
   * @param fileId The ID of the file to update
   * @param dislikeId The ID of the dislike to remove
   */
  private removeDislikeFromCache(fileId: number, dislikeId: number): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedDislikes = (file.dislikes || []).filter(
        (dislike) => dislike.id !== dislikeId
      );
      this.fileCacheService.updateDislikes(fileId, updatedDislikes);
    }
  }
}
