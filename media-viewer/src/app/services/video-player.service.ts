import { Injectable, ElementRef, OnDestroy } from '@angular/core';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import { ApiConfigService } from './api-config.service';
import { AnalyticsService } from './video-analytics.service';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService implements OnDestroy {
  private player!: Player;

  constructor(
    private analyticsService: AnalyticsService,
    private apiConfigService: ApiConfigService
  ) {}

  /**
   * Initialize the video player and local analytics.
   * @param videoElement The video element reference.
   * @param f The FileInfo to use.
   * @param analytics Initial analytics for the video, if available.
   */
  initializePlayer(videoElement: ElementRef, f: FileInfo): Player {
    const videoUrl = this.getFullVideoUrl(f.path);

    if (!this.player) {
      const options = {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        aspectRatio: '16:9',
        sources: [
          {
            src: videoUrl,
            type: f.path.endsWith('.flv') ? 'video/x-flv' : 'video/mp4',
          },
        ],
      };

      this.player = videojs(videoElement.nativeElement, options);
      this.setupEventListeners();
    } else {
      this.updateVideoSource(f);
    }

    return this.player;
  }

  private setupEventListeners(): void {
    this.player.on('play', () => {
      this.analyticsService.addSkipAnalytics(this.getCurrentPlayTime());
    });
  }
  /**
   * Update the video source when switching videos.
   * @param path The video path.
   */
  updateVideoSource(file: FileInfo): void {
    const path = file.path;
    if (!this.player) {
      console.error('Player not initialized.');
      return;
    }

    const videoUrl = this.getFullVideoUrl(path);

    this.player.src({
      src: videoUrl,
      type: path.endsWith('.flv') ? 'video/x-flv' : 'video/mp4',
    });

    this.player.load(); // Ensure the player loads the new source
    this.player.play(); // Optionally autoplay the new video

    // Subscribe to selected file changes
    this.analyticsService.initFresh(file);
  }

  /**
   * Retrieve the current playback time of the video.
   * @returns The current playback time in seconds.
   */
  getCurrentPlayTime(): number {
    return this.player?.currentTime() || 0;
  }

  skip(seconds: number): void {
    if (this.player) {
      const newTime = (this.player.currentTime() || 0) + seconds;
      this.player.currentTime(newTime);
    } else {
      console.warn('Player is not initialized.');
    }
  }

  private getFullVideoUrl(path: string): string {
    const baseUrl = this.apiConfigService.getApiBaseUrl();
    return `${baseUrl}/static${path}`; // Construct the full URL
  }

  disposePlayer(): void {
    if (this.player) {
      this.player.dispose();
      this.player = undefined!;
    }
  }

  ngOnDestroy(): void {
    this.disposePlayer();
  }
}
