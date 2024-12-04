import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';
import { Tag } from '../models/tag.model';

export interface GroupedTags {
  [group: string]: Tag[];
}

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private tagsSubject = new BehaviorSubject<GroupedTags>({});
  tags$ = this.tagsSubject.asObservable();

  // Observable to notify components of changes in tags for UI updates
  private tagsUpdatedSubject = new BehaviorSubject<void>(undefined);
  tagsUpdated$ = this.tagsUpdatedSubject.asObservable();

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Fetches all tags from the server and groups them by tag_group.
   */
  loadTags(): void {
    const url = this.getApiTagUrl();
    this.http
      .get<Tag[]>(url)
      .pipe(
        map((tags) =>
          tags.reduce((groups: GroupedTags, tag) => {
            const group = tag.tagGroup;
            if (!groups[group]) {
              groups[group] = [];
            }
            groups[group].push(tag);
            return groups;
          }, {})
        ),
        catchError((error) => {
          console.error('Error loading tags:', error);
          return [];
        })
      )
      .subscribe((groupedTags) => this.tagsSubject.next(groupedTags));
  }

  /**
   * Adds a tag to a file by ID.
   * @param fileId The file ID
   * @param tagId The tag ID
   */
  addTagToFile(fileId: number, tagId: number): Observable<void> {
    const url = `${this.getApiFileTagUrl(fileId)}`;
    return this.http.post<void>(url, { tagId }).pipe(
      tap(() => this.notifyTagUpdate()), // Notify UI on add
      catchError((error) => {
        console.error('Error adding tag:', error);
        throw error;
      })
    );
  }

  /**
   * Removes a tag from a file by ID.
   * @param fileId The file ID
   * @param tagId The tag ID
   */
  removeTagFromFile(fileId: number, tagId: number): Observable<void> {
    const url = `${this.getApiFileTagUrl(fileId)}/${tagId}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.notifyTagUpdate()), // Notify UI on remove
      catchError((error) => {
        console.error('Error removing tag:', error);
        throw error;
      })
    );
  }

  /**
   * Fetches tags assigned to a specific file.
   * @param fileId The file ID
   */
  getTagsForFile(fileId: number): Observable<Tag[]> {
    const url = `${this.getApiFileTagUrl(fileId)}`;
    return this.http.get<number[]>(url).pipe(
      map((tagIds) => {
        const allTags = this.tagsSubject.getValue();
        const flattenedTags = Object.values(allTags).flat();
        return flattenedTags.filter((tag) => tagIds.includes(tag.id));
      }),
      catchError((error) => {
        console.error('Error fetching tags for file:', error);
        return [];
      })
    );
  }

  /**
   * API Base URL for Tags
   */
  private getApiTagUrl(): string {
    return `${this.apiConfig.getApiBaseUrl()}/tags`;
  }

  /**
   * API URL for file tags
   * @param fileId The file ID
   */
  private getApiFileTagUrl(fileId: number): string {
    return `${this.apiConfig.getApiBaseUrl()}/files/${encodeURIComponent(
      fileId
    )}/tags`;
  }

  /**
   * Notify UI about tag updates
   */
  private notifyTagUpdate(): void {
    this.tagsUpdatedSubject.next();
  }
}
