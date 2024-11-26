import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-image-view',
  imports: [NgIf],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent {
  @Input() filePath!: string | null; // Receives the selected file path

  isImage(filePath: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp)$/i.test(filePath);
  }
}
