import { Component, OnInit } from '@angular/core';
import { LikeService } from '../../services/like.service';
import { SelectedFileService } from '../../services/selected-file.service';
import { NgClass, NgIf } from '@angular/common';
import { DislikeService } from 'src/app/services/dislike.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { FileInfo } from 'src/app/models/analytics.model';
import { FileService } from 'src/app/services/file.service';

@Component({
  standalone: true,
  imports: [NgClass, NgIf],
  selector: 'app-like',
  templateUrl: './like.component.html',
  styleUrls: ['./like.component.scss'],
})
export class LikeComponent implements OnInit {
  isLiked = false;
  fileInfo: FileInfo | null = null;
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
    this.selectedFileService.selectedFile$.subscribe((f) => {
      if (!f) return;
      this.fileService.fetchFullFileData(f.id).subscribe((file) => {
        if (!file) return;
        this.fileInfo = file;
        // TODO: how do we deal with multiple likes and how we allow add more ?
        const likeCount =
          file.likes && file.likes.length > 0 ? file.likes.length : 0;
        const dislikeCount =
          file.dislikes && file.dislikes.length > 0 ? file.dislikes.length : 0;
        this.likeCount = likeCount;
        this.dislikeCount = dislikeCount;

        this.isLiked = likeCount > dislikeCount;
        this.isDisliked = dislikeCount > likeCount;
        // this.isLiked = (file.likes && file.likes.length > 0) || false;
        // this.isDisliked = (file.dislikes && file.dislikes.length > 0) || false;
        console.log(file);
        console.log('file', file.favorite);
        console.log('file', typeof file.favorite);
        this.isFavorite = file.favorite ? true : false;
      });
    });
  }

  likeFile(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();
    if (!selectedFile) {
      console.error('No file selected to like.');
      return;
    }

    this.likeService.addLike(selectedFile).subscribe({
      next: () => {
        console.log('Like added successfully');
        this.msg =
          'liked: ' +
          selectedFile.path.substring(
            selectedFile.path.length - 20,
            selectedFile.path.length
          );
        this.isLiked = true;
      },
      error: (error) => console.error('Error adding like:', error),
    });
  }
  dislike(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();
    if (!selectedFile) {
      console.error('No file selected to like.');
      return;
    }

    this.dislikeService.addDislike(selectedFile).subscribe({
      next: () => {
        this.isDisliked = true;
      },
      error: (error) => console.error('Error adding dislike:', error),
    });
  }
  favorite(): void {
    const selectedFile = this.selectedFileService.getSelectedFile();
    if (!selectedFile) {
      console.error('No file selected to like.');
      return;
    }

    this.favoriteService.addFavorite(selectedFile).subscribe({
      next: () => {
        this.isFavorite = true;
      },
      error: (error) => console.error('Error adding dislike:', error),
    });
  }
}
