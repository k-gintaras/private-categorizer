import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import {
  FullFile,
  Like,
  Dislike,
  Favorite,
  Tag,
  ParsedAnalytics,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class FileCacheService {
  private filesSubject = new BehaviorSubject<FullFile[]>([]);
  files$ = this.filesSubject.asObservable();

  private filesCache: FullFile[] = [];

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  fetchFiles(): Observable<FullFile[]> {
    if (this.filesCache.length > 0) {
      return of(this.filesCache);
    }

    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files`;

    this.http.get<FullFile[]>(apiUrl).subscribe((files) => {
      this.filesCache = files.map((file) => ({
        ...file,
        tags: file.tags || [],
        likes: file.likes || [],
        dislikes: file.dislikes || [],
        favorite: file.favorite || null,
        analytics: file.analytics || null,
      }));
      this.filesSubject.next(this.filesCache);
    });

    return this.files$;
  }

  fetchFullFileData(fileId: number): Observable<FullFile> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files/${fileId}/full`;

    return new Observable((observer) => {
      this.http.get<FullFile>(apiUrl).subscribe({
        next: (file) => {
          const updatedFile: FullFile = {
            ...file,
            tags: file.tags || [],
            likes: file.likes || [],
            dislikes: file.dislikes || [],
            favorite: file.favorite || null,
            analytics: file.analytics || null,
          };
          this.updateFile(updatedFile);
          observer.next(updatedFile);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  getFileById(fileId: number): FullFile | undefined {
    return this.filesCache.find((file) => file.id === fileId);
  }

  updateAnalytics(fileId: number, newAnalytics: ParsedAnalytics): void {
    const file = this.getFileById(fileId);
    if (file) {
      file.analytics = newAnalytics;
      this.updateFile(file);
    }
  }

  updateLikes(fileId: number, newLikes: Like[]): void {
    const file = this.getFileById(fileId);
    if (file) {
      file.likes = newLikes;
      this.updateFile(file);
    }
  }

  updateDislikes(fileId: number, updatedDislikes: Dislike[]): void {
    const file = this.getFileById(fileId);
    if (file) {
      file.dislikes = updatedDislikes;
      this.updateFile(file);
    }
  }

  updateFavorite(fileId: number, favorite: Favorite | null): void {
    const file = this.getFileById(fileId);
    if (file) {
      file.favorite = favorite;
      this.updateFile(file);
    }
  }

  updateTags(fileId: number, newTags: Tag[]): void {
    const file = this.getFileById(fileId);
    if (file) {
      file.tags = newTags;
      this.updateFile(file);
    }
  }

  private updateFile(updatedFile: FullFile): void {
    const index = this.filesCache.findIndex((f) => f.id === updatedFile.id);
    if (index !== -1) {
      this.filesCache[index] = updatedFile;
    } else {
      this.filesCache.push(updatedFile);
    }
    this.filesSubject.next([...this.filesCache]);
  }

  getFileName(fullPath: string): string {
    return fullPath.split(/[/\\]/).pop() || fullPath;
  }
}
