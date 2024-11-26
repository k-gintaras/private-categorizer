import { Component, OnInit } from '@angular/core';
import { ImageViewComponent } from '../files/image-view/image-view.component';
import { VideoViewComponent } from '../files/video-view/video-view.component';
import { FileListComponent } from '../files/file-list/file-list.component';
import { NgIf } from '@angular/common';
import { SelectedFileService } from '../../services/selected-file.service';
import { TaggerComponent } from '../tags/tagger/tagger.component';
import { TagsComponent } from '../tags/tags.component';

@Component({
  selector: 'app-view-videos',
  imports: [
    ImageViewComponent,
    VideoViewComponent,
    FileListComponent,
    NgIf,
    TaggerComponent,
    TagsComponent,
    TagsComponent,
  ],
  templateUrl: './view-videos.component.html',
  styleUrls: ['./view-videos.component.scss'], // Corrected from `styleUrl` to `styleUrls`
})
export class ViewVideosComponent implements OnInit {
  selectedFile: string | null = null;

  constructor(private fileTracker: SelectedFileService) {}

  ngOnInit(): void {
    // Subscribe to the selected file from the FileTrackerService
    this.fileTracker.selectedFile$.subscribe((filePath) => {
      this.selectedFile = filePath;
    });
  }

  isImage(filePath: string | null): boolean {
    return !!filePath && /\.(jpg|jpeg|png|gif|bmp)$/i.test(filePath);
  }

  isVideo(filePath: string | null): boolean {
    return !!filePath && /\.(mp4|webm|ogg|avi|mov|mkv|flv)$/i.test(filePath);
  }
}
