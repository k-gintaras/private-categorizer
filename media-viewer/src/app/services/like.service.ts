import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FileCacheService } from './file-cache.service';
import { SelectedFileService } from './selected-file.service';
import { ApiConfigService } from './api-config.service';
import { Like } from '../models/analytics.model';
import { VideoPlayerService } from './video-player.service';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class LikeService {
  private lastLikeTimestamp: number | null = null; // Track the last rounded timestamp for a like
  private likeInterval = 1000; // Minimum interval between likes in milliseconds

  constructor(
    private http: HttpClient,
    private fileCacheService: FileCacheService,
    private selectedFileService: SelectedFileService,
    private apiConfig: ApiConfigService,
    private videoPlayerService: VideoPlayerService
  ) {}

  addLike(file: FileInfo): Observable<Like> {
    const currentTime = Date.now();

    if (
      this.lastLikeTimestamp &&
      currentTime - this.lastLikeTimestamp < this.likeInterval
    ) {
      throw new Error('Likes are throttled to prevent spam.');
    }

    this.lastLikeTimestamp = currentTime;

    // Determine timestamp based on file type
    const timestamp =
      file.subtype === 'video' || file.subtype === 'audio'
        ? Math.round(this.videoPlayerService.getCurrentPlayTime())
        : currentTime;

    const likePayload: Partial<Like> = {
      fileId: file.id,
      timestamp,
    };

    return this.http
      .post<Like>(`${this.apiConfig.getApiBaseUrl()}/likes`, likePayload)
      .pipe(
        tap((savedLike) => {
          console.log('Like added:', savedLike);
        })
      );
  }

  /**
   * Remove a like from the selected file and update the cache.
   * @param likeId The ID of the like to remove
   */
  removeLike(likeId: number): Observable<void> {
    const selectedFile = this.selectedFileService.getSelectedFile();

    if (!selectedFile) {
      throw new Error('No file selected.');
    }

    return this.http
      .delete<void>(`${this.apiConfig.getApiBaseUrl()}/likes/${likeId}`)
      .pipe(
        // After removing the like, update the cache
        tap(() => {
          this.removeLikeFromCache(selectedFile.id, likeId);
        })
      );
  }

  /**
   * Update the cache with the new like data.
   * @param fileId The ID of the file to update
   * @param newLike The like object to add
   */
  private updateLikeInCache(fileId: number, newLike: Like): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedLikes = [...(file.likes || []), newLike];
      this.fileCacheService.updateLikes(fileId, updatedLikes);
    }
  }

  /**
   * Remove a like from the cache.
   * @param fileId The ID of the file to update
   * @param likeId The ID of the like to remove
   */
  private removeLikeFromCache(fileId: number, likeId: number): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedLikes = (file.likes || []).filter(
        (like) => like.id !== likeId
      );
      this.fileCacheService.updateLikes(fileId, updatedLikes);
    }
  }
}
