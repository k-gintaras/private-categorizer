import { Component } from '@angular/core';
import { RandomNextService } from '../../services/random-next.service';
import { SelectedFileService } from '../../services/selected-file.service';
import { VideoPlayerService } from '../../services/video-player.service';
import { ParsedFile } from '../../models'; // Updated import

@Component({
  selector: 'app-video-controls',
  templateUrl: './video-controls.component.html',
  styleUrls: ['./video-controls.component.scss'],
})
export class VideoControlsComponent {
  private fileHistory: ParsedFile[] = []; // Updated type - Stack to track previously played files

  constructor(
    private selectedFileService: SelectedFileService,
    private randomNextService: RandomNextService,
    private videoPlayerService: VideoPlayerService
  ) {
    // Track the currently selected file
    this.selectedFileService.selectedFile$.subscribe((file) => {
      if (file) {
        // Push the previous file to the history stack before switching
        // const currentFile = this.getCurrentFile();
        // if (currentFile && currentFile.id !== file.id) {
        // }
        this.fileHistory.push(file);
        console.log('File ID:', file.id);
        console.log('History length:', this.fileHistory.length);
      }
    });
  }

  /**
   * Play the previously loaded file.
   */
  playPrevious(): void {
    if (this.fileHistory.length > 0) {
      this.fileHistory.pop(); // Remove current file
      const previousFile = this.fileHistory.pop(); // Get the last file in the stack
      if (previousFile) {
        this.selectedFileService.selectFile(previousFile.id);
      }
    } else {
      console.warn('No previous file to play.');
    }
  }

  /**
   * Skip forward in the video by the specified number of seconds.
   * @param seconds Number of seconds to skip forward
   */
  skipVideo(seconds: number): void {
    this.videoPlayerService.skip(seconds);
  }

  /**
   * Play a random next video.
   */
  playNextRandom(): void {
    this.randomNextService.playNextRandom();
    // this.skipVideo(30);
  }

  /**
   * Get the currently selected file.
   * @returns The current file or null if no file is selected
   */
  private getCurrentFile(): ParsedFile | null {
    return this.selectedFileService.getSelectedFile();
  }
}
