import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { BaseAnalytics } from '../models/analytics.model';
import { FileInfo } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private localAnalytics: BaseAnalytics | null = null;
  private serverAnalytics: BaseAnalytics | null = null;
  private viewStartTime: number | null = null; // Tracks when the current view started

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Initialize local analytics for a new file.
   */
  initializeLocalAnalytics(file: FileInfo): void {
    this.localAnalytics = {
      lastViewed: new Date().toISOString(),
      fileId: file.id,
      fileType: file.subtype,
      totalWatchTime: 0,
      viewCount: 0,
      skips: [],
    };
    this.viewStartTime = Date.now();
  }

  initFresh(file: FileInfo) {
    if (!file) return;

    // Save the current analytics for the previously selected file
    this.saveAnalytics();

    // Reset analytics for the new file
    this.initializeLocalAnalytics(file);

    // Increment view count for the new file
    this.incrementViewCount(file.id, file.subtype);

    // Start tracking view time for the new file
    this.startViewTracking();
  }

  /**
   * Start tracking the current view time.
   */
  private startViewTracking(): void {
    this.viewStartTime = Date.now();
  }

  /**
   * Stop tracking view time and update the local analytics.
   */
  private stopViewTracking(): void {
    if (this.viewStartTime && this.localAnalytics) {
      const elapsedTime = Math.floor((Date.now() - this.viewStartTime) / 1000);
      this.localAnalytics.totalWatchTime += elapsedTime;
      this.viewStartTime = null;
    }
  }

  /**
   * Add skip analytics.
   */
  addSkipAnalytics(currentTimeInVideo: number): void {
    if (!this.localAnalytics) return;
    if (!this.localAnalytics.skips) return;
    const roundedTime = Math.round(currentTimeInVideo); // Round to nearest second
    if (roundedTime > 0) this.localAnalytics.skips.push(roundedTime);
  }

  /**
   * Increment view count on the server.
   */
  incrementViewCount(fileId: number, subtype: string): void {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/analytics/view`;

    this.http.post(apiUrl, { fileId, fileType: subtype }).subscribe({
      next: () => console.log('View count incremented successfully'),
      error: (error) => console.error('Error incrementing view count:', error),
    });
  }

  /**
   * Load server analytics for a specific file.
   */
  loadServerAnalytics(fileId: number): void {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/analytics/${fileId}`;
    this.http.get<BaseAnalytics>(apiUrl).subscribe((analytics) => {
      this.serverAnalytics = analytics || null;
    });
  }

  /**
   * Retrieve the local analytics for the current session.
   */
  getLocalAnalytics(): BaseAnalytics | null {
    return this.localAnalytics;
  }

  /**
   * Retrieve the server analytics for the current file.
   */
  getServerAnalytics(): BaseAnalytics | null {
    return this.serverAnalytics;
  }

  /**
   * Save local analytics to the server.
   */
  saveAnalytics(): void {
    this.stopViewTracking(); // Ensure current view time is included

    if (!this.localAnalytics) return;

    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/analytics/update`;
    const payload = { ...this.localAnalytics, viewCount: 0 };

    this.http.post(apiUrl, payload).subscribe({
      next: () => console.log('Analytics synced successfully.'),
      error: (error) => console.error('Error syncing analytics:', error),
    });
  }
}
