import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FileInfo } from '../../../models/file.model';

@Component({
  selector: 'app-image-view',
  imports: [NgIf],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent {
  @Input() fileInfo!: FileInfo | null; // Receives the selected file path

  isImage(f: FileInfo): boolean {
    return /\.(jpg|jpeg|png|gif|bmp)$/i.test(f.path);
  }
}
