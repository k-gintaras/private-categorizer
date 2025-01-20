import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private isInitialized = false;
  files: FileInfo[] = [];

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  getFiles(): Observable<FileInfo[]> {
    if (!this.isInitialized) {
      this.isInitialized = true;
      return this.fetchFiles().pipe(
        map((f) => {
          this.files = f;
          return this.files;
        })
      );
    }
    return of(this.files);
  }

  /**
   * Fetches all files from the server.
   */
  private fetchFiles(): Observable<FileInfo[]> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files`;
    return this.http.get<FileInfo[]>(apiUrl).pipe(
      map((files) =>
        files
          .filter((f) => f.type === 'file' && this.isSupportedVideo(f.path))
          .map((file) => ({
            ...file,
            name: this.getFileName(file.path), // Extract file name for convenience
          }))
      ),
      // Handle errors gracefully
      map((files) => files || []),
      catchError((error) => {
        console.error('Error fetching files:', error);
        return of([]);
      })
    );
  }

  fetchFullFileData(fileId: number): Observable<FileInfo> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files/${fileId}/full`;

    return new Observable<FileInfo>((observer) => {
      this.http.get<FileInfo>(apiUrl).subscribe({
        next: (file) => {
          const updatedFile: FileInfo = {
            ...file,
            isFull: true, // Mark as fully loaded
            tags: file.tags || [], // Ensure tags are always an array
            analytics: file.analytics || undefined, // Include analytics only if it exists
            likes: file.likes || [], // Ensure likes are always an array
          };

          this.updateFile(updatedFile); // Update local cache or state
          observer.next(updatedFile); // Emit the updated file
          observer.complete(); // Complete the observable
        },
        error: (err) => {
          console.error(`Error fetching full data for file ID ${fileId}:`, err);
          observer.error(err); // Emit the error to the subscriber
        },
      });
    });
  }

  private updateFile(file: FileInfo): void {
    const index = this.files.findIndex((f) => f.id === file.id);
    if (index !== -1) {
      this.files[index] = file; // Update the existing file
    } else {
      this.files.push(file); // Add new file if not in cache
    }
  }

  /**
   * Determines if a given file is a supported video type.
   */
  private isSupportedVideo(path: string): boolean {
    return path.toLowerCase().endsWith('.mp4');
  }

  /**
   * Extracts the file name from a full file path.
   */
  public getFileName(fullPath: string): string {
    const normalizedPath = fullPath.replace(/\\/g, '/'); // Replace backslashes with forward slashes
    return normalizedPath.split('/').pop() || fullPath;
  }
}
