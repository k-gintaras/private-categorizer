import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  files: FileInfo[] = [];
  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {
    if (this.files.length < 1) {
      this.fetchFiles().subscribe((f) => {
        if (!f) return;
        this.files = f;
      });
    }
  }

  getFiles(): Observable<FileInfo[]> {
    return this.fetchFiles();
  }

  /**
   * Fetches all files from the server.
   */
  private fetchFiles(): Observable<FileInfo[]> {
    if (this.files.length > 0) {
      return of(this.files);
    }
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/files`;
    return this.http.get<FileInfo[]>(apiUrl).pipe(
      map((files) =>
        files
          .filter((f) => f.type === 'file' && this.isSupportedVideo(f.path))
          .map((file) => ({
            ...file,
            name: this.getFileName(file.path),
          }))
      )
    );
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
    return fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
  }
}
