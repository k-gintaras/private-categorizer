import { Component } from '@angular/core';
import { LikeService } from '../../services/like.service';
import { SelectedFileService } from '../../services/selected-file.service';
import { FileInfo } from '../../models/file.model';

@Component({
  selector: 'app-like',
  template: ` <button class="like-button" (click)="likeFile()">Like</button> `,
  styleUrls: ['./like.component.scss'],
})
export class LikeComponent {
  constructor(
    private likeService: LikeService,
    private selectedFileService: SelectedFileService
  ) {}

  likeFile(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();

    if (!selectedFile) {
      console.error('No file selected to like.');
      return;
    }

    this.likeService.addLike(selectedFile).subscribe({
      next: () => console.log('Like added successfully'),
      error: (error) => console.error('Error adding like:', error),
    });
  }
}
