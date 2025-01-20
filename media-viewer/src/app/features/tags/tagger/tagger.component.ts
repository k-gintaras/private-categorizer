import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../../services/selected-file.service';
import { GroupedTags, TagService } from '../../../services/tag.service';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TagComponent } from '../../../components/tag/tag.component';
import { FileInfo } from '../../../models/file.model';
import {
  TagManagerComponent,
  TagGroup,
  TagItem,
  Tag,
  TagService as TaggerService,
} from 'shared-components'; // Assuming these interfaces are exported
import { FileService } from 'src/app/services/file.service';

@Component({
  selector: 'app-tagger',
  standalone: true,
  imports: [NgIf, MatIconModule, TagManagerComponent],
  templateUrl: './tagger.component.html',
  styleUrls: ['./tagger.component.scss'],
  // encapsulation: ViewEncapsulation.None,
})
export class TaggerComponent implements OnInit, OnDestroy {
  currentFile: FileInfo | null = null;
  groupedTags: GroupedTags = {};
  tagGroups: TagGroup[] = []; // Reactive storage for tag groups
  items: TagItem[] = [];
  private fileSubscription?: Subscription;
  private tagSubscription?: Subscription;
  files: FileInfo[] = [];

  constructor(
    private fileSelectionService: SelectedFileService,
    private fileService: FileService,
    private tagService: TagService,
    private taggerService: TaggerService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to file selection
    this.fileSubscription = this.fileSelectionService.selectedFile$.subscribe(
      (file) => {
        this.currentFile = file;
        const tagsOFFile = this.currentFile?.tags?.map((tagId) =>
          this.resolveTag('' + tagId)
        );
        console.log('tagsOFFile', this.currentFile?.tags);
        console.log('tagsOFFile', tagsOFFile);
        if (!file) return;
        const item: TagItem = {
          id: `${file.id}`, // Ensure ID is a string
          name: file.path, // Use `path` for the name
          tags: file.tags?.map((tagId) => this.resolveTag('' + tagId)) || [], // Resolve tag IDs
        };
        console.log('item*********************************', item);
        // this.taggerService.setCurrentItem(item);
        this.items = [item];
      }
    );

    // this.fileService.getFiles().subscribe((files) => {
    //   if (!files.length) return;
    //   this.files = files;
    //   this.items = [];
    //   for (let i = 0; i < files.length; i++) {
    //     const file = files[i];
    //     const item: TagItem = {
    //       id: `${file.id}`, // Ensure ID is a string
    //       name: file.path, // Use `path` for the name
    //       tags: file.tags?.map((tagId) => this.resolveTag('' + tagId)) || [], // Resolve tag IDs
    //     };

    //     this.items.push(item);
    //   }
    //   const item = this.items[0];
    //   const file = this.files[0];
    //   // this.fileSelectionService.selectFile(file.id);
    //   console.log('item.tags+++++++++++++++++++++++++++++++++++++++++++++++++');
    //   console.log('name: ' + item.name);
    //   console.log('tags: ' + item.tags);
    //   console.log('file tags: ' + file.tags);
    // });

    // Subscribe to tag groups
    this.tagSubscription = this.tagService.tags$.subscribe((tags) => {
      this.groupedTags = tags;
      this.tagGroups = this.formatTagGroups(tags); // Update tagGroups reactively
      console.log('this.tagGroups ++++++++++++++++++++++++');
      console.log(this.tagGroups);
    });

    // Load tags
    this.tagService.loadTags();
  }

  ngOnDestroy(): void {
    this.fileSubscription?.unsubscribe();
    this.tagSubscription?.unsubscribe();
  }

  getTagKeys(): string[] {
    return Object.keys(this.groupedTags);
  }

  private resolveTag(tagId: string): Tag {
    for (const group of this.tagGroups) {
      const foundTag = group.tags.find((tag) => tag.id === tagId);
      if (foundTag) {
        return { ...foundTag }; // Return full tag data
      }
    }
    console.warn(`Tag with ID ${tagId} not found`);
    return { id: tagId, name: 'Unknown Tag', group: '' }; // Fallback for missing tags
  }

  private formatTagGroups(groupedTags: GroupedTags): TagGroup[] {
    const validTags: Record<string, Tag[]> = {};

    // Iterate through each tag group and filter out undefined or invalid tags
    Object.entries(groupedTags).forEach(([group, tags]) => {
      if (!group || group === 'undefined') {
        group = 'Ungrouped'; // Assign a default group name for undefined groups
      }
      if (!validTags[group]) {
        validTags[group] = [];
      }

      // Add valid tags to the appropriate group
      tags.forEach((tag) => {
        if (tag.name && tag.id != null) {
          validTags[group].push({
            id: '' + tag.id,
            name: tag.name,
            group: tag.tagGroup,
          });
        }
      });
    });

    // Map the filtered validTags object into TagGroup[]
    const tagGroups = Object.keys(validTags).map((group) => ({
      id: group,
      name: group,
      tags: validTags[group].map((tag) => ({
        id: tag.id, // Keep ID as a number
        name: tag.name, // Tag name
        group, // Use the current group key
      })),
    }));

    console.log('Tag groups:', tagGroups);
    return tagGroups;
  }

  // Handle tag addition
  onTagAdded(tag: any): void {
    console.log('Tag added:', tag);
    if (this.currentFile) {
      this.tagService
        .associateTagWithFile(this.currentFile.id, tag.id)
        .subscribe({
          next: () => console.log('Tag added successfully'),
          error: (error) => console.error('Error adding tag:', error),
        });
    }
  }

  // Handle tag removal
  onTagRemoved(tag: any): void {
    console.log('Tag removed:', tag);
    if (this.currentFile) {
      this.tagService.removeTagFromFile(this.currentFile.id, tag.id).subscribe({
        next: () => console.log('Tag removed successfully'),
        error: (error) => console.error('Error removing tag:', error),
      });
    }
  }
}
