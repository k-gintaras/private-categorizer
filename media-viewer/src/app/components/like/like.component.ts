import { Component, OnInit } from '@angular/core';
import { LikeService } from '../../services/like.service';
import { SelectedFileService } from '../../services/selected-file.service';
import { NgClass, NgIf } from '@angular/common';
import { DislikeService } from 'src/app/services/dislike.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { FileService } from 'src/app/services/file.service';
import { FullFile } from 'src/app/models'; // Updated import

@Component({
  standalone: true,
  imports: [NgClass, NgIf],
  selector: 'app-like',
  templateUrl: './like.component.html',
  styleUrls: ['./like.component.scss'],
})
export class LikeComponent implements OnInit {
  isLiked = false;
  fileInfo: FullFile | null = null; // Updated type
  msg = '';
  isDisliked: boolean = false;
  isFavorite: boolean = false;
  likeCount: number = 0;
  dislikeCount: number = 0;

  constructor(
    private likeService: LikeService,
    private dislikeService: DislikeService,
    private favoriteService: FavoriteService,
    private fileService: FileService,
    private selectedFileService: SelectedFileService
  ) {}

  ngOnInit(): void {
    this.selectedFileService.selectedFile$.subscribe((selectedFile) => {
      if (!selectedFile) return;

      this.fileService.fetchFullFileData(selectedFile.id).subscribe((file) => {
        if (!file) return;

        this.fileInfo = file;

        // Count likes and dislikes
        this.likeCount = file.likes?.length || 0;
        this.dislikeCount = file.dislikes?.length || 0;

        // Determine states based on counts
        this.isLiked = this.likeCount > this.dislikeCount;
        this.isDisliked = this.dislikeCount > this.likeCount;

        // Check if favorited (favorite object exists)
        this.isFavorite = !!file.favorite;

        console.log('Full file data:', file);
        console.log('Favorite status:', file.favorite);
        console.log('Like count:', this.likeCount);
        console.log('Dislike count:', this.dislikeCount);
      });
    });
  }

  likeFile(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();
    if (!selectedFile) {
      console.error('No file selected to like.');
      return;
    }

    this.likeService.addLike(selectedFile.id, true).subscribe({
      next: () => {
        console.log('Like added successfully');
        this.msg = `Liked: ${this.getShortPath(selectedFile.path)}`;
        this.likeCount++;
        this.updateStates();
      },
      error: (error) => console.error('Error adding like:', error),
    });
  }

  dislike(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();
    if (!selectedFile) {
      console.error('No file selected to dislike.');
      return;
    }

    this.dislikeService.addDislike(selectedFile.id, true).subscribe({
      next: () => {
        console.log('Dislike added successfully');
        this.dislikeCount++;
        this.updateStates();
      },
      error: (error) => console.error('Error adding dislike:', error),
    });
  }

  favorite(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();
    if (!selectedFile) {
      console.error('No file selected to favorite.');
      return;
    }

    this.favoriteService.addFavorite(selectedFile.id, true).subscribe({
      next: () => {
        console.log('Favorite added successfully');
        this.isFavorite = true;
      },
      error: (error) => console.error('Error adding favorite:', error),
    });
  }

  /**
   * Update like/dislike states based on current counts
   */
  private updateStates(): void {
    this.isLiked = this.likeCount > this.dislikeCount;
    this.isDisliked = this.dislikeCount > this.likeCount;
  }

  /**
   * Get shortened file path for display
   */
  private getShortPath(path: string): string {
    return path.length > 20 ? '...' + path.substring(path.length - 20) : path;
  }
}
