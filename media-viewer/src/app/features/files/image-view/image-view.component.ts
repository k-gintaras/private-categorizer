import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ParsedFile, isImageFile } from '../../../models'; // Updated import

@Component({
  selector: 'app-image-view',
  imports: [NgIf],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent {
  @Input() fileInfo!: ParsedFile | null; // Updated type - Receives the selected file

  isImage(file: ParsedFile): boolean {
    return isImageFile(file);
  }
}
