import { TestBed } from '@angular/core/testing';

import { RandomNextService } from './random-next.service';

describe('RandomNextService', () => {
  let service: RandomNextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RandomNextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
