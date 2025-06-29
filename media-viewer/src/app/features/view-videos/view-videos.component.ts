import { Component, OnInit } from '@angular/core';
import { ImageViewComponent } from '../files/image-view/image-view.component';
import { VideoViewComponent } from '../files/video-view/video-view.component';
import { FileListComponent } from '../files/file-list/file-list.component';
import { NgIf } from '@angular/common';
import { SelectedFileService } from '../../services/selected-file.service';
import { TaggerComponent } from '../tags/tagger/tagger.component';
import { TagsComponent } from '../tags/tags.component';
import { NextRandomComponent } from '../../components/next-random/next-random.component';
import { VideoControlsComponent } from '../../components/video-controls/video-controls.component';
import { LikeComponent } from '../../components/like/like.component';
import { ParsedFile, isImageFile, isVideoFile } from 'src/app/models'; // Updated import
import { FileTypeDetectorService } from 'src/app/services/helpers/file-type-detector.service';

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
    // Removed duplicate LikeComponent
  ],
  templateUrl: './view-videos.component.html',
  styleUrls: ['./view-videos.component.scss'],
})
export class ViewVideosComponent implements OnInit {
  selectedFile: ParsedFile | null = null; // Updated type

  constructor(
    private fileTracker: SelectedFileService,
    private fileTypeService: FileTypeDetectorService
  ) {}

  isFileListVisible = true;

  toggleFileList(): void {
    this.isFileListVisible = !this.isFileListVisible;
  }

  ngOnInit(): void {
    // Subscribe to the selected file from the FileTrackerService
    this.fileTracker.selectedFile$.subscribe((selectedFile) => {
      this.selectedFile = selectedFile;
    });
  }

  /**
   * Check if file is an image using utility function
   */
  isImage(file: ParsedFile | null): boolean {
    if (!file) return false;
    return isImageFile(file); // Uses file.subtype === 'image'
  }

  /**
   * Check if file is a video using utility function
   */
  isVideo(file: ParsedFile | null): boolean {
    if (!file) return false;
    return isVideoFile(file); // Uses file.subtype === 'video'
  }

  /**
   * Alternative: Check by file extension (fallback method)
   */
  isVideoByExtension(file: ParsedFile | null): boolean {
    const filePath = file?.path;
    return !!filePath && /\.(mp4|webm|ogg|avi|mov|mkv|flv)$/i.test(filePath);
  }

  /**
   * Alternative: Use file type detector service
   */
  isImageByService(file: ParsedFile | null): boolean {
    if (!file) return false;
    return this.fileTypeService.isImage(file);
  }

  isVideoByService(file: ParsedFile | null): boolean {
    if (!file) return false;
    return this.fileTypeService.isVideo(file);
  }
}
