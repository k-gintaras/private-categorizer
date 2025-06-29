import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FileCacheService } from './file-cache.service';
import { ApiConfigService } from './api-config.service';
import { Favorite, DbFile } from '../models'; // Adjust imports as needed

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  constructor(
    private http: HttpClient,
    private fileCacheService: FileCacheService,
    private apiConfig: ApiConfigService
  ) {}

  addFavorite(fileId: number, isPlayable: boolean): Observable<Favorite> {
    const payload = { fileId };
    return this.http
      .post<Favorite>(`${this.apiConfig.getApiBaseUrl()}/favorites`, payload)
      .pipe(
        tap((fav) => {
          console.log('Favorite added:', fav);
          this.updateFavoriteInCache(fileId, fav);
        })
      );
  }

  removeFavorite(fileId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiConfig.getApiBaseUrl()}/favorites/${fileId}`)
      .pipe(
        tap(() => {
          this.removeFavoriteFromCache(fileId);
        })
      );
  }

  getFavorite(fileId: number): Observable<Favorite | null> {
    return this.http
      .get<Favorite>(`${this.apiConfig.getApiBaseUrl()}/favorites/${fileId}`)
      .pipe(
        tap((fav) => {
          console.log('Fetched favorite:', fav);
          this.updateFavoriteInCache(fileId, fav);
        }),
        catchError((error) => {
          if (error.status === 404) {
            console.log(`No favorite found for fileId: ${fileId}`);
            this.removeFavoriteFromCache(fileId);
            return of(null);
          }
          return throwError(() => error);
        })
      );
  }

  private updateFavoriteInCache(
    fileId: number,
    favorite: Favorite | null
  ): void {
    const file = this.fileCacheService.getFileById(fileId);
    if (file) {
      file.favorite = favorite;
      this.fileCacheService.updateFavorite(fileId, favorite);
    }
  }

  private removeFavoriteFromCache(fileId: number): void {
    const file = this.fileCacheService.getFileById(fileId);
    if (file) {
      file.favorite = null;
      this.fileCacheService.updateFavorite(fileId, null);
    }
  }
}
