import { TestBed } from '@angular/core/testing';

import { SelectedFileService } from './selected-file.service';

describe('SelectedFileService', () => {
  let service: SelectedFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SelectedFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
