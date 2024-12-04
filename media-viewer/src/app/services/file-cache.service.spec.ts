import { TestBed } from '@angular/core/testing';

import { FileCacheService } from './file-cache.service';

describe('FileCacheService', () => {
  let service: FileCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
