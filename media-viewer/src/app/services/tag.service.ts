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

  private tagsUpdatedSubject = new BehaviorSubject<void>(undefined);
  tagsUpdated$ = this.tagsUpdatedSubject.asObservable();

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Fetch all tags and group them by their tag group.
   */
  loadTags(): void {
    const url = this.getApiTagUrl();
    this.http
      .get<any[]>(url)
      .pipe(
        map((tags) =>
          tags.reduce((groups: GroupedTags, tag) => {
            // Map `tag_group` from the server to `tagGroup`
            const mappedTag = {
              ...tag,
              tagGroup: tag.tag_group, // Map `tag_group` to `tagGroup`
            };
            delete mappedTag.tag_group; // Remove `tag_group` to avoid ambiguity

            const group = mappedTag.tagGroup || 'Ungrouped'; // Fallback for undefined or missing tagGroup
            if (!groups[group]) {
              groups[group] = [];
            }
            groups[group].push(mappedTag);
            return groups;
          }, {} as GroupedTags)
        ),
        catchError((error) => {
          console.error('Error loading tags:', error);
          return [];
        })
      )
      .subscribe((groupedTags) => {
        this.tagsSubject.next(groupedTags);
      });
  }

  /**
   * Create a new tag.
   * @param tag The tag data to create.
   */
  createTag(tag: Partial<Tag>): Observable<Tag> {
    const url = this.getApiTagUrl();
    return this.http.post<Tag>(url, tag).pipe(
      tap(() => this.loadTags()), // Reload tags to ensure UI reflects the new data
      catchError((error) => {
        console.error('Error creating tag:', error);
        throw error;
      })
    );
  }

  /**
   * Update an existing tag.
   * @param tagId The ID of the tag to update.
   * @param updatedTagData The updated tag data.
   */
  updateTag(tagId: number, updatedTagData: Partial<Tag>): Observable<Tag> {
    const url = `${this.getApiTagUrl()}/${tagId}`;
    return this.http.put<Tag>(url, updatedTagData).pipe(
      tap(() => this.loadTags()),
      catchError((error) => {
        console.error('Error updating tag:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a tag by its ID.
   * @param tagId The ID of the tag to delete.
   */
  deleteTag(tagId: number): Observable<void> {
    const url = `${this.getApiTagUrl()}/${tagId}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.loadTags()),
      catchError((error) => {
        console.error('Error deleting tag:', error);
        throw error;
      })
    );
  }

  /**
   * Associate a tag with a file.
   * @param fileId The ID of the file.
   * @param tagId The ID of the tag.
   */
  associateTagWithFile(fileId: number, tagId: number): Observable<void> {
    const url = this.getApiFileTagAssociationUrl();
    return this.http.post<void>(url, { fileId, tagId }).pipe(
      tap(() => this.notifyTagUpdate()),
      catchError((error) => {
        console.error('Error associating tag with file:', error);
        throw error;
      })
    );
  }

  /**
   * Remove a tag from a file.
   * @param fileId The ID of the file.
   * @param tagId The ID of the tag.
   */
  removeTagFromFile(fileId: number, tagId: number): Observable<void> {
    const url = `${this.getApiFileTagAssociationUrl()}/${fileId}/${tagId}`;
    return this.http.delete<void>(url).pipe(
      tap(() => this.notifyTagUpdate()),
      catchError((error) => {
        console.error('Error removing tag from file:', error);
        throw error;
      })
    );
  }

  /**
   * Get tags for a specific file.
   * @param fileId The ID of the file.
   */
  getTagsForFile(fileId: number): Observable<Tag[]> {
    const url = `${this.getApiFileTagAssociationUrl()}/${fileId}`;
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
   * Get the base API URL for tags.
   */
  private getApiTagUrl(): string {
    return `${this.apiConfig.getApiBaseUrl()}/tags`;
  }

  /**
   * Get the API URL for file-tag associations.
   */
  private getApiFileTagAssociationUrl(): string {
    return `${this.apiConfig.getApiBaseUrl()}/tags/file-associations`;
  }

  /**
   * Notify UI about tag updates.
   */
  private notifyTagUpdate(): void {
    this.tagsUpdatedSubject.next();
  }
}
