import { NgIf } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';

import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import { VideoAnalyticsService } from '../../../services/video-analytics.service';

@Component({
  selector: 'app-video-view',
  standalone: true,
  imports: [],
  templateUrl: './video-view.component.html',
  styleUrls: ['./video-view.component.scss'],
})
export class VideoViewComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() videoPath!: string | null;
  @ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  player!: Player;

  private currentVideoPath: string | null = null;
  private hasPlayedCurrentVideo = false;
  private skips: number[] = [];

  constructor(private analyticsService: VideoAnalyticsService) {}

  ngAfterViewInit(): void {
    if (this.videoPath) {
      this.initializePlayer(this.videoPath);
      this.currentVideoPath = this.videoPath;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoPath'] && !changes['videoPath'].firstChange) {
      const newPath = changes['videoPath'].currentValue;
      if (newPath) {
        this.updatePlayerSource(newPath);
        // Reset analytics for new video
        this.hasPlayedCurrentVideo = false;
        this.skips = [];
        this.currentVideoPath = newPath;
      }
    }
  }

  initializePlayer(path: string): void {
    const options = {
      autoplay: false,
      controls: true,
      responsive: false,
      width: 640,
      height: 360,
      sources: [
        {
          src: `http://localhost:3000/static${path}`,
          type: path.endsWith('.flv') ? 'video/x-flv' : 'video/mp4',
        },
      ],
    };

    this.player = videojs(this.videoElement.nativeElement, options);

    // Set up event listeners
    this.player.on('play', () => this.handlePlay());
  }

  handlePlay(): void {
    if (this.currentVideoPath) {
      if (!this.hasPlayedCurrentVideo) {
        // First time play - mark as played
        this.hasPlayedCurrentVideo = true;
        this.analyticsService
          .updateAnalytics(this.currentVideoPath, 1, [])
          .subscribe();
      } else {
        // Subsequent plays are tracked as skips
        const currentTime = this.player.currentTime();
        if (!currentTime) return;
        this.skips = [...this.skips, currentTime].slice(-10); // Keep only last 10 skips

        this.analyticsService
          .updateAnalytics(this.currentVideoPath, 0, this.skips)
          .subscribe();
      }
    }
  }

  updatePlayerSource(path: string): void {
    if (this.player) {
      this.player.src({
        src: `http://localhost:3000/static${path}`,
        type: path.endsWith('.flv') ? 'video/x-flv' : 'video/mp4',
      });
    } else {
      this.initializePlayer(path);
    }
  }

  ngOnDestroy(): void {
    if (this.player) {
      this.player.dispose();
    }
  }
}
