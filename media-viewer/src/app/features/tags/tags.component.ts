import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import {
  MatChip,
  MatChipGrid,
  MatChipListbox,
  MatChipOption,
  MatChipRow,
} from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../services/selected-file.service';
import { TagService, Tag } from '../../services/tag.service';
import { MatIcon } from '@angular/material/icon';
import { TagComponent } from '../../components/tag/tag.component';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatChipListbox,
    MatChipOption,
    MatChipGrid,
    MatChipRow,
    MatIcon,
    TagComponent,
  ],
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent implements OnInit, OnDestroy {
  @Input() fileTags: Tag[] = [];
  currentFile: string | null = null;
  private fileSubscription?: Subscription;

  constructor(
    private fileSelectionService: SelectedFileService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.fileSubscription = this.fileSelectionService.selectedFile$.subscribe(
      (file) => {
        this.currentFile = file;
        if (file) {
          this.loadFileTags(file);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.fileSubscription?.unsubscribe();
  }

  private loadFileTags(filePath: string): void {
    this.tagService.getTagsForFile(filePath).subscribe({
      next: (tags) => {
        this.fileTags = tags;
      },
      error: (err) => {
        console.error('Error loading file tags:', err);
      },
    });
  }
}
