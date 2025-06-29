import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';
import { FullFile } from '../models';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private isInitialized = false;
  private files: FullFile[] = [];

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  getFiles(): Observable<FullFile[]> {
    if (!this.isInitialized) {
      this.isInitialized = true;
      return this.fetchFiles().pipe(tap((files) => (this.files = files)));
    }
    return of(this.files);
  }

  private fetchFiles(): Observable<FullFile[]> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files`;
    return this.http.get<FullFile[]>(apiUrl).pipe(
      map((files) =>
        (files || [])
          .filter((f) => f.type === 'file' && this.isSupportedVideo(f.path))
          .map((file) => ({
            ...file,
            tags: file.tags || [],
            likes: file.likes || [],
            dislikes: file.dislikes || [],
            favorite: file.favorite || null,
            analytics: file.analytics || null,
            name: this.getFileName(file.path),
          }))
      ),
      catchError((error) => {
        console.error('Error fetching files:', error);
        return of([]);
      })
    );
  }

  fetchFullFileData(fileId: number): Observable<FullFile> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files/${fileId}/full`;

    return this.http.get<FullFile>(apiUrl).pipe(
      map((file) => ({
        ...file,
        tags: file.tags || [],
        likes: file.likes || [],
        dislikes: file.dislikes || [],
        favorite: file.favorite || null,
        analytics: file.analytics || null,
        isFull: true,
      })),
      tap((updatedFile) => {
        this.updateFile(updatedFile);
      }),
      catchError((err) => {
        console.error(`Error fetching full data for file ID ${fileId}:`, err);
        throw err;
      })
    );
  }

  private updateFile(file: FullFile): void {
    const index = this.files.findIndex((f) => f.id === file.id);
    if (index !== -1) {
      this.files[index] = file;
    } else {
      this.files.push(file);
    }
  }

  private isSupportedVideo(path: string): boolean {
    return path.toLowerCase().endsWith('.mp4');
  }

  public getFileName(fullPath: string): string {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    return normalizedPath.split('/').pop() || fullPath;
  }
}
