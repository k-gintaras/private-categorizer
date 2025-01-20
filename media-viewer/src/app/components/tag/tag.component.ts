import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Tag } from '../../models/tag.model';
import { TagService } from '../../services/tag.service';

@Component({
  selector: 'app-tag',
  imports: [NgIf, MatIcon],
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
})
export class TagComponent {
  @Input() tag!: Tag; // Tag data to display
  @Input() fileId: number | null = null; // Current file to add/remove tag
  @Input() canRemove = true; // If the tag can be removed
  @Input() canAdd = true; // If the tag can be removed

  constructor(private tagService: TagService) {}

  onTagClick(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the parent tag click event

    if (!this.canAdd) return;
    if (this.fileId) {
      this.tagService.associateTagWithFile(this.fileId, this.tag.id).subscribe({
        next: () => console.log(`Tag "${this.tag.name}" added to file.`),
        error: (err) =>
          console.error(`Failed to add tag "${this.tag.name}":`, err),
      });
    }
  }

  onRemoveClick(event: MouseEvent): void {
    event.stopPropagation(); // Prevent the parent tag click event
    if (this.fileId) {
      this.tagService.removeTagFromFile(this.fileId, this.tag.id).subscribe({
        next: () => console.log(`Tag "${this.tag.name}" removed from file.`),
        error: (err) =>
          console.error(`Failed to remove tag "${this.tag.name}":`, err),
      });
    }
  }
}
