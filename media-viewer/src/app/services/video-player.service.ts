import { Injectable, ElementRef, OnDestroy } from '@angular/core';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import { ApiConfigService } from './api-config.service';
import { AnalyticsService } from './video-analytics.service';
import { DbFile, FullFile } from '../models';

@Injectable({
  providedIn: 'root',
})
export class VideoPlayerService implements OnDestroy {
  private player?: Player;

  constructor(
    private analyticsService: AnalyticsService,
    private apiConfigService: ApiConfigService
  ) {}

  /**
   * Initialize the video player and local analytics.
   * @param videoElement The video element reference.
   * @param file The DbFile to use.
   */
  initializePlayer(videoElement: ElementRef, file: FullFile): Player {
    const videoUrl = this.getFullVideoUrl(file.path);

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
            type: file.path.toLowerCase().endsWith('.flv')
              ? 'video/x-flv'
              : 'video/mp4',
          },
        ],
      };

      this.player = videojs(videoElement.nativeElement, options);
      this.setupEventListeners();
    } else {
      this.updateVideoSource(file);
    }

    return this.player;
  }

  private setupEventListeners(): void {
    this.player?.on('play', () => {
      this.analyticsService.addSkipAnalytics(this.getCurrentPlayTime());
    });
  }

  /**
   * Update the video source when switching videos.
   * @param file The DbFile object.
   */
  updateVideoSource(file: FullFile): void {
    if (!this.player) {
      console.error('Player not initialized.');
      return;
    }

    const videoUrl = this.getFullVideoUrl(file.path);

    this.player.src({
      src: videoUrl,
      type: file.path.toLowerCase().endsWith('.flv')
        ? 'video/x-flv'
        : 'video/mp4',
    });

    this.player.load();
    this.player.play();

    this.analyticsService.initFresh(file);
  }

  /**
   * Retrieve the current playback time of the video.
   */
  getCurrentPlayTime(): number {
    return this.player?.currentTime() ?? 0;
  }

  skip(seconds: number): void {
    if (this.player) {
      const newTime = (this.player.currentTime() ?? 0) + seconds;
      this.player.currentTime(newTime);
    } else {
      console.warn('Player is not initialized.');
    }
  }

  private getFullVideoUrl(path: string): string {
    const baseUrl = this.apiConfigService.getApiBaseUrl();
    return `${baseUrl}/static${path}`;
  }

  disposePlayer(): void {
    if (this.player) {
      this.player.dispose();
      this.player = undefined;
    }
  }

  ngOnDestroy(): void {
    this.disposePlayer();
  }
}
