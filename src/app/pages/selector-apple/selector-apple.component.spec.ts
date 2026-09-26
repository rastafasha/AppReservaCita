import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorAppleComponent } from './selector-apple.component';

describe('SelectorAppleComponent', () => {
  let component: SelectorAppleComponent;
  let fixture: ComponentFixture<SelectorAppleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorAppleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectorAppleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
