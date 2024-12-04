import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../services/selected-file.service';
import { TagService } from '../../services/tag.service';
import { TagComponent } from '../../components/tag/tag.component';
import { FileInfo } from '../../models/file.model';
import { Tag } from '../../models/tag.model';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [NgFor, TagComponent],
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent implements OnInit, OnDestroy {
  @Input() fileTags: Tag[] = [];
  currentFile: FileInfo | null = null;
  private fileSubscription?: Subscription;

  constructor(
    private fileSelectionService: SelectedFileService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.fileSubscription = this.fileSelectionService.selectedFile$.subscribe(
      (file) => {
        this.currentFile = file;
        if (!file) return;
        if (!file.tags) return;
        this.fileTags = file.tags;
      }
    );
  }

  ngOnDestroy(): void {
    this.fileSubscription?.unsubscribe();
  }
}
