import { TestBed } from '@angular/core/testing';

import { MediaServiceService } from './media-service.service';

describe('MediaServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MediaServiceService = TestBed.get(MediaServiceService);
    expect(service).toBeTruthy();
  });
});
