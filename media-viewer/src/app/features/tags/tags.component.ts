import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  MatChip,
  MatChipListbox,
  MatChipOption,
  MatChipsModule,
} from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../services/selected-file.service';
interface Tag {
  id: number;
  name: string;
  tag_group: string;
  color: string;
}
@Component({
  selector: 'app-tags',
  imports: [NgFor, NgIf, MatChipListbox, MatChipOption],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
})
export class TagsComponent {
  currentFile: string | null = null;
  fileTags: Tag[] = [];
  private fileSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private fileSelectionService: SelectedFileService
  ) {}

  ngOnInit() {
    this.fileSubscription = this.fileSelectionService.selectedFile$.subscribe(
      (file) => {
        this.currentFile = file;
        if (file) {
          this.fetchFileTags(file);
        } else {
          this.fileTags = [];
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.fileSubscription) {
      this.fileSubscription.unsubscribe();
    }
  }

  fetchFileTags(filePath: string) {
    // First get the tag IDs for the file
    this.http
      .get<number[]>(
        `http://localhost:3000/files/${encodeURIComponent(filePath)}/tags`
      )
      .subscribe({
        next: (tagIds) => {
          if (tagIds.length === 0) {
            this.fileTags = [];
            return;
          }

          // Then fetch the full tag details
          this.http.get<Tag[]>('http://localhost:3000/tags').subscribe({
            next: (allTags) => {
              this.fileTags = allTags.filter((tag) => tagIds.includes(tag.id));
            },
            error: (error) => {
              console.error('Error fetching tag details:', error);
              this.fileTags = [];
            },
          });
        },
        error: (error) => {
          console.error('Error fetching file tags:', error);
          this.fileTags = [];
        },
      });
  }
}
