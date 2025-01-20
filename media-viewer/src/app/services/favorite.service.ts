import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FileCacheService } from './file-cache.service';
import { SelectedFileService } from './selected-file.service';
import { ApiConfigService } from './api-config.service';
import { Favorite } from '../models/analytics.model';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  constructor(
    private http: HttpClient,
    private fileCacheService: FileCacheService,
    private selectedFileService: SelectedFileService,
    private apiConfig: ApiConfigService
  ) {}

  /**
   * Add a favorite for the selected file.
   * Only one favorite is allowed per file.
   * @param file The file to mark as favorite
   */
  addFavorite(file: FileInfo): Observable<Favorite> {
    const favoritePayload: Partial<Favorite> = {
      fileId: file.id,
    };

    return this.http
      .post<Favorite>(
        `${this.apiConfig.getApiBaseUrl()}/favorites`,
        favoritePayload
      )
      .pipe(
        tap((savedFavorite) => {
          console.log('Favorite added:', savedFavorite);
          this.updateFavoriteInCache(file.id, savedFavorite);
        })
      );
  }

  /**
   * Remove a favorite for the selected file.
   * @param fileId The ID of the file to unmark as favorite
   */
  removeFavorite(fileId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiConfig.getApiBaseUrl()}/favorites/${fileId}`)
      .pipe(
        tap(() => {
          this.removeFavoriteFromCache(fileId);
        })
      );
  }

  /**
   * Fetch the favorite for a specific file.
   * @param fileId The ID of the file
   */
  getFavorite(fileId: number): Observable<Favorite | null> {
    return this.http
      .get<Favorite>(`${this.apiConfig.getApiBaseUrl()}/favorites/${fileId}`)
      .pipe(
        tap((favorite) => {
          console.log('Fetched favorite:', favorite);
          if (favorite) {
            this.updateFavoriteInCache(fileId, favorite);
          }
        }),
        catchError((error) => {
          if (error.status === 404) {
            console.log('No favorite found for fileId:', fileId);
            this.removeFavoriteFromCache(fileId);
            return of(null);
          }
          throw error;
        })
      );
  }

  /**
   * Update the cache with the favorite data.
   * @param fileId The ID of the file to update
   * @param favorite The favorite object to add
   */
  private updateFavoriteInCache(fileId: number, favorite: Favorite): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      file.favorite = favorite;
      this.fileCacheService.updateFavorite(fileId, favorite);
    }
  }

  /**
   * Remove the favorite from the cache.
   * @param fileId The ID of the file to update
   */
  private removeFavoriteFromCache(fileId: number): void {
    const file = this.fileCacheService.getFileById(fileId);

    if (file) {
      file.favorite = null;
      this.fileCacheService.updateFavorite(fileId, null);
    }
  }
}
