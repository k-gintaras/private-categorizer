import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface VideoAnalytics {
  videoPath: string;
  playCount: number;
  skips: number[];
}

@Injectable({
  providedIn: 'root',
})
export class VideoAnalyticsService {
  private apiUrl = 'http://localhost:3000/analytics';

  constructor(private http: HttpClient) {}

  updateAnalytics(
    videoPath: string,
    playCount: number,
    skips: number[]
  ): Observable<any> {
    const data: VideoAnalytics = {
      videoPath,
      playCount,
      skips: skips || [],
    };

    console.log('Sending analytics update:', data);
    return this.http.post(this.apiUrl, data);
  }

  getAnalytics(videoPath: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${encodeURIComponent(videoPath)}`);
  }
}
