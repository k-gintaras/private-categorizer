import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

export interface Tag {
  id: number;
  name: string;
  tag_group: string;
  color: string;
  created_at: string;
}

export interface GroupedTags {
  [group: string]: Tag[];
}

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private apiBaseUrl = 'http://localhost:3000'; // Base API URL

  private tagsSubject = new BehaviorSubject<GroupedTags>({});
  tags$ = this.tagsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Fetches all tags from the server and groups them by tag_group.
   */
  loadTags(): void {
    this.http
      .get<Tag[]>(`${this.apiBaseUrl}/tags`)
      .pipe(
        map((tags) =>
          tags.reduce((groups: GroupedTags, tag) => {
            const group = tag.tag_group;
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
  addTagToFile(fileId: string, tagId: number): Observable<void> {
    const url = `${this.apiBaseUrl}/files/${encodeURIComponent(fileId)}/tags`;
    return this.http.post<void>(url, { tagId }).pipe(
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
  removeTagFromFile(filePath: string, tagId: number): Observable<void> {
    // Normalize the filePath to remove any leading slashes
    const normalizedFilePath = filePath.startsWith('/')
      ? filePath.substring(1)
      : filePath;
    const encodedFilePath = encodeURIComponent(normalizedFilePath);

    const url = `http://localhost:3000/files/${encodedFilePath}/tags/${tagId}`;
    return this.http.delete<void>(url).pipe(
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
  getTagsForFile(fileId: string): Observable<Tag[]> {
    return this.http
      .get<number[]>(
        `${this.apiBaseUrl}/files/${encodeURIComponent(fileId)}/tags`
      )
      .pipe(
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
}

// TODO: without messing up adding and removing logic, which works here, we need to add ability to notify UI that items were deleted or updated
// so the tags in tags component disappear on click delete, which is deleted in tag component that is basically a pill inside TAGS component
