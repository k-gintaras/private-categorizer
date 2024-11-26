import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  constructor(private http: HttpClient) {}

  getTags(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/tags');
  }

  getTagsForFile(filePath: string): Observable<any[]> {
    return this.http.get<any[]>(
      `http://localhost:3000/files/${encodeURIComponent(filePath)}/tags`
    );
  }

  addTagToFile(filePath: string, tagId: number): Observable<void> {
    return this.http.post<void>(
      `http://localhost:3000/files/${encodeURIComponent(filePath)}/tags`,
      { tagId }
    );
  }

  removeTagFromFile(filePath: string, tagId: number): Observable<void> {
    return this.http.delete<void>(
      `http://localhost:3000/files/${encodeURIComponent(
        filePath
      )}/tags/${tagId}`
    );
  }
}
