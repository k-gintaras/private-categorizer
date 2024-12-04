import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { VideoPlayerService } from '../../../services/video-player.service';
import { SelectedFileService } from '../../../services/selected-file.service';

@Component({
  selector: 'app-video-view',
  templateUrl: './video-view.component.html',
  styleUrls: ['./video-view.component.scss'],
})
export class VideoViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;

  constructor(
    private videoPlayerService: VideoPlayerService,
    private selectedFileService: SelectedFileService
  ) {}

  ngAfterViewInit(): void {
    // Initialize the player once the video element is available
    const initialFile = this.selectedFileService.getSelectedFile();
    if (initialFile) {
      this.videoPlayerService.initializePlayer(this.videoElement, initialFile);
    }

    // Subscribe to file changes after player initialization
    this.selectedFileService.selectedFile$.subscribe((fileInfo) => {
      if (fileInfo && fileInfo.isFull) {
        if (fileInfo.subtype === 'video')
          this.videoPlayerService.updateVideoSource(fileInfo);
      }
    });
  }

  ngOnDestroy(): void {
    this.videoPlayerService.disposePlayer();
  }
}
