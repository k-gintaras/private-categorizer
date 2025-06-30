import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../../services/selected-file.service';
import { GroupedTags, TagService } from '../../../services/tag.service';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FileService } from 'src/app/services/file.service';
import { FullFile, ParsedFile } from 'src/app/models';
import {
  Tag,
  TagGroup,
  TagItem,
  TagManagerComponent,
} from '@ubaby/shared-components';

@Component({
  selector: 'app-tagger',
  standalone: true,
  imports: [NgIf, MatIconModule, TagManagerComponent],
  templateUrl: './tagger.component.html',
  styleUrls: ['./tagger.component.scss'],
})
export class TaggerComponent implements OnInit, OnDestroy {
  currentFile: FullFile | null = null;
  groupedTags: GroupedTags = {};
  tagGroups: TagGroup[] = [];
  items: TagItem[] = [];
  private subscriptions = new Subscription();

  constructor(
    private fileSelectionService: SelectedFileService,
    private fileService: FileService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.fileSelectionService.selectedFile$.subscribe((file) => {
        this.currentFile = file;
        if (!file) {
          this.items = [];
          return;
        }
        const resolvedTags = (file.tags || []).map((tagId) =>
          this.resolveTag(tagId.toString())
        );
        this.items = [
          {
            id: file.id.toString(),
            name: file.path,
            tags: resolvedTags,
          },
        ];
      })
    );

    this.subscriptions.add(
      this.tagService.tags$.subscribe((tags) => {
        if (!tags) return;
        this.groupedTags = tags;
        this.tagGroups = this.formatTagGroups(tags);
      })
    );

    this.tagService.loadTags();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private resolveTag(tagId: string): Tag {
    for (const group of this.tagGroups) {
      const found = group.tags.find((tag) => tag.id === tagId);
      if (found) return { ...found };
    }
    console.warn(`Tag with ID ${tagId} not found`);
    return { id: tagId, name: 'Unknown Tag', group: '' };
  }

  private formatTagGroups(groupedTags: GroupedTags): TagGroup[] {
    const validTags: Record<string, Tag[]> = {};

    Object.entries(groupedTags).forEach(([group, tags]) => {
      const groupName = group && group !== 'undefined' ? group : 'Ungrouped';
      if (!validTags[groupName]) validTags[groupName] = [];

      tags.forEach((tag) => {
        if (tag.name && tag.id != null) {
          validTags[groupName].push({
            id: tag.id.toString(),
            name: tag.name,
            group: tag.tag_group,
          });
        }
      });
    });

    return Object.keys(validTags).map((group) => ({
      id: group,
      name: group,
      tags: validTags[group].map(({ id, name }) => ({
        id,
        name,
        group,
      })),
    }));
  }

  onTagAdded(tag: Tag): void {
    if (!this.currentFile) return;
    this.tagService
      .associateTagWithFile(this.currentFile.id, parseInt(tag.id))
      .subscribe({
        next: () => console.log('Tag added successfully'),
        error: (error) => console.error('Error adding tag:', error),
      });
  }

  onTagRemoved(tag: Tag): void {
    if (!this.currentFile) return;
    this.tagService
      .removeTagFromFile(this.currentFile.id, parseInt(tag.id))
      .subscribe({
        next: () => console.log('Tag removed successfully'),
        error: (error) => console.error('Error removing tag:', error),
      });
  }
}
