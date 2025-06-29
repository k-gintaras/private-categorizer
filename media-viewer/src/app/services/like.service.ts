import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { FileCacheService } from './file-cache.service';
import { SelectedFileService } from './selected-file.service';
import { ApiConfigService } from './api-config.service';
import { Like, DbFile } from '../models';
import { VideoPlayerService } from './video-player.service';

@Injectable({
  providedIn: 'root',
})
export class LikeService {
  private lastLikeTimestamp: number | null = null;
  private likeInterval = 1000; // 1 second throttle

  constructor(
    private http: HttpClient,
    private fileCacheService: FileCacheService,
    private selectedFileService: SelectedFileService,
    private apiConfig: ApiConfigService,
    private videoPlayerService: VideoPlayerService
  ) {}

  addLike(fileId: number, isPlayable: boolean): Observable<Like> {
    const currentTime = Date.now();

    if (
      this.lastLikeTimestamp &&
      currentTime - this.lastLikeTimestamp < this.likeInterval
    ) {
      return throwError(
        () => new Error('Likes are throttled to prevent spam.')
      );
    }

    this.lastLikeTimestamp = currentTime;

    const timestamp = isPlayable
      ? Math.round(this.videoPlayerService.getCurrentPlayTime())
      : Math.floor(currentTime / 1000); // Use seconds for consistency

    const likePayload = {
      fileId: fileId,
      timestamp,
    };

    return this.http
      .post<Like>(`${this.apiConfig.getApiBaseUrl()}/likes`, likePayload)
      .pipe(
        tap((savedLike) => {
          console.log('Like added:', savedLike);
          this.updateLikeInCache(fileId, savedLike);
        })
      );
  }

  removeLike(likeId: number): Observable<void> {
    const selectedFile = this.selectedFileService.getSelectedFile();

    if (!selectedFile) {
      return throwError(() => new Error('No file selected.'));
    }

    return this.http
      .delete<void>(`${this.apiConfig.getApiBaseUrl()}/likes/${likeId}`)
      .pipe(
        tap(() => {
          this.removeLikeFromCache(selectedFile.id, likeId);
        })
      );
  }

  private updateLikeInCache(fileId: number, newLike: Like): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedLikes = [...(file.likes || []), newLike];
      this.fileCacheService.updateLikes(fileId, updatedLikes);
    }
  }

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
