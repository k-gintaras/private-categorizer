import { Component, OnInit } from '@angular/core';
import { ImageViewComponent } from '../files/image-view/image-view.component';
import { VideoViewComponent } from '../files/video-view/video-view.component';
import { FileListComponent } from '../files/file-list/file-list.component';
import { NgIf } from '@angular/common';
import { SelectedFileService } from '../../services/selected-file.service';
import { TaggerComponent } from '../tags/tagger/tagger.component';
import { TagsComponent } from '../tags/tags.component';
import { NextRandomComponent } from '../../components/next-random/next-random.component';
import { FileInfo } from '../../models/file.model';
import { VideoControlsComponent } from '../../components/video-controls/video-controls.component';
import { LikeComponent } from '../../components/like/like.component';

@Component({
  selector: 'app-view-videos',
  standalone: true,
  imports: [
    ImageViewComponent,
    VideoViewComponent,
    FileListComponent,
    NgIf,
    TaggerComponent,
    VideoControlsComponent,
    LikeComponent,
    LikeComponent,
  ],
  templateUrl: './view-videos.component.html',
  styleUrls: ['./view-videos.component.scss'], // Corrected from `styleUrl` to `styleUrls`
})
export class ViewVideosComponent implements OnInit {
  selectedFile: FileInfo | null = null;

  constructor(private fileTracker: SelectedFileService) {}
  isFileListVisible = true;

  toggleFileList(): void {
    this.isFileListVisible = !this.isFileListVisible;
  }

  ngOnInit(): void {
    // Subscribe to the selected file from the FileTrackerService
    this.fileTracker.selectedFile$.subscribe((f) => {
      this.selectedFile = f;
    });
  }

  isImage(f: FileInfo | null): boolean {
    const filePath = f?.path;
    return !!filePath && /\.(jpg|jpeg|png|gif|bmp)$/i.test(filePath);
  }

  isVideo(f: FileInfo | null): boolean {
    const filePath = f?.path;
    return !!filePath && /\.(mp4|webm|ogg|avi|mov|mkv|flv)$/i.test(filePath);
  }
}
