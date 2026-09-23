import { TestBed } from '@angular/core/testing';

import { SubdominioService } from './subdominio.service';

describe('SubdominioService', () => {
  let service: SubdominioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubdominioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
