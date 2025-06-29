import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { Analytics, ParsedAnalytics, DbFile, FullFile } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private localAnalytics: ParsedAnalytics | null = null;
  private serverAnalytics: ParsedAnalytics | null = null;
  private viewStartTime: number | null = null;

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  initializeLocalAnalytics(file: FullFile): void {
    const now = new Date().toISOString();
    this.localAnalytics = {
      id: 0,
      file_id: file.id,
      file_type: file.subtype,
      last_viewed: now,
      total_watch_time: 0,
      view_count: 0,
      skips: [],
      scroll_up_count: null,
      scroll_down_count: null,
      created_at: now,
      updated_at: now,
    };
    this.viewStartTime = Date.now();
  }

  initFresh(file: FullFile): void {
    if (!file) return;

    this.saveAnalytics();
    this.initializeLocalAnalytics(file);
    this.incrementViewCount(file.id, file.subtype);
    this.startViewTracking();
  }

  private startViewTracking(): void {
    this.viewStartTime = Date.now();
  }

  private stopViewTracking(): void {
    if (this.viewStartTime && this.localAnalytics) {
      const elapsedSeconds = Math.floor(
        (Date.now() - this.viewStartTime) / 1000
      );
      this.localAnalytics.total_watch_time += elapsedSeconds;
      this.viewStartTime = null;
    }
  }

  addSkipAnalytics(currentTimeInVideo: number): void {
    if (!this.localAnalytics) return;
    const roundedTime = Math.round(currentTimeInVideo);
    if (roundedTime > 0) {
      this.localAnalytics.skips = this.localAnalytics.skips || [];
      this.localAnalytics.skips.push({ time: roundedTime, count: 1 });
    }
  }

  incrementViewCount(fileId: number, fileType: string): void {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/analytics/view`;
    this.http.post(apiUrl, { fileId, fileType }).subscribe({
      next: () => console.log('View count incremented successfully'),
      error: (err) => console.error('Error incrementing view count:', err),
    });
  }

  loadServerAnalytics(fileId: number): void {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/analytics/${fileId}`;
    this.http.get<Analytics>(apiUrl).subscribe({
      next: (analytics) =>
        (this.serverAnalytics = analytics
          ? this.parseAnalytics(analytics)
          : null),
      error: (err) => console.error('Error loading server analytics:', err),
    });
  }

  getLocalAnalytics(): ParsedAnalytics | null {
    return this.localAnalytics;
  }

  getServerAnalytics(): ParsedAnalytics | null {
    return this.serverAnalytics;
  }

  saveAnalytics(): void {
    this.stopViewTracking();
    if (!this.localAnalytics?.file_id || !this.localAnalytics.file_type) return;

    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/analytics/update`;

    // Before sending, stringify skips array for DB
    const payload: Analytics = {
      ...this.localAnalytics,
      skips: JSON.stringify(this.localAnalytics.skips || []),
    };

    this.http.post(apiUrl, payload).subscribe({
      next: () => console.log('Analytics synced successfully.'),
      error: (err) => console.error('Error syncing analytics:', err),
    });
  }

  private parseAnalytics(dbAnalytics: Analytics): ParsedAnalytics {
    return {
      ...dbAnalytics,
      skips: dbAnalytics.skips ? JSON.parse(dbAnalytics.skips) : [],
    };
  }
}
