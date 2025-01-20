import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { FileInfo } from '../models/file.model';
import {
  BaseAnalytics,
  Dislike,
  Favorite,
  Like,
} from '../models/analytics.model';
import { Tag } from '../models/tag.model';

@Injectable({
  providedIn: 'root',
})
export class FileCacheService {
  private filesSubject = new BehaviorSubject<FileInfo[]>([]);
  files$ = this.filesSubject.asObservable();

  private filesCache: FileInfo[] = [];

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Fetch the basic list of files (without detailed data like tags, analytics, likes).
   */
  fetchFiles(): Observable<FileInfo[]> {
    if (this.filesCache.length > 0) {
      return this.files$; // Return cached files if available
    }

    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files`;

    this.http.get<FileInfo[]>(apiUrl).subscribe((files) => {
      this.filesCache = files.map((file) => ({
        ...file,
        isFull: false, // Mark as partial
        tags: [],
        likes: [],
      }));
      this.filesSubject.next(this.filesCache);
    });

    return this.files$;
  }

  /**
   * Fetch detailed data for a specific file.
   * @param fileId The ID of the file to fetch
   */
  fetchFullFileData(fileId: number): Observable<FileInfo> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files/${fileId}/full`;

    return new Observable((observer) => {
      this.http.get<FileInfo>(apiUrl).subscribe((file) => {
        const updatedFile: FileInfo = {
          ...file,
          isFull: true,
          tags: file.tags || [],
          analytics: file.analytics || undefined, // Include only if exists
          likes: file.likes || [],
        };

        this.updateFile(updatedFile);
        observer.next(updatedFile);
        observer.complete();
      });
    });
  }

  /**
   * Get a file from the cache by its ID.
   * @param fileId The file ID
   */
  getFileById(fileId: number): FileInfo | undefined {
    return this.filesCache.find((file) => file.id === fileId);
  }

  /**
   * Update the analytics of a specific file.
   */
  updateAnalytics(fileId: number, newAnalytics: BaseAnalytics): void {
    const file = this.filesCache.find((file) => file.id === fileId);
    if (file) {
      file.analytics = newAnalytics;
      this.updateFile(file);
    }
  }

  /**
   * Update the likes of a specific file.
   */
  updateLikes(fileId: number, newLikes: Like[]): void {
    const file = this.filesCache.find((file) => file.id === fileId);
    if (file) {
      file.likes = newLikes;
      this.updateFile(file);
    }
  }

  updateFavorite(fileId: number, favorite: Favorite | null): void {
    const file = this.filesCache.find((file) => file.id === fileId);
    if (file) {
      file.favorite = favorite;
      this.updateFile(file);
    }
  }

  updateDislikes(fileId: number, updatedDislikes: Dislike[]) {
    const file = this.filesCache.find((file) => file.id === fileId);
    if (file) {
      file.dislikes = updatedDislikes;
      this.updateFile(file);
    }
  }

  /**
   * Update the likes of a specific file.
   */
  updateTags(fileId: number, newTags: Tag[]): void {
    const file = this.filesCache.find((file) => file.id === fileId);
    if (file) {
      file.tags = newTags;
      this.updateFile(file);
    }
  }

  /**
   * Update a specific file in the cache.
   * @param updatedFile The file to update
   */
  private updateFile(updatedFile: FileInfo): void {
    const index = this.filesCache.findIndex(
      (file) => file.id === updatedFile.id
    );
    if (index !== -1) {
      this.filesCache[index] = updatedFile;
    } else {
      this.filesCache.push(updatedFile);
    }
    this.filesSubject.next([...this.filesCache]);
  }

  /**
   * Extract the file name from a full path.
   * @param fullPath The full file path
   */
  public getFileName(fullPath: string): string {
    return fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
  }
}
