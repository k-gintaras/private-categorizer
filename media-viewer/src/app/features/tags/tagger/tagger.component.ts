import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../../services/selected-file.service';
import { GroupedTags, TagService } from '../../../services/tag.service';
import { NgFor, NgIf } from '@angular/common';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TagComponent } from '../../../components/tag/tag.component';

@Component({
  selector: 'app-tagger',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatChipListbox,
    MatChipOption,
    MatIconModule,
    TagComponent,
  ],
  templateUrl: './tagger.component.html',
  styleUrls: ['./tagger.component.scss'],
})
export class TaggerComponent implements OnInit, OnDestroy {
  currentFile: string | null = null;
  groupedTags: GroupedTags = {};
  private fileSubscription?: Subscription;

  constructor(
    private fileSelectionService: SelectedFileService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    // Subscribe to file selection
    this.fileSubscription = this.fileSelectionService.selectedFile$.subscribe(
      (file) => {
        this.currentFile = file;
      }
    );

    // Load tags
    this.tagService.tags$.subscribe((tags) => (this.groupedTags = tags));
    this.tagService.loadTags();
  }

  addTag(tagId: number): void {
    if (this.currentFile) {
      this.tagService.addTagToFile(this.currentFile, tagId).subscribe({
        next: () => console.log('Tag added successfully'),
        error: (error) => console.error('Error adding tag:', error),
      });
    }
  }

  getTagKeys(): string[] {
    return Object.keys(this.groupedTags);
  }

  ngOnDestroy(): void {
    this.fileSubscription?.unsubscribe();
  }
}
