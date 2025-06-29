import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { Subscription } from 'rxjs';
import { SelectedFileService } from '../../services/selected-file.service';
import { TagService } from '../../services/tag.service';
import { TagComponent } from '../../components/tag/tag.component';
import { Tag, FullFile } from 'src/app/models';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [NgFor, TagComponent],
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
})
export class TagsComponent implements OnInit, OnDestroy {
  @Input() fileTags: Tag[] = [];
  currentFile: FullFile | null = null;
  private subscriptions = new Subscription();

  constructor(
    private fileSelectionService: SelectedFileService,
    private tagService: TagService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.fileSelectionService.selectedFile$.subscribe((file) => {
        this.currentFile = file;
        if (!file?.tags?.length) {
          this.fileTags = [];
          return;
        }

        if (typeof file.tags[0] === 'number') {
        } else {
          // Already Tag objects
          this.fileTags = file.tags as Tag[];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
