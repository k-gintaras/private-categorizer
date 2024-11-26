import { Component, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpClient } from '@angular/common/http';
import { SelectedFileService } from '../../../services/selected-file.service';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { NgFor, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

interface Tag {
  id: number;
  name: string;
  tag_group: string;
  color: string;
  created_at: string;
}

interface GroupedTag {
  id: number;
  name: string;
  color: string;
}

@Component({
  selector: 'app-tagger',
  standalone: true,
  imports: [MatChipsModule, MatIconModule, NgFor, NgIf],
  templateUrl: './tagger.component.html',
  styleUrls: ['./tagger.component.scss'],
})
export class TaggerComponent implements OnInit {
  currentFile: string | null = null;
  groupedTags: Record<string, Tag[]> = {};
  private fileSubscription?: Subscription;

  constructor(
    private fileSelectionService: SelectedFileService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadTags();

    this.fileSubscription = this.fileSelectionService.selectedFile$.subscribe(
      (file) => {
        this.currentFile = file;
      }
    );
  }

  loadTags(): void {
    this.http.get<Tag[]>('http://localhost:3000/tags').subscribe({
      next: (tags) => {
        this.groupedTags = tags.reduce((groups: Record<string, Tag[]>, tag) => {
          const group = tag.tag_group;
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(tag);
          return groups;
        }, {});
      },
      error: (error) => {
        console.error('Error loading tags:', error);
      },
    });
  }

  addTag(tagId: number): void {
    if (!this.currentFile) return;

    const url = `http://localhost:3000/files/${encodeURIComponent(
      this.currentFile
    )}/tags`;

    this.http.post(url, { tagId }).subscribe({
      next: () => {
        // Optional: Add some visual feedback
        console.log('Tag added successfully');
      },
      error: (error) => console.error('Error adding tag:', error),
    });
  }

  getTagKeys(): string[] {
    return Object.keys(this.groupedTags);
  }

  ngOnDestroy(): void {
    if (this.fileSubscription) {
      this.fileSubscription.unsubscribe();
    }
  }
}
