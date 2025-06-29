import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { FileCacheService } from './file-cache.service';
import { SelectedFileService } from './selected-file.service';
import { ApiConfigService } from './api-config.service';
import { VideoPlayerService } from './video-player.service';
import { Dislike, DbFile } from '../models'; // Import your types here

@Injectable({
  providedIn: 'root',
})
export class DislikeService {
  private lastDislikeTimestamp: number | null = null;
  private dislikeInterval = 1000; // 1 second throttle

  constructor(
    private http: HttpClient,
    private fileCacheService: FileCacheService,
    private selectedFileService: SelectedFileService,
    private apiConfig: ApiConfigService,
    private videoPlayerService: VideoPlayerService
  ) {}

  addDislike(fileId: number, isPlayable: boolean): Observable<Dislike> {
    const currentTime = Date.now();

    if (
      this.lastDislikeTimestamp &&
      currentTime - this.lastDislikeTimestamp < this.dislikeInterval
    ) {
      return throwError(
        () => new Error('Dislikes are throttled to prevent spam.')
      );
    }

    this.lastDislikeTimestamp = currentTime;

    const timestamp =
      isPlayable
        ? Math.round(this.videoPlayerService.getCurrentPlayTime())
        : Math.floor(currentTime / 1000); // Convert ms to seconds for consistency

    const dislikePayload = {
      fileId: fileId,
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
          this.updateDislikeInCache(fileId, savedDislike);
        })
      );
  }

  removeDislike(dislikeId: number): Observable<void> {
    const selectedFile = this.selectedFileService.getSelectedFile();

    if (!selectedFile) {
      return throwError(() => new Error('No file selected.'));
    }

    return this.http
      .delete<void>(`${this.apiConfig.getApiBaseUrl()}/dislikes/${dislikeId}`)
      .pipe(
        tap(() => {
          this.removeDislikeFromCache(selectedFile.id, dislikeId);
        })
      );
  }

  private updateDislikeInCache(fileId: number, newDislike: Dislike): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedDislikes = [...(file.dislikes || []), newDislike];
      this.fileCacheService.updateDislikes(fileId, updatedDislikes);
    }
  }

  private removeDislikeFromCache(fileId: number, dislikeId: number): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      const updatedDislikes = (file.dislikes || []).filter(
        (d: any) => d.id !== dislikeId
      );
      this.fileCacheService.updateDislikes(fileId, updatedDislikes);
    }
  }
}
