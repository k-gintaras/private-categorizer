import { TestBed } from '@angular/core/testing';

import { VideoAnalyticsService } from './video-analytics.service';

describe('VideoAnalyticsService', () => {
  let service: VideoAnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoAnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
